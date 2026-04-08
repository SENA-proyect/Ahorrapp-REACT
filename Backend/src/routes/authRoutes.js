const express = require("express");
const router = express.Router();
const { register, login, getUsuarios } = require("../controllers/authController");

router.post("/Register", register);
router.post("/Login", login);
router.get("/PanelUsuarios", getUsuarios);

module.exports = router;