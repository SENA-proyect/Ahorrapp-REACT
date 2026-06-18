const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  getCategorias,
  getGastosPorCategoria,
  getIngresosPorCategoria,
  getAhorrosPorCategoria,
  getImprevistosPorCategoria,
  getDeudasPorCategoria,
  crearCategoria,
  actualizarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
} = require("../controllers/categoriasController");

router.get("/", verifyToken, getCategorias);
router.get("/gastos", verifyToken, getGastosPorCategoria);
router.get("/ingresos",    verifyToken, getIngresosPorCategoria);
router.get("/ahorros",     verifyToken, getAhorrosPorCategoria);
router.get("/imprevistos", verifyToken, getImprevistosPorCategoria);
router.get("/deudas",      verifyToken, getDeudasPorCategoria);
router.post("/", verifyToken, crearCategoria);
router.put("/:id", verifyToken, actualizarCategoria);
router.patch("/:id/deshabilitar", verifyToken, deshabilitarCategoria);
router.patch("/:id/habilitar", verifyToken, habilitarCategoria);

module.exports = router;
