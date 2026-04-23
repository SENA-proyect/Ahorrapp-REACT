const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  crearMovimiento,
  getIngresos,
  getAhorros,
  getGastos,
  getImprevistos,
  getDeudas,
} = require("../controllers/movimientosController");

router.post("/",          verifyToken, crearMovimiento);
router.get("/ingresos",   verifyToken, getIngresos);
router.get("/ahorros",    verifyToken, getAhorros);
router.get("/gastos",     verifyToken, getGastos);
router.get("/imprevistos",verifyToken, getImprevistos);
router.get("/deudas",     verifyToken, getDeudas);

module.exports = router;