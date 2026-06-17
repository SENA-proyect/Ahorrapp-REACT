const pool = require("../db/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail, generateVerificationCode } = require("../config/email");
require("dotenv").config();

// ── Helper de errores ────────────────────────────────────────────────────────
const handleServerError = (res, error, msg) => {
  console.error(`${msg}:`, error);
    return res.status(500).json({
      ok: false,
      mensaje: msg,
      detalle: error?.message,
      nombreError: error?.name,
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
    
    // Generar código de verificación de 6 dígitos
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    const [result] = await pool.query(
      "INSERT INTO USUARIOS (Nombre, Apellido, Email, Password_hash, verification_code, code_expires_at, email_verified) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [Nombre, Apellido, Email, passwordHash, verificationCode, codeExpiresAt]
    );

    // Enviar email de verificación
    await sendVerificationEmail(Email, verificationCode);

    return res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado. Revisa tu correo para verificar.",
      id: result.insertId,
    });
  } catch (error) {
    return handleServerError(res, error, "Error en registro");
  }
};

// ── POST /verify-email ───────────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const [users] = await pool.query(
      "SELECT * FROM USUARIOS WHERE Email = ? AND verification_code = ?",
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Código inválido",
      });
    }

    const user = users[0];

    // Verificar si el código expiró
    if (new Date() > new Date(user.code_expires_at)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El código ha expirado. Solicita uno nuevo.",
      });
    }

    // Verificar si ya está verificado
    if (user.email_verified === 1) {
      return res.status(400).json({
        ok: false,
        mensaje: "El correo ya está verificado",
      });
    }

    // Activar usuario
    await pool.query(
      "UPDATE USUARIOS SET email_verified = 1, verification_code = NULL, code_expires_at = NULL WHERE ID_usuario = ?",
      [user.ID_usuario]
    );

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.ID_usuario,
        rol: user.Rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Correo verificado exitosamente",
      token,
      usuario: {
        id: user.ID_usuario,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Email,
        rol: user.Rol,
      },
    });
  } catch (error) {
    return handleServerError(res, error, "Error en verificación");
  }
};

// ── POST /resend-code ────────────────────────────────────────────────────────
const resendCode = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await pool.query(
      "SELECT * FROM USUARIOS WHERE Email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    const user = users[0];

    if (user.email_verified === 1) {
      return res.status(400).json({
        ok: false,
        mensaje: "El correo ya está verificado",
      });
    }

    // Generar nuevo código
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      "UPDATE USUARIOS SET verification_code = ?, code_expires_at = ? WHERE ID_usuario = ?",
      [verificationCode, codeExpiresAt, user.ID_usuario]
    );

    // Enviar email
    await sendVerificationEmail(email, verificationCode);

    return res.status(200).json({
      ok: true,
      mensaje: "Código reenviado correctamente",
    });
  } catch (error) {
    return handleServerError(res, error, "Error al reenviar código");
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

    // Verificar si el email está verificado
    if (usuario.email_verified !== 1) {
      return res.status(403).json({
        ok: false,
        mensaje: "Debes verificar tu correo electrónico antes de iniciar sesión",
      });
    }

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
    const [rows] = await pool.query(
      `SELECT ID_usuario, Nombre, Apellido, Email, Rol, Activo FROM USUARIOS WHERE Activo = TRUE`
    );
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
// ── GetUsuariosPanelAdmin/PanelAdmin ───────────────────────────────────────────

const getUsuariosPanelAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS totalUsuarios FROM USUARIOS"
    );
    res.json({
      totalUsuarios: rows.length > 0 ? rows[0].totalUsuarios : 0,
    });
  } catch (error) {
    console.error('Error al contar usuarios:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener usuarios'
    });
  }
};

const getTodosDependientesAdmin = async (req, res) => {
  try {
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

const getDependientesPanelAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS totalDependientes FROM DEPENDIENTES"
    );
    res.json({
      totalDependientes: rows.length > 0 ? rows[0].totalDependientes : 0,
    });
  } catch (error) {
    console.error('Error al contar dependientes:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener dependientes'
    });
  }
};

// ── PUT /change-password ─────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { id } = req.usuario; // Extraído por el middleware verifyToken
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ ok: false, mensaje: "Debes proveer la contraseña actual y la nueva" });
  }

  try {
    const [users] = await pool.query(
      "SELECT Password_hash FROM USUARIOS WHERE ID_usuario = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const passwordValida = await bcrypt.compare(currentPassword, users[0].Password_hash);
    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: "La contraseña actual es incorrecta" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      "UPDATE USUARIOS SET Password_hash = ? WHERE ID_usuario = ?",
      [newPasswordHash, id]
    );

    return res.status(200).json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    return handleServerError(res, error, "Error al cambiar contraseña");
  }
};

module.exports = {
  register,
  verifyEmail,
  resendCode,
  login,
  getUsuarios,
  updateUsuario,
  deleteUsuario,
  getUsuariosPanelAdmin,
  getDependientesPanelAdmin,
  getTodosDependientesAdmin,
  changePassword,
};