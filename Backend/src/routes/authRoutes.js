const express = require("express");
const router = express.Router();
const { register, login, getUsuarios } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware")

router.post("/Register", register);
router.post("/Login", login);
router.get("/PanelUsuarios", verifyToken, getUsuarios);

module.exports = router;
