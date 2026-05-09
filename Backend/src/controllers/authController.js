const pool = require("../db/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper para manejar errores y no repetir catch en todo lado
const handleServerError = (res, error, msg) => {
  console.error(`${msg}:`, error.message);
  return res.status(500).json({ ok: false, mensaje: msg });
};

const register = async (req, res) => {
  const { Nombre, Apellido, Email, Password_hash } = req.body;
  if (!Email || !Password_hash) return res.status(400).json({ ok: false, mensaje: "Datos incompletos" });

  try {
    const [existingUser] = await pool.query("SELECT ID_usuario FROM USUARIOS WHERE Email = ?", [Email]);
    if (existingUser.length > 0) return res.status(400).json({ ok: false, mensaje: "El correo ya está registrado" });

    const passwordHash = await bcrypt.hash(Password_hash, 10);
    const [result] = await pool.query(
      "INSERT INTO USUARIOS (Nombre, Apellido, Email, Password_hash) VALUES (?, ?, ?, ?)",
      [Nombre, Apellido, Email, passwordHash]
    );

    return res.status(201).json({ ok: true, mensaje: "Usuario registrado exitosamente", id: result.insertId });
  } catch (error) { return handleServerError(res, error, "Error en registro"); }
};

const login = async (req, res) => {
  const { Email, Password_hash } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM USUARIOS WHERE Email = ? AND Activo = TRUE", [Email]);
    const usuario = rows[0];

    // Simplificación: si no hay usuario o la clave no coincide
    if (!usuario || !(await bcrypt.compare(Password_hash, usuario.Password_hash))) {
      return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: usuario.ID_usuario, nombre: usuario.Nombre, rol: usuario.Rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      ok: true,
      token,
      usuario: { id: usuario.ID_usuario, nombre: usuario.Nombre, email: usuario.Email, rol: usuario.Rol }
    });
  } catch (error) { return handleServerError(res, error, "Error en login"); }
};

const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT ID_usuario, Nombre, Apellido, Email, Rol, Activo FROM USUARIOS WHERE Activo = TRUE");
    return res.status(200).json({ ok: true, cantidad: rows.length, usuarios: rows });
  } catch (error) { return handleServerError(res, error, "Error al obtener usuarios"); }
};

const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { Nombre, Apellido, Email, Rol } = req.body;

  try {
    // Disparar el UPDATE directamente y revisar result.affectedRows
    const [result] = await pool.query(
      "UPDATE USUARIOS SET Nombre = ?, Apellido = ?, Email = ?, Rol = ? WHERE ID_usuario = ?",
      [Nombre, Apellido, Email, Rol, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    return res.status(200).json({ ok: true, mensaje: "Usuario actualizado" });
  } catch (error) { return handleServerError(res, error, "Error al actualizar"); }
};

const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("UPDATE USUARIOS SET Activo = FALSE WHERE ID_usuario = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    return res.status(200).json({ ok: true, mensaje: "Usuario eliminado" });
  } catch (error) { return handleServerError(res, error, "Error al eliminar"); }
};

module.exports = { register, login, getUsuarios, updateUsuario, deleteUsuario };
