const express = require("express");
const router = express.Router();

const {
  getFondoEmergencia,
  crearFondoEmergencia,
  actualizarMetaFondoEmergencia,
  registrarAporte,
  registrarRetiro,
  getMovimientosFondoEmergencia
} = require("../controllers/fondoemergenciaController");

const authMiddleware = require("../middlewares/authMiddleware");

// Obtener fondo de emergencia
router.get(
  "/",
  authMiddleware,
  getFondoEmergencia
);

// Crear fondo de emergencia
router.post(
  "/",
  authMiddleware,
  crearFondoEmergencia
);

// Actualizar meta
router.put(
  "/meta",
  authMiddleware,
  actualizarMetaFondoEmergencia
);

// Registrar aporte
router.post(
  "/aporte",
  authMiddleware,
  registrarAporte
);

// Registrar retiro
router.post(
  "/retiro",
  authMiddleware,
  registrarRetiro
);

// Obtener historial de movimientos
router.get(
  "/movimientos",
  authMiddleware,
  getMovimientosFondoEmergencia
);

module.exports = router;
