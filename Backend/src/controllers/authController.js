const pool = require("../db/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const register = async (req, res) => {
  const { Nombre, Apellido, Email, Password_hash } = req.body;

  try {
    // Verificar si el correo ya existe
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

    // Hashear la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(Password_hash, saltRounds);

    // Insertar el nuevo usuario
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
    console.error("Error en register:", error.message);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
};

const login = async (req, res) => {
  const { Email, Password_hash } = req.body;

  try {
    // Buscar el usuario por correo
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

    // Verificar la contraseña
    const passwordValida = await bcrypt.compare(Password_hash, usuario.Password_hash);

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

const getUsuarios = async (req, res)

module.exports = { register, login, getUsuarios };

// NOTA: login busca el usuario por correo verificando que esté activo, compara la contraseña contra el hash, y si todo está bien genera un JWT con el ID, nombre y rol del usuario adentro. 