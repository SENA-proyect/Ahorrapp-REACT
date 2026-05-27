const express = require("express");
const router = express.Router();
const { 
  register, 
  login, 
  getUsuarios, 
  updateUsuario, 
  deleteUsuario,
  verifyEmail,
  resendCode
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Rutas de autenticación (públicas)
router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendCode);

// Rutas de administración de usuarios (protegidas)
router.get("/PanelUsuarios", verifyToken, getUsuarios);
router.put("/PanelUsuarios/:id", verifyToken, updateUsuario);
router.delete("/PanelUsuarios/:id", verifyToken, deleteUsuario);

module.exports = router;