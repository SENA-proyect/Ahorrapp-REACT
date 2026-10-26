const { createHash } = require('node:crypto');

const isOperationId = (value) => typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

async function reserve(connection, owner, operationId, payload) {
  const fingerprint = createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex');
  // Bloqueo transaccional compartido por todas las instancias del backend.
  // Una colisión del hash solo serializa operaciones distintas; la búsqueda
  // compara el UUID completo. No requiere tablas ni índices nuevos.
  await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  const lock = createHash('sha256').update(operationId.toLowerCase()).digest().readInt32BE(0);
  await connection.query('SELECT pg_advisory_xact_lock($1::int, $2::int)', [owner, lock]);
  const { rows } = await connection.query(
    'SELECT detalles FROM historial WHERE id_usuario = $1 AND accion = $2',
    [owner, action(operationId)]);
  if (!rows.length) return { fresh: true };
  if (rows.length !== 1) throw new Error('Historial de sincronización inconsistente');
  const stored = JSON.parse(rows[0].detalles);
  if (stored.request_hash !== fingerprint) return { conflict: true };
  if (!stored.respuesta) throw new Error('Operación confirmada sin respuesta');
  return { response: stored.respuesta };
}

async function confirm(connection, owner, operationId, response, payload) {
  const request_hash = createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex');
  // Registro técnico en la tabla de historial YA existente. Se confirma en la
  // misma transacción que el movimiento y permanece después de eliminarlo.
  await connection.query(
    'INSERT INTO historial (id_usuario, accion, detalles) VALUES ($1, $2, $3)',
    [owner, action(operationId), JSON.stringify({ request_hash, respuesta: response })]);
}

const action = operationId => `RF19:${operationId.toLowerCase()}`;

async function withOperationIds(connection, owner, rows) {
  const { rows: entries } = await connection.query(
    "SELECT accion, detalles FROM historial WHERE id_usuario = $1 AND accion LIKE 'RF19:%'", [owner]);
  const operations = new Map(entries.map(entry => {
    const stored = JSON.parse(entry.detalles);
    return [stored.respuesta.ID_movimiento, entry.accion.slice(5)];
  }));
  return rows.map(({ _rf19_movimiento, ...row }) => ({ ...row, operation_id: operations.get(_rf19_movimiento) ?? null }));
}

module.exports = { isOperationId, reserve, confirm, withOperationIds, action };
