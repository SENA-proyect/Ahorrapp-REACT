const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({
      ok: false,
      mensaje: "Acceso denegado, token no proporcionado",
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      ok: false,
      mensaje: "Token inválido o expirado",
    });
  }
};

const requireRole = (rolesPermitidos) => (req, res, next) => {
  const rolesUsuario = req.usuario.roles || [];
  const tienePermiso = rolesPermitidos.some((rol) => rolesUsuario.includes(rol));

  if (!tienePermiso) {
    return res.status(403).json({
      ok: false,
      mensaje: "No tienes permisos para realizar esta acción",
    });
  }

  next();
};

module.exports = { verifyToken, requireRole };