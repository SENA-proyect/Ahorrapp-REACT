// ============================================================
//  AhorrApp — periodoHelper.js
//  Helper compartido: obtiene el período de presupuesto activo
//  de un usuario. Usado por dashboardController.js y por la
//  lógica de generación de notificaciones (alertas de presupuesto).
// ============================================================

const pool = require("../db/connection");

// ─────────────────────────────────────────────────────────────
//  getPeriodoActivo
//  Retorna el período abierto del usuario (con los porcentajes
//  de su perfil de presupuesto), o null si no tiene ninguno abierto.
// ─────────────────────────────────────────────────────────────
const getPeriodoActivo = async (ID_usuario) => {
  const [rows] = await pool.query(
    `SELECT pp.*, p.Porcentaje_gastos, p.Porcentaje_deudas,
            p.Porcentaje_imprevistos, p.Porcentaje_ahorros,
            p.Porcentaje_emergencia, p.Nombre AS perfil_nombre
     FROM   PERIODOS_PRESUPUESTO pp
     JOIN   PRESUPUESTOS p ON pp.ID_presupuesto = p.ID_presupuesto
     WHERE  pp.ID_usuario = ? AND pp.Estado = 'abierto'
     LIMIT  1`,
    [ID_usuario]
  );
  return rows[0] ?? null;
};

module.exports = { getPeriodoActivo };