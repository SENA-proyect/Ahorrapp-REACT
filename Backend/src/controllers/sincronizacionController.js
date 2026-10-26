const pool = require('../db/connection');
const { isOperationId } = require('../service/OperacionesMovilesService');

async function capacidades(req, res) {
  try {
    await pool.query('SELECT id_usuario, accion, detalles FROM historial LIMIT 0');
    return res.json({ ok: true, protocolo: 1, idempotencia: true });
  } catch (_) {
    return res.status(503).json({ ok: false,
      mensaje: 'El servidor no pudo verificar la sincronización. Los pendientes se conservan.' });
  }
}

async function consultarOperacion(req, res) {
  if (!isOperationId(req.params.operationId)) {
    return res.status(400).json({ ok: false, mensaje: 'Identificador de operación inválido.' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT detalles FROM historial WHERE id_usuario = $1 AND accion = $2`,
      [req.usuario.id, `RF19:${req.params.operationId.toLowerCase()}`]);
    return res.json({ ok: true, encontrado: rows.length > 0, resultado: rows.length === 1 ? JSON.parse(rows[0].detalles).respuesta : null });
  } catch (_) {
    return res.status(503).json({ ok: false, mensaje: 'No se pudo consultar el estado de la operación.' });
  }
}

module.exports = { capacidades, consultarOperacion };
