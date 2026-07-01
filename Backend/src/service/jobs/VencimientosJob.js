const cron = require("node-cron");
const pool = require("../../db/connection");
const { crearNotificacion, existeNotificacionEntidad } = require("../notificacionesService");

const DIAS_AVISO_DEUDA = 5;

// ─────────────────────────────────────────────────────────────
//  revisarDeudasPorVencer
// ─────────────────────────────────────────────────────────────
const revisarDeudasPorVencer = async () => {
  try {
    const [deudas] = await pool.query(
      `SELECT
         d.ID_deudas,
         d.Descripcion,
         d.Monto,
         d.Fecha_fin,
         m.ID_usuario
       FROM DEUDAS d
       INNER JOIN SALIDA s      ON d.ID_salida     = s.ID_salida
       INNER JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
       WHERE d.Estado = 'pendiente'
         AND d.Cuotas_pagadas < d.Cuotas_total
         AND d.Fecha_fin IS NOT NULL
         AND d.Fecha_fin >= CURDATE()
         AND d.Fecha_fin <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
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