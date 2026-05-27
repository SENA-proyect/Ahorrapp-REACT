const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  getResumen,
  getPresupuestoVsEjecutado,
  getFlujoPorSemana,
} = require("../controllers/dashboardController");

router.get("/resumen",                  verifyToken, getResumen);
router.get("/presupuesto-vs-ejecutado", verifyToken, getPresupuestoVsEjecutado);
router.get("/flujo-semanal",            verifyToken, getFlujoPorSemana);

module.exports = router;