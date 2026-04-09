const pool = require("../db/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const register = async (req, res) => {
  const { Nombre, Apellido, Email, Password_hash } = req.body;

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

const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ID_usuario, Nombre, Apellido, Email, Rol, Activo 
       FROM usuarios 
       WHERE Activo = TRUE`
    );
    return res.status(200).json({
      ok: true,
      cantidad: rows.length,
      usuarios: rows
    });
  } catch (error) {
    console.error("Error en los datos a encontrar.", error.message);

    return res.status(500).json({
      ok: false,
      mensaje: "No fue posible obtener los usuarios",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { Nombre, Apellido, Email, Rol } = req.body;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido"
      });
    }

    const [existe] = await pool.query(
      "SELECT ID_usuario FROM usuarios WHERE ID_usuario = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado"
      });
    }

    await pool.query(
      "UPDATE usuarios SET Nombre = ?, Apellido = ?, Email = ?, Rol = ? WHERE ID_usuario = ?",
      [Nombre, Apellido, Email, Rol, id]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Usuario actualizado exitosamente"
    });

  } catch (error) {
    console.error("Error en updateUsuario:", error.message);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar usuario"
    });
  }
};

const deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido"
      });
    }

    const [existe] = await pool.query(
      "SELECT ID_usuario FROM usuarios WHERE ID_usuario = ?",
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado"
      });
    }

    await pool.query(
      "UPDATE usuarios SET Activo = FALSE WHERE ID_usuario = ?",
      [id]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Usuario eliminado exitosamente"
    });

  } catch (error) {
    console.error("Error en deleteUsuario:", error.message);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar usuario"
    });
  }
};

module.exports = { register, login, getUsuarios, updateUsuario, deleteUsuario };

// NOTA: login busca el usuario por correo verificando que esté activo, compara la contraseña contra el hash, y si todo está bien genera un JWT con el ID, nombre y rol del usuario adentro. 