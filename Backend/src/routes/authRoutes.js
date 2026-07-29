const express = require("express");
const router = express.Router();
const {
  register, login, getUsuarios, updateUsuario, deleteUsuario,
  actualizarRolUsuario,
} = require("../controllers/authController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { getUsuariosPanelAdmin, getDependientesPanelAdmin, getTodosDependientesAdmin } = require("../controllers/authController");


router.post("/register",              register);
router.post("/login",                 login);
router.get("/PanelUsuarios",          verifyToken, getUsuarios);
router.put("/PanelUsuarios/:id",      verifyToken, updateUsuario);
router.put("/PanelUsuarios/:id/rol",  verifyToken, requireRole(["superuser"]), actualizarRolUsuario);
router.delete("/PanelUsuarios/:id",   verifyToken, deleteUsuario);
router.get("/usuarios/PanelAdmin",    verifyToken, getUsuariosPanelAdmin);
router.get("/dependientes/PanelAdmin", verifyToken, getDependientesPanelAdmin);
router.get("/PanelDependientes", verifyToken, getTodosDependientesAdmin);
module.exports = router;