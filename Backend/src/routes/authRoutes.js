const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getUsuarios,
  updateUsuario,
  deleteUsuario,
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { getUsuariosPanelAdmin, getDependientesPanelAdmin, getTodosDependientesAdmin } = require("../controllers/authController");


router.post("/register",              register);
router.post("/login",                 login);
router.post("/forgot-password",       forgotPassword);
router.post("/verify-reset-code",     verifyResetCode);
router.post("/reset-password",        resetPassword);
router.get("/PanelUsuarios",          verifyToken, getUsuarios);
router.put("/PanelUsuarios/:id",      verifyToken, updateUsuario);
router.delete("/PanelUsuarios/:id",   verifyToken, deleteUsuario);
router.get("/usuarios/PanelAdmin",    verifyToken, getUsuariosPanelAdmin);
router.get("/dependientes/PanelAdmin", verifyToken, getDependientesPanelAdmin);
router.get("/PanelDependientes", verifyToken, getTodosDependientesAdmin);
module.exports = router;