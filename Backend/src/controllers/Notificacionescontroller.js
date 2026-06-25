// ============================================================
//  AhorrApp — notificacionesController.js
// ============================================================

const pool = require("../db/connection");
const {
  getPreferencias,
  setPreferencia,
  TIPOS_NOTIFICACION,
} = require("../service/NotificacionesService")

// ─────────────────────────────────────────────────────────────
//  GET /api/notificaciones
//  Listado paginado, con filtros opcionales por query string:
//  ?leida=true|false  ?archivada=true|false  ?page=1  ?limit=20
// ─────────────────────────────────────────────────────────────
const getNotificaciones = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { leida, archivada } = req.query;

  const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = (page - 1) * limit;

  try {
    const condiciones = ["ID_usuario = ?"];
    const params = [ID_usuario];

    if (leida === "true" || leida === "false") {
      condiciones.push("Leida = ?");
      params.push(leida === "true");
    }

    if (archivada === "true" || archivada === "false") {
      condiciones.push("Archivada = ?");
      params.push(archivada === "true");
    } else {
      // Por defecto, el listado principal NO muestra archivadas
      // (esas viven en /historial). Si se pide explícitamente
      // archivada=true o archivada=false, se respeta ese filtro.
      condiciones.push("Archivada = FALSE");
    }

    const where = condiciones.join(" AND ");

    const [rows] = await pool.query(
      `SELECT
         ID_notificacion AS id,
         Tipo            AS tipo,
         Entidad_tipo    AS entidad_tipo,
         Entidad_id      AS entidad_id,
         Mensaje         AS mensaje,
         Fecha           AS fecha,
         Leida           AS leida,
         Archivada       AS archivada
       FROM NOTIFICACIONES
       WHERE ${where}
       ORDER BY Fecha DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM NOTIFICACIONES WHERE ${where}`,
      params
    );

    return res.status(200).json({
      ok: true,
      notificaciones: rows,
      paginacion: { page, limit, total, totalPaginas: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error en getNotificaciones:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/notificaciones/no-leidas/count
//  Endpoint de polling. Liviano a propósito: solo un COUNT().
// ─────────────────────────────────────────────────────────────
const getNoLeidasCount = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM NOTIFICACIONES
       WHERE ID_usuario = ? AND Leida = FALSE AND Archivada = FALSE`,
      [ID_usuario]
    );

    return res.status(200).json({ ok: true, count: total });
  } catch (error) {
    console.error("Error en getNoLeidasCount:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/notificaciones/:id/leer
// ─────────────────────────────────────────────────────────────
const marcarLeida = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `UPDATE NOTIFICACIONES SET Leida = TRUE
       WHERE ID_notificacion = ? AND ID_usuario = ?`,
      [id, ID_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: "Notificación no encontrada" });
    }

    return res.status(200).json({ ok: true, mensaje: "Notificación marcada como leída" });
  } catch (error) {
    console.error("Error en marcarLeida:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/notificaciones/leer-todas
// ─────────────────────────────────────────────────────────────
const marcarTodasLeidas = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    await pool.query(
      `UPDATE NOTIFICACIONES SET Leida = TRUE
       WHERE ID_usuario = ? AND Leida = FALSE`,
      [ID_usuario]
    );

    return res.status(200).json({ ok: true, mensaje: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error en marcarTodasLeidas:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/notificaciones/:id/archivar
// ─────────────────────────────────────────────────────────────
const archivarNotificacion = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `UPDATE NOTIFICACIONES SET Archivada = TRUE
       WHERE ID_notificacion = ? AND ID_usuario = ?`,
      [id, ID_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: "Notificación no encontrada" });
    }

    return res.status(200).json({ ok: true, mensaje: "Notificación archivada" });
  } catch (error) {
    console.error("Error en archivarNotificacion:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  DELETE /api/notificaciones/:id
//  Eliminación definitiva (distinta de archivar).
// ─────────────────────────────────────────────────────────────
const eliminarNotificacion = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `DELETE FROM NOTIFICACIONES WHERE ID_notificacion = ? AND ID_usuario = ?`,
      [id, ID_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: "Notificación no encontrada" });
    }

    return res.status(200).json({ ok: true, mensaje: "Notificación eliminada" });
  } catch (error) {
    console.error("Error en eliminarNotificacion:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/preferencias-notificacion
// ─────────────────────────────────────────────────────────────
const getPreferenciasUsuario = async (req, res) => {
  const ID_usuario = req.usuario.id;

  try {
    const preferencias = await getPreferencias(ID_usuario);
    return res.status(200).json({ ok: true, preferencias });
  } catch (error) {
    console.error("Error en getPreferenciasUsuario:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/preferencias-notificacion
//  Body esperado: { preferencias: [{ tipo, activa }, ...] }
// ─────────────────────────────────────────────────────────────
const actualizarPreferenciasUsuario = async (req, res) => {
  const ID_usuario = req.usuario.id;
  const { preferencias } = req.body;

  if (!Array.isArray(preferencias) || preferencias.length === 0) {
    return res.status(400).json({ ok: false, mensaje: "Debes enviar al menos una preferencia" });
  }

  const invalida = preferencias.find((p) => !TIPOS_NOTIFICACION.includes(p.tipo));
  if (invalida) {
    return res.status(400).json({
      ok: false,
      mensaje: `Tipo de notificación inválido: ${invalida.tipo}`,
    });
  }

  try {
    for (const { tipo, activa } of preferencias) {
      await setPreferencia(ID_usuario, tipo, Boolean(activa));
    }

    return res.status(200).json({ ok: true, mensaje: "Preferencias actualizadas" });
  } catch (error) {
    console.error("Error en actualizarPreferenciasUsuario:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  getNotificaciones,
  getNoLeidasCount,
  marcarLeida,
  marcarTodasLeidas,
  archivarNotificacion,
  eliminarNotificacion,
  getPreferenciasUsuario,
  actualizarPreferenciasUsuario,
};