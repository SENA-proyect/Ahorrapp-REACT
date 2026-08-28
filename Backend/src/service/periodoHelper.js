const pool = require("../db/connection");

// ─────────────────────────────────────────────────────────────
//  getPeriodoActivo
// ─────────────────────────────────────────────────────────────
const getPeriodoActivo = async (ID_usuario) => {
  const { rows } = await pool.query(
    `SELECT
        pp.id_periodo AS "ID_periodo",
        pp.id_presupuesto AS "ID_presupuesto",
        pp.id_usuario AS "ID_usuario",
        pp.fecha_inicio AS "Fecha_inicio",
        pp.fecha_fin AS "Fecha_fin",
        pp.ingreso_estimado AS "Ingreso_estimado",
        pp.ingreso_real AS "Ingreso_real",
        pp.saldo_anterior AS "Saldo_anterior",
        pp.estado AS "Estado",
        pp.monto_gastos AS "Monto_gastos",
        pp.monto_deudas AS "Monto_deudas",
        pp.monto_imprevistos AS "Monto_imprevistos",
        pp.monto_ahorros AS "Monto_ahorros",
        pp.monto_emergencia AS "Monto_emergencia",
        p.porcentaje_gastos AS "Porcentaje_gastos",
        p.porcentaje_deudas AS "Porcentaje_deudas",
        p.porcentaje_imprevistos AS "Porcentaje_imprevistos",
        p.porcentaje_ahorros AS "Porcentaje_ahorros",
        p.porcentaje_emergencia AS "Porcentaje_emergencia",
        p.nombre AS perfil_nombre
     FROM   periodos_presupuesto pp
     JOIN   presupuestos p ON pp.id_presupuesto = p.id_presupuesto
     WHERE  pp.id_usuario = $1 AND pp.estado = 'abierto'
     LIMIT  1`,
    [ID_usuario]
  );
  return rows[0] ?? null;
};

module.exports = { getPeriodoActivo };