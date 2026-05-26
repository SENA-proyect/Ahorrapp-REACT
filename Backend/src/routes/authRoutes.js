const express = require("express");
const router = express.Router();
const { register, login, getUsuarios, updateUsuario, deleteUsuario } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { getUsuariosPanelAdmin } = require("../controllers/authController");

router.post("/register",              register);
router.post("/login",                 login);
router.get("/PanelUsuarios",          verifyToken, getUsuarios);
router.put("/PanelUsuarios/:id",      verifyToken, updateUsuario);
router.delete("/PanelUsuarios/:id",   verifyToken, deleteUsuario);
router.get("/PanelAdmin",             verifyToken, getUsuariosPanelAdmin);
module.exports = router;