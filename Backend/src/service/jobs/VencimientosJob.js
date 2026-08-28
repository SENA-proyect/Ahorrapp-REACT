const cron = require("node-cron");
const pool = require("../../db/connection");
const { crearNotificacion, existeNotificacionEntidad } = require("../NotificacionesService");

const DIAS_AVISO_DEUDA = 5;

// ─────────────────────────────────────────────────────────────
//  revisarDeudasPorVencer
// ─────────────────────────────────────────────────────────────
const revisarDeudasPorVencer = async () => {
  try {
    const { rows: deudas } = await pool.query(
      `SELECT
         d.id_deudas AS "ID_deudas",
         d.descripcion AS "Descripcion",
         d.monto AS "Monto",
         d.fecha_fin AS "Fecha_fin",
         m.id_usuario AS "ID_usuario"
       FROM deudas d
       INNER JOIN salida s      ON d.id_salida     = s.id_salida
       INNER JOIN movimientos m ON s.id_movimiento = m.id_movimiento
       WHERE d.estado = 'pendiente'
         AND d.cuotas_pagadas < d.cuotas_total
         AND d.fecha_fin IS NOT NULL
         AND d.fecha_fin >= CURRENT_DATE
         AND d.fecha_fin <= CURRENT_DATE + make_interval(days => $1::int)`,
      [DIAS_AVISO_DEUDA]
    );

    let creadas = 0;

    for (const deuda of deudas) {
      const yaExiste = await existeNotificacionEntidad(
        deuda.ID_usuario,
        "recordatorio",
        "deuda",
        deuda.ID_deudas
      );
      if (yaExiste) continue;

      const fechaFmt = new Date(deuda.Fecha_fin).toLocaleDateString("es-CO");
      const descripcion = deuda.Descripcion?.trim() || "una deuda";

      const id = await crearNotificacion({
        ID_usuario: deuda.ID_usuario,
        Tipo: "recordatorio",
        Mensaje: `Tu deuda "${descripcion}" por $${Number(deuda.Monto).toLocaleString("es-CO")} vence el ${fechaFmt}.`,
        Entidad_tipo: "deuda",
        Entidad_id: deuda.ID_deudas,
      });

      if (id) creadas++;
    }

    console.log(`[vencimientosJob] Revisión de deudas completa. Notificaciones creadas: ${creadas}`);
  } catch (error) {
    console.error("[vencimientosJob] Error en revisarDeudasPorVencer:", error.message);
  }
};

// ─────────────────────────────────────────────────────────────
//  iniciarVencimientosJob
//  Registra el cron. Se llama una sola vez al arrancar el server.
//  Corre todos los días a las 06:00 (hora del servidor).
// ─────────────────────────────────────────────────────────────
const iniciarVencimientosJob = () => {
  cron.schedule("0 6 * * *", () => {
    console.log("[vencimientosJob] Ejecutando revisión diaria de vencimientos...");
    revisarDeudasPorVencer();
  });

  console.log("[vencimientosJob] Cron de vencimientos registrado (06:00 diario).");
};

module.exports = {
  iniciarVencimientosJob,
  revisarDeudasPorVencer,
};