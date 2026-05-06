const pool = require("../db/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ── POST /register ───────────────────────────────────────────────────────────
const register = async (req, res) => {
  console.log('Datos recibidos en /register:', req.body);
  const { nombre, apellido, correo, password } = req.body;

  try {
    const [existingUser] = await pool.query(
      "SELECT ID_usuario FROM USUARIOS WHERE Email = ?",
      [correo]
    );
    console.log('Resultado existingUser:', existingUser);

    if (existingUser.length > 0) {
      return res.status(400).json({ ok: false, mensaje: "El correo ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let result;
    try {
      [result] = await pool.query(
        "INSERT INTO USUARIOS (Nombre, Apellido, Email, Password_hash) VALUES (?, ?, ?, ?)",
        [nombre, apellido, correo, passwordHash]
      );
      console.log('Resultado INSERT:', result);
    } catch (insertErr) {
      console.error('Error en INSERT:', insertErr);
      return res.status(500).json({ ok: false, mensaje: 'Error al insertar usuario', error: insertErr.message });
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado exitosamente",
      id: result.insertId,
    });

  } catch (error) {
    console.error("Error en register:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── POST /login ──────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM USUARIOS WHERE Email = ? AND Activo = TRUE",
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos" });
    }

    const usuario = rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.Password_hash);

    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: usuario.ID_usuario, nombre: usuario.Nombre, rol: usuario.Rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
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
    console.error("Error en login:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ── GET /PanelUsuarios ───────────────────────────────────────────────────────
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ID_usuario, Nombre, Apellido, Email, Rol, Activo 
       FROM USUARIOS 
       WHERE Activo = TRUE`
    );
    return res.status(200).json({ ok: true, cantidad: rows.length, usuarios: rows });
  } catch (error) {
    console.error("Error en getUsuarios:", error.message);
    return res.status(500).json({ ok: false, mensaje: "No fue posible obtener los usuarios" });
  }
};

// ── PUT /PanelUsuarios/:id ───────────────────────────────────────────────────
const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { Nombre, Apellido, Email, Rol } = req.body;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID inválido" });
    }

    const [existe] = await pool.query(
      "SELECT ID_usuario FROM USUARIOS WHERE ID_usuario = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    await pool.query(
      "UPDATE USUARIOS SET Nombre = ?, Apellido = ?, Email = ?, Rol = ? WHERE ID_usuario = ?",
      [Nombre, Apellido, Email, Rol, id]
    );

    return res.status(200).json({ ok: true, mensaje: "Usuario actualizado exitosamente" });

  } catch (error) {
    console.error("Error en updateUsuario:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error al actualizar usuario" });
  }
};

// ── DELETE /PanelUsuarios/:id ────────────────────────────────────────────────
const deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID inválido" });
    }

    const [existe] = await pool.query(
      "SELECT ID_usuario FROM USUARIOS WHERE ID_usuario = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    await pool.query(
      "UPDATE USUARIOS SET Activo = FALSE WHERE ID_usuario = ?",
      [id]
    );

    return res.status(200).json({ ok: true, mensaje: "Usuario eliminado exitosamente" });

  } catch (error) {
    console.error("Error en deleteUsuario:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error al eliminar usuario" });
  }
};

module.exports = { register, login, getUsuarios, updateUsuario, deleteUsuario };