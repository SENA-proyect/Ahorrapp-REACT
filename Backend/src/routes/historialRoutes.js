const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const {
  getHistorial,
  archivarHistorial,
  getAuditoria,
  eliminarRegistroAuditoria,
} = require("../controllers/historialController");

router.use(verifyToken);

router.get("/historial", getHistorial);
router.patch("/historial/:id/archivar", archivarHistorial);

const requireAdminOSuper = (req, res, next) => {
  const roles = req.usuario.roles ?? [];
  if (roles.includes("admin") || roles.includes("superuser")) return next();
  return res.status(403).json({ ok: false, mensaje: "No tienes permiso para ver esta información" });
};

router.get("/historial/auditoria", requireAdminOSuper, getAuditoria);
router.delete("/historial/auditoria/:id", requireAdminOSuper, eliminarRegistroAuditoria);

module.exports = router;