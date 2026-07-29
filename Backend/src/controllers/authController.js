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

    // Asigna el rol por defecto (ID_rol = 1 → "user") al usuario recién creado
    await pool.query(
      "INSERT INTO usuarios_roles (ID_usuario, ID_rol) VALUES (?, ?)",
      [result.insertId, 1]
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

    // Trae los roles del usuario uniendo la tabla puente con la tabla de roles
    const [rolesRows] = await pool.query(
      `SELECT r.Cargo
       FROM usuarios_roles ur
       INNER JOIN rol r ON ur.ID_rol = r.ID_rol
       WHERE ur.ID_usuario = ?`,
      [usuario.ID_usuario]
    );

    // Pasamos todo a minúscula para que coincida con lo que espera el frontend
    const roles = rolesRows.map((fila) => fila.Cargo.toLowerCase());

    const token = jwt.sign(
      {
        id: usuario.ID_usuario,
        roles,
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
        roles,
      },
    });

  } catch (error) {
    return handleServerError(res, error, "Error en login");
  }
};

// ── GET /PanelUsuarios (incluye el rol actual de cada usuario) ──────────────
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT U.ID_usuario, U.Nombre, U.Apellido, U.Email, U.Activo, R.ID_rol, R.Cargo
      FROM USUARIOS U
      LEFT JOIN usuarios_roles UR ON U.ID_usuario = UR.ID_usuario
      LEFT JOIN rol R ON UR.ID_rol = R.ID_rol
      WHERE U.Activo = TRUE
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
  const { Nombre, Apellido, Email } = req.body;

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
      "UPDATE USUARIOS SET Nombre = ?, Apellido = ?, Email = ? WHERE ID_usuario = ?",
      [Nombre, Apellido, Email, id]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Usuario actualizado exitosamente",
    });

  } catch (error) {
    return handleServerError(res, error, "Error al actualizar usuario");
  }
};

// ── PUT /PanelUsuarios/:id/rol (solo superuser) ──────────────────────────────
const actualizarRolUsuario = async (req, res) => {
  const { id } = req.params;
  const { ID_rol } = req.body;

  if (!ID_rol) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debes indicar el rol",
    });
  }

  try {
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
      "UPDATE usuarios_roles SET ID_rol = ? WHERE ID_usuario = ?",
      [ID_rol, id]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Rol actualizado exitosamente",
    });

  } catch (error) {
    return handleServerError(res, error, "Error al actualizar el rol");
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

const getTodosDependientesAdmin = async (req, res) => {
  try {
    console.log('Entró a PanelDependientes');

    const [rows] = await pool.query(`
      SELECT
        D.ID_dependientes,
        D.Nombre,
        D.Relacion,
        D.Ocupacion,
        D.Fecha_nacimiento,
        D.ID_usuario,
        U.Nombre AS usuario_nombre
      FROM DEPENDIENTES D
      INNER JOIN USUARIOS U ON D.ID_usuario = U.ID_usuario
      ORDER BY U.Nombre, D.Nombre
    `);

    console.log('Dependientes encontrados:', rows);

    return res.json({
      ok: true,
      dependientes: rows,
    });

  } catch (error) {
    console.error('Error al obtener dependientes:', error);

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
  actualizarRolUsuario,
  deleteUsuario,
  getUsuariosPanelAdmin,
  getDependientesPanelAdmin, 
  getTodosDependientesAdmin,
};