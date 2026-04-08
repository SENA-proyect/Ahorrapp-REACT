const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const { crearMovimiento } = require("../controllers/movimientosController");

router.post("/", verifyToken, crearMovimiento);

module.exports = router;