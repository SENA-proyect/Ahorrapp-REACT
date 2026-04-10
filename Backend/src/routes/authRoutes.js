const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { register, login, getUsuarios } = require("../controllers/authController");


router.post("/register", register);
router.post("/login", login);
router.get("/usuarios", verifyToken, getUsuarios);

module.exports = { register, login, getUsuarios };