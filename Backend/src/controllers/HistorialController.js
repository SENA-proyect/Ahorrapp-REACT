// ============================================================
//  AhorrApp — historialController.js
// ============================================================

const {
  getHistorialUsuario,
  archivarActividad,
  getHistorialAuditoria,
  eliminarAuditoria,
} = require("../service/HistorialService")

// ─────────────────────────────────────────────────────────────
//  GET /api/historial
//  RF-11: historial de actividad del propio usuario.
//  Query params opcionales: ?archivada=true|false  ?page=1  ?limit=20
// ─────────────────────────────────────────────────────────────
const getHistorial = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { archivada } = req.query;

  const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  try {
    const filtroArchivada =
      archivada === "true" ? true : archivada === "false" ? false : undefined;

    const { registros, total } = await getHistorialUsuario(ID_usuario, {
      archivada: filtroArchivada,
      page,
      limit,
    });

    return res.status(200).json({
      ok: true,
      historial: registros,
      paginacion: { page, limit, total, totalPaginas: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error en getHistorial:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/historial/:id/archivar
//  RF-11: el usuario puede archivar (ocultar), nunca eliminar.
//  No existe ningún endpoint DELETE para este historial — la
//  restricción "no eliminable" también está reforzada con un
//  trigger a nivel de base de datos.
// ─────────────────────────────────────────────────────────────
const archivarHistorial = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;

  try {
    const actualizado = await archivarActividad(ID_usuario, id);

    if (!actualizado) {
      return res.status(404).json({ ok: false, mensaje: "Registro de historial no encontrado" });
    }

    return res.status(200).json({ ok: true, mensaje: "Registro archivado" });
  } catch (error) {
    console.error("Error en archivarHistorial:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/historial/auditoria
//  RF-12: historial de auditoría administrativa.
//  Visible para admin y superusuario por igual (el middleware de
//  rutas ya exige requiredRoles: ['admin','superuser']).
// ─────────────────────────────────────────────────────────────
const getAuditoria = async (req, res) => {
  const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  try {
    const { registros, total } = await getHistorialAuditoria({ page, limit });

    return res.status(200).json({
      ok: true,
      auditoria: registros,
      paginacion: { page, limit, total, totalPaginas: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error en getAuditoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  DELETE /api/historial/auditoria/:id
//  RF-12: eliminación definitiva, SOLO superusuario.
//  El servicio no conoce roles — la verificación vive aquí,
//  en el controller, antes de invocar eliminarAuditoria().
// ─────────────────────────────────────────────────────────────
const eliminarRegistroAuditoria = async (req, res) => {
  const { id } = req.params;
  const esSuperUsuario = req.usuario.roles?.includes("superuser");

  if (!esSuperUsuario) {
    return res.status(403).json({
      ok: false,
      mensaje: "Solo un superusuario puede eliminar registros de auditoría",
    });
  }

  try {
    const eliminado = await eliminarAuditoria(id);

    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: "Registro de auditoría no encontrado" });
    }

    return res.status(200).json({ ok: true, mensaje: "Registro de auditoría eliminado" });
  } catch (error) {
    console.error("Error en eliminarRegistroAuditoria:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  getHistorial,
  archivarHistorial,
  getAuditoria,
  eliminarRegistroAuditoria,
};