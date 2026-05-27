const pool = require("../db/connection"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ── Helper de errores ────────────────────────────────────────────────────────
const handleServerError = (res, error, msg) => {
  console.error(`${msg}:`, error.message);

  return res.status(500).json({
    ok: false,
    mensaje: msg,
  });
};

// ── POST /register ───────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { Nombre, Apellido, Email, Password_hash } = req.body;

  if (!Email || !Password_hash) {
    return res.status(400).json({
      ok: false,
      mensaje: "Datos incompletos",
    });
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT ID_usuario FROM USUARIOS WHERE Email = ?",
      [Email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El correo ya está registrado",
      });
    }

    const passwordHash = await bcrypt.hash(Password_hash, 10);

    const [result] = await pool.query(
      "INSERT INTO USUARIOS (Nombre, Apellido, Email, Password_hash) VALUES (?, ?, ?, ?)",
      [Nombre, Apellido, Email, passwordHash]
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado exitosamente",
      id: result.insertId,
    });

  } catch (error) {
    return handleServerError(res, error, "Error en registro");
  }
};

// ── POST /login ──────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { Email, Password_hash } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM USUARIOS WHERE Email = ? AND Activo = TRUE",
      [Email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const usuario = rows[0];

    const passwordValida = await bcrypt.compare(
      Password_hash,
      usuario.Password_hash
    );

    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const token = jwt.sign(
      {
        id: usuario.ID_usuario,
        rol: usuario.Rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.ID_usuario,
        nombre: usuario.Nombre,
        apellido: usuario.Apellido,
        email: usuario.Email,
        rol: usuario.Rol,
      },
    });

  } catch (error) {
    return handleServerError(res, error, "Error en login");
  }
};

// ── GET /PanelUsuarios ───────────────────────────────────────────────────────
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ID_usuario, Nombre, Apellido, Email, Rol, Activo
      FROM USUARIOS
      WHERE Activo = TRUE
    `);

    return res.status(200).json({
      ok: true,
      cantidad: rows.length,
      usuarios: rows,
    });

  } catch (error) {
    return handleServerError(res, error, "Error al obtener usuarios");
  }
};

// ── PUT /PanelUsuarios/:id ───────────────────────────────────────────────────
const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { Nombre, Apellido, Email, Rol } = req.body;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido",
      });
    }

    const [existe] = await pool.query(
      "SELECT ID_usuario FROM USUARIOS WHERE ID_usuario = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    await pool.query(
      "UPDATE USUARIOS SET Nombre = ?, Apellido = ?, Email = ?, Rol = ? WHERE ID_usuario = ?",
      [Nombre, Apellido, Email, Rol, id]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Usuario actualizado exitosamente",
    });

  } catch (error) {
    return handleServerError(res, error, "Error al actualizar usuario");
  }
};

// ── DELETE /PanelUsuarios/:id ────────────────────────────────────────────────
const deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido",
      });
    }

    const [existe] = await pool.query(
      "SELECT ID_usuario FROM USUARIOS WHERE ID_usuario = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    await pool.query(
      "UPDATE USUARIOS SET Activo = FALSE WHERE ID_usuario = ?",
      [id]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Usuario eliminado exitosamente",
    });

  } catch (error) {
    return handleServerError(res, error, "Error al eliminar usuario");
  }
};
// ── GetUsuariosPanelAdmin/PanelAdmin/:id ────────────────────────────────────────────────
const getUsuariosPanelAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query (
      "SELECT COUNT(*) AS totalUsuarios FROM usuarios"
    );
    res.json({
      totalUsuarios: rows.length > 0 ? rows[0].totalUsuarios : 0,
    })
  } catch (error){
    console.error('Error al contar usuarios:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener usuarios'
    });
  }
};

const getDependientesPanelAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query (
      "SELECT COUNT(*) AS totalDependientes FROM dependientes"
    )
    res.json ({
      totalDependientes: rows.length > 0 ? rows [0].totalDependientes : 0,
    })
  } catch (error){
    console.error('Error al contar dependientes:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener dependientes'
    });
  }
};


module.exports = {
  register,
  login,
  getUsuarios,
  updateUsuario,
  deleteUsuario,
  getUsuariosPanelAdmin,
  getDependientesPanelAdmin
};