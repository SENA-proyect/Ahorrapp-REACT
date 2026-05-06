const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  crearMovimiento,
  getIngresos,
  updateIngresos,
  deleteIngresos,
  getAhorros,
  updateAhorros,
  deleteAhorros,
  getGastos,
  updateGastos,
  deleteGastos,
  getImprevistos,
  updateImprevistos,
  deleteImprevistos,
  getDeudas,
  updateDeudas,
  deleteDeudas
} = require("../controllers/movimientosController");

router.post("/",          verifyToken, crearMovimiento);
router.get("/ingresos",   verifyToken, getIngresos);
router.get("/ahorros",    verifyToken, getAhorros);
router.get("/gastos",     verifyToken, getGastos);
router.get("/imprevistos",verifyToken, getImprevistos);
router.get("/deudas",     verifyToken, getDeudas);
router.put("/ingresos/:id", verifyToken, updateIngresos);
router.put("/ahorros/:id",  verifyToken, updateAhorros);
router.put("/gastos/:id",   verifyToken, updateGastos);
router.put("/imprevistos/:id", verifyToken, updateImprevistos);
router.put("/deudas/:id",   verifyToken, updateDeudas);
router.delete("/ingresos/:id", verifyToken, deleteIngresos);
router.delete("/ahorros/:id", verifyToken, deleteAhorros);
router.delete("/gastos/:id", verifyToken, deleteGastos);
router.delete("/imprevistos/:id", verifyToken, deleteImprevistos);
router.delete("/deudas/:id", verifyToken, deleteDeudas);

module.exports = router;