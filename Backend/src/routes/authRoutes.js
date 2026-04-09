const express = require("express");
const router = express.Router();
const { register, login, getUsuarios, updateUsuario, deleteUsuario } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/Register", register);
router.post("/Login", login);
router.get("/PanelUsuarios", verifyToken, getUsuarios);
router.put("/PanelUsuarios/:id", verifyToken, updateUsuario);  // ← PanelUsuarios
router.delete("/PanelUsuarios/:id", verifyToken, deleteUsuario);  // ← PanelUsuarios
module.exports = router;
