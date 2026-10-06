const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const { testNotificacion } = require("../controllers/Notificacionescontroller");
const {
  getNotificaciones,
  getNoLeidasCount,
  marcarLeida,
  marcarTodasLeidas,
  archivarNotificacion,
  eliminarNotificacion,
  getPreferenciasUsuario,
  actualizarPreferenciasUsuario,
  registrarPushToken,
  testNotificacion,
} = require("../controllers/Notificacionescontroller");

router.use(verifyToken);

// ── Notificaciones ───────────────────────────────────────────
router.get("/notificaciones", getNotificaciones);
router.get("/notificaciones/no-leidas/count", getNoLeidasCount);
router.patch("/notificaciones/leer-todas", marcarTodasLeidas);
router.patch("/notificaciones/:id/leer", marcarLeida);
router.patch("/notificaciones/:id/archivar", archivarNotificacion);
router.delete("/notificaciones/:id", eliminarNotificacion);

// ── Preferencias ──────────────────────────────────────────────
router.get("/preferencias-notificacion", getPreferenciasUsuario);
router.put("/preferencias-notificacion", actualizarPreferenciasUsuario);

// ── Push tokens ──────────────────────────────────────────────
router.post("/push-tokens", registrarPushToken);


//--Ruta de prueba para crear notificaciones
router.post("/notificaciones/test", testNotificacion);

module.exports = router;