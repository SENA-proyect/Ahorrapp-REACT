const pool = require("../db/connection"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendResetCodeEmail } = require("../service/MailService");
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

// ── POST /forgot-password ────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { Email } = req.body;

  if (!Email) {
    return res.status(400).json({
      ok: false,
      mensaje: "El correo es requerido",
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT ID_usuario, Email FROM USUARIOS WHERE Email = ? AND Activo = TRUE",
      [Email]
    );

    // Respuesta genérica aunque no exista el usuario (evita enumeración de emails)
    if (rows.length === 0) {
      return res.status(200).json({
        ok: true,
        mensaje: "Si el correo está registrado, recibirás un código de verificación",
      });
    }

    const usuario = rows[0];

    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await pool.query(
      "UPDATE USUARIOS SET Reset_code = ?, Reset_code_expires = ? WHERE ID_usuario = ?",
      [hashedCode, expires, usuario.ID_usuario]
    );

    await sendResetCodeEmail(usuario.Email, code);

    return res.status(200).json({
      ok: true,
      mensaje: "Si el correo está registrado, recibirás un código de verificación",
    });

  } catch (error) {
    return handleServerError(res, error, "Error al procesar la solicitud de recuperación");
  }
};

// ── POST /verify-reset-code ──────────────────────────────────────────────────
const verifyResetCode = async (req, res) => {
  const { Email, code } = req.body;

  if (!Email || !code) {
    return res.status(400).json({
      ok: false,
      mensaje: "Todos los campos son requeridos",
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT ID_usuario, Reset_code, Reset_code_expires FROM USUARIOS WHERE Email = ?",
      [Email]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Código inválido o expirado",
      });
    }

    const usuario = rows[0];

    if (!usuario.Reset_code || !usuario.Reset_code_expires) {
      return res.status(400).json({
        ok: false,
        mensaje: "Código inválido o expirado",
      });
    }

    if (new Date() > new Date(usuario.Reset_code_expires)) {
      await pool.query(
        "UPDATE USUARIOS SET Reset_code = NULL, Reset_code_expires = NULL WHERE ID_usuario = ?",
        [usuario.ID_usuario]
      );

      return res.status(400).json({
        ok: false,
        mensaje: "El código ha expirado",
      });
    }

    const codigoValido = await bcrypt.compare(code, usuario.Reset_code);

    if (!codigoValido) {
      return res.status(400).json({
        ok: false,
        mensaje: "Código inválido",
      });
    }

    // Código correcto: se invalida para que no pueda reutilizarse
    await pool.query(
      "UPDATE USUARIOS SET Reset_code = NULL, Reset_code_expires = NULL WHERE ID_usuario = ?",
      [usuario.ID_usuario]
    );

    // Token temporal que prueba que el usuario ya pasó la verificación
    const resetToken = jwt.sign(
      { id: usuario.ID_usuario, purpose: "reset_password" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Código verificado correctamente",
      resetToken,
    });

  } catch (error) {
    return handleServerError(res, error, "Error al verificar el código");
  }
};

// ── POST /reset-password ─────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { resetToken, nuevaPassword } = req.body;

  if (!resetToken || !nuevaPassword) {
    return res.status(400).json({
      ok: false,
      mensaje: "Todos los campos son requeridos",
    });
  }

  if (nuevaPassword.length < 8) {
    return res.status(400).json({
      ok: false,
      mensaje: "La contraseña debe tener al menos 8 caracteres",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje: "El proceso de recuperación expiró, solicita un nuevo código",
    });
  }

  if (decoded.purpose !== "reset_password") {
    return res.status(401).json({
      ok: false,
      mensaje: "Token inválido",
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT ID_usuario FROM USUARIOS WHERE ID_usuario = ? AND Activo = TRUE",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, 10);

    await pool.query(
      "UPDATE USUARIOS SET Password_hash = ? WHERE ID_usuario = ?",
      [passwordHash, decoded.id]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Contraseña actualizada exitosamente",
    });

  } catch (error) {
    return handleServerError(res, error, "Error al restablecer la contraseña");
  }
};

// ── GET /PanelUsuarios ───────────────────────────────────────────────────────
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ID_usuario, Nombre, Apellido, Email, Activo
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
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getUsuarios,
  updateUsuario,
  deleteUsuario,
  getUsuariosPanelAdmin,
  getDependientesPanelAdmin, 
  getTodosDependientesAdmin,
};