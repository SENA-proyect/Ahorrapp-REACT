const pool = require("../db/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const register = async (req, res) => {
  const { nombre, apellido, correo, password } = req.body;

  try {
    // Verificar si el correo ya existe
    const [existingUser] = await pool.query(
      "SELECT ID_usuario FROM USUARIOS WHERE Email = ?",
      [correo]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El correo ya está registrado",
      });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar el nuevo usuario
    const [result] = await pool.query(
      "INSERT INTO USUARIOS (Nombre, Apellido, Email, Password_hash) VALUES (?, ?, ?, ?)",
      [nombre, apellido, correo, passwordHash]
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado exitosamente",
      id: result.insertId,
    });

  } catch (error) {
    console.error("Error en register:", error.message);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
};

const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    // Buscar el usuario por correo
    const [rows] = await pool.query(
      "SELECT * FROM USUARIOS WHERE Email = ? AND Activo = TRUE",
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const usuario = rows[0];

    // Verificar la contraseña
    const passwordValida = await bcrypt.compare(password, usuario.Password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    // Generar el token JWT
    const token = jwt.sign(
      {
        id: usuario.ID_usuario,
        nombre: usuario.Nombre,
        rol: usuario.Rol,
      },
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
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
};

const getUsuarios = async (req, res) => {
  try {
    if (req.usuario.rol !== 'Administrador') {
      return res.status(403).json({ ok: false, mensaje: "Acceso denegado" });
    }

    const [rows] = await pool.query(
      `SELECT ID_usuario, Nombre, Apellido, Email, Rol, Activo, Fecha_registro
       FROM USUARIOS
       ORDER BY Fecha_registro DESC`
    );

    return res.status(200).json({ ok: true, usuarios: rows });
  } catch (error) {
    console.error("Error en getUsuarios:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = { register, login };

// NOTA: login busca el usuario por correo verificando que esté activo, compara la contraseña contra el hash, y si todo está bien genera un JWT con el ID, nombre y rol del usuario adentro.