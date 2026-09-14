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
  actualizarRolUsuario,
  desactivarCuentaPropia,
} = require("../controllers/authController");

const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { getUsuariosPanelAdmin, getDependientesPanelAdmin, getTodosDependientesAdmin } = require("../controllers/authController");


router.post("/register",              register);
router.post("/login",                 login);
router.post("/forgot-password",       forgotPassword);
router.post("/verify-reset-code",     verifyResetCode);
router.post("/reset-password",        resetPassword);
router.get("/PanelUsuarios",          verifyToken, getUsuarios);
router.put("/PanelUsuarios/:id",      verifyToken, requireRole(["admin", "superuser"]), updateUsuario);
router.delete("/PanelUsuarios/:id",   verifyToken, requireRole(["admin", "superuser"]), deleteUsuario);
router.get("/usuarios/PanelAdmin",    verifyToken, getUsuariosPanelAdmin);
router.get("/dependientes/PanelAdmin", verifyToken, getDependientesPanelAdmin);
router.get("/PanelDependientes", verifyToken, getTodosDependientesAdmin);

router.put("/PanelUsuarios/:id/rol",  verifyToken, requireRole(["superuser"]), actualizarRolUsuario);

// Autoservicio: el propio usuario desactiva su cuenta (cualquier rol)
router.put("/mi-cuenta/desactivar",   verifyToken, desactivarCuentaPropia);

module.exports = router;