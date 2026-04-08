const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  getCategorias,
  crearCategoria,
  editarCategoria,
  deshabilitarCategoria,
  habilitarCategoria,
} = require("../controllers/categoriasController");

router.get("/", verifyToken, getCategorias);
router.post("/", verifyToken, crearCategoria);
router.put("/:id", verifyToken, editarCategoria);
router.patch("/:id/deshabilitar", verifyToken, deshabilitarCategoria);
router.patch("/:id/habilitar", verifyToken, habilitarCategoria);

module.exports = router;