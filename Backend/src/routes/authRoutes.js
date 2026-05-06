const express = require("express");
const router = express.Router();
const { register, login, getUsuarios, updateUsuario, deleteUsuario } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/register",              register);
router.post("/login",                 login);
router.get("/PanelUsuarios",          verifyToken, getUsuarios);
router.put("/PanelUsuarios/:id",      verifyToken, updateUsuario);
router.delete("/PanelUsuarios/:id",   verifyToken, deleteUsuario);

module.exports = router;