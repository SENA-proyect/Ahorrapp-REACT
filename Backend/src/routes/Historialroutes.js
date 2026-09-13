const express = require("express");
const router = express.Router();
const { getHistorial, getHistorialPropio } = require("../controllers/Historialcontroller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Historial completo del sistema: solo admin y superuser
router.get("/", verifyToken, requireRole(["admin", "superuser"]), getHistorial);

// Historial propio: cualquier usuario autenticado ve sus propias acciones
router.get("/propio", verifyToken, getHistorialPropio);

module.exports = router;