const express = require("express");
const router = express.Router();

const {
  getReporteResumen,
  getReporteGastosPorCategoria,
  getReporteMovimientos
} = require("../controllers/ReportesController");

const authMiddleware = require("../middleware/authMiddleware");

// Resumen financiero
router.get(
  "/resumen",
  authMiddleware,
  getReporteResumen
);

// Gastos por categoría
router.get(
  "/gastos-categoria",
  authMiddleware,
  getReporteGastosPorCategoria
);

// Movimientos del período
router.get(
  "/movimientos",
  authMiddleware,
  getReporteMovimientos
);

module.exports = router;
