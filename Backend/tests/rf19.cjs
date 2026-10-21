const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { fixture } = require('./rf19-fixture.cjs');

(async () => {
  const db = await fixture();
  let passed = 0;
  const check = async (name, action) => { await action(); passed++; console.log('OK:', name); };
  const request = async (route, body, owner = 7, method = body ? 'POST' : 'GET', expired = false) => {
    const response = await fetch(db.url + route, { method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${db.token(owner, expired)}` },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  const payload = (subtype, uuid = randomUUID()) => ({ operation_id: uuid,
    tipo_flujo: subtype === 'Gasto' ? 'Salida' : 'Entrada', subtipo_modulo: subtype,
    datos: { monto: 12500, fecha_registro: '2026-10-07', descripcion: 'RF19', id_categoria: 1,
      ...(subtype === 'Ahorro' ? { meta: 'Viaje' } : {}) } });
  const schema = async () => ({
    columns: (await db.pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position")).rows,
    indexes: (await db.pool.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname")).rows,
  });
  const initialSchema = await schema();
  try {
    await check('Capacidades con historial existente y sin migración', async () => {
      assert.deepEqual((await request('/movimientos/sincronizacion')).body, { ok: true, protocolo: 1, idempotencia: true });
    });
    for (const subtype of ['Ingreso','Gasto','Ahorro']) {
      await check(`${subtype}: respuesta perdida y múltiples reintentos conservan ID y un solo movimiento`, async () => {
        const body = payload(subtype);
        const original = await request('/movimientos', body);
        assert.equal(original.status, 201);
        for (let i = 0; i < 3; i++) assert.deepEqual((await request('/movimientos', body)).body, original.body);
        const { rows } = await db.pool.query('SELECT COUNT(*)::int AS total FROM historial WHERE id_usuario=7 AND accion=$1', [`RF19:${body.operation_id}`]);
        assert.equal(rows[0].total, 1);
        const list = await request('/movimientos/' + ({Ingreso:'ingresos',Gasto:'gastos',Ahorro:'ahorros'})[subtype]);
        assert.equal(list.body.filter(row => row.operation_id === body.operation_id).length, 1);
      });
    }
    await check('Doce envíos concurrentes crean una sola operación', async () => {
      const body = payload('Ingreso');
      const results = await Promise.all(Array.from({ length: 12 }, () => request('/movimientos', body)));
      assert.equal(results.filter(result => result.status === 201).length, 1);
      assert.equal(new Set(results.map(result => result.body.ID_movimiento)).size, 1);
    });
    await check('Veinte operaciones diferentes concurrentes completan sin agotar el pool', async () => {
      const results = await Promise.all(Array.from({ length: 20 }, () => request('/movimientos', payload('Ingreso'))));
      assert.equal(results.every(result => result.status === 201), true);
      assert.equal(new Set(results.map(result => result.body.ID_movimiento)).size, 20);
    });
    await check('UUID en mayúsculas comparte bloqueo y registro con su forma normalizada', async () => {
      const body = payload('Ingreso'); const first = await request('/movimientos', body);
      const retry = await request('/movimientos', { ...body, operation_id: body.operation_id.toUpperCase() });
      assert.equal(retry.status, 200); assert.deepEqual(retry.body, first.body);
    });
    await check('Mismo UUID con contenido diferente se rechaza', async () => {
      const body = payload('Gasto'); await request('/movimientos', body);
      body.datos.monto = 100;
      assert.equal((await request('/movimientos', body)).status, 409);
    });
    await check('El orden de las claves no cambia la operación', async () => {
      const body = payload('Ingreso'); const first = await request('/movimientos', body);
      const second = await request('/movimientos', { datos: { ...body.datos }, subtipo_modulo: body.subtipo_modulo,
        tipo_flujo: body.tipo_flujo, operation_id: body.operation_id });
      assert.equal(second.status, 200); assert.deepEqual(second.body, first.body);
    });
    await check('UUID compartido por cuentas diferentes no mezcla respuestas ni consultas', async () => {
      const uuid = randomUUID(); const first = await request('/movimientos', payload('Ingreso', uuid));
      const secondBody = payload('Ingreso', uuid); secondBody.datos.id_categoria = 2;
      assert.equal((await request(`/movimientos/sincronizacion/operaciones/${uuid}`, null, 8)).body.encontrado, false);
      const second = await request('/movimientos', secondBody, 8);
      assert.notEqual(first.body.ID_movimiento, second.body.ID_movimiento);
    });
    await check('Categoría inactiva y dependiente ajeno rechazan y revierten la reserva', async () => {
      for (const fields of [{id_categoria:3}, {id_dependientes:2}]) {
        const body = payload('Gasto'); Object.assign(body.datos, fields);
        assert.equal((await request('/movimientos', body)).status, 400);
        assert.equal((await request(`/movimientos/sincronizacion/operaciones/${body.operation_id}`)).body.encontrado, false);
      }
    });
    await check('Fallo SQL revierte movimiento, entrada y reserva; el reintento puede completar', async () => {
      const body = payload('Ingreso'); body.datos.fecha_registro = 'fecha-inválida';
      const before = (await db.pool.query('SELECT COUNT(*)::int AS n FROM movimientos')).rows[0].n;
      assert.equal((await request('/movimientos', body)).status, 500);
      assert.equal((await db.pool.query('SELECT COUNT(*)::int AS n FROM movimientos')).rows[0].n, before);
      assert.equal((await request(`/movimientos/sincronizacion/operaciones/${body.operation_id}`)).body.encontrado, false);
      body.datos.fecha_registro = '2026-10-07'; assert.equal((await request('/movimientos', body)).status, 201);
    });
    await check('Token vencido no crea ni reserva datos', async () => {
      const body = payload('Ingreso'); assert.equal((await request('/movimientos', body, 7, 'POST', true)).status, 403);
      assert.equal((await request(`/movimientos/sincronizacion/operaciones/${body.operation_id}`)).body.encontrado, false);
    });
    await check('Fallo auxiliar después del COMMIT no convierte un éxito en fallo ni duplica', async () => {
      db.setFailEffects(true); const body = payload('Ingreso'); const first = await request('/movimientos', body);
      assert.equal(first.status, 201); assert.deepEqual((await request('/movimientos', body)).body, first.body);
      db.setFailEffects(false);
    });
    await check('Eliminar un movimiento no permite recrearlo con el UUID antiguo', async () => {
      const body = payload('Ingreso'); const first = await request('/movimientos', body);
      await db.pool.query('DELETE FROM movimientos WHERE id_movimiento=$1', [first.body.ID_movimiento]);
      assert.deepEqual((await request('/movimientos', body)).body, first.body);
      assert.equal((await db.pool.query('SELECT COUNT(*)::int AS n FROM movimientos WHERE id_movimiento=$1', [first.body.ID_movimiento])).rows[0].n, 0);
    });
    await check('RF-19 no crea ni altera tablas, columnas o índices', async () => {
      assert.deepEqual(await schema(), initialSchema);
      assert.equal((await db.pool.query("SELECT to_regclass('public.operaciones_moviles') IS NULL AS ausente")).rows[0].ausente, true);
    });
    await check('Historial técnico no aparece en vistas normales y no se elimina como exportación', async () => {
      const body = payload('Ingreso'); await request('/movimientos', body);
      const row = (await db.pool.query('SELECT id_historial FROM historial WHERE id_usuario=7 AND accion=$1', [`RF19:${body.operation_id}`])).rows[0];
      const history = await request('/historial/propio');
      assert.equal(history.status, 200);
      assert.equal(history.body.historial.some(r => r.accion.startsWith('RF19:')), false);
      const exports = await request('/exportar');
      assert.equal(exports.status, 200);
      assert.equal(exports.body.some(r => r.accion.startsWith('RF19:')), false);
      assert.equal((await request(`/exportar/${row.id_historial}`, null, 7, 'DELETE')).status, 404);
      assert.equal((await request(`/movimientos/sincronizacion/operaciones/${body.operation_id}`)).body.encontrado, true);
    });
    console.log(JSON.stringify({ passed, failed: 0, database: 'PostgreSQL real aislado', transport: 'HTTP y JWT reales' }));
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
