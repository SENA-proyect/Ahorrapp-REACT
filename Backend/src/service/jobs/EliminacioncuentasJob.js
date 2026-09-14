const cron = require("node-cron");
const pool = require("../../db/connection");

// ─────────────────────────────────────────────────────────────
//  eliminarCuentasVencidas
//  Borra en definitivo las cuentas que el propio usuario desactivó
//  desde Configuración y cuyo plazo de 30 días ya se cumplió.
//
//  IMPORTANTE: la tabla `historial` tiene ON DELETE CASCADE hacia
//  `usuarios`, así que al borrar la cuenta también desaparecen sus
//  registros de historial (incluyendo el de "Desactivó su cuenta").
//  Por eso este job deja constancia solo en el log del servidor,
//  no en la tabla `historial`. Si necesitas que quede un rastro
//  permanente después del borrado, contaríamos con una tabla
//  aparte que no dependa de `usuarios` por FK.
// ─────────────────────────────────────────────────────────────
const eliminarCuentasVencidas = async () => {
  try {
    const { rows: cuentas } = await pool.query(
      `SELECT id_usuario AS "ID_usuario", email AS "Email"
       FROM usuarios
       WHERE activo = FALSE
         AND fecha_eliminacion_programada IS NOT NULL
         AND fecha_eliminacion_programada <= NOW()`
    );

    let eliminadas = 0;

    for (const cuenta of cuentas) {
      try {
        await pool.query("DELETE FROM usuarios WHERE id_usuario = $1", [cuenta.ID_usuario]);
        console.log(`[eliminacionCuentasJob] Cuenta eliminada definitivamente: ID ${cuenta.ID_usuario} (${cuenta.Email})`);
        eliminadas++;
      } catch (errorFila) {
        console.error(`[eliminacionCuentasJob] No se pudo eliminar la cuenta ID ${cuenta.ID_usuario}:`, errorFila.message);
      }
    }

    console.log(`[eliminacionCuentasJob] Revisión completa. Cuentas eliminadas: ${eliminadas}`);
  } catch (error) {
    console.error("[eliminacionCuentasJob] Error en eliminarCuentasVencidas:", error.message);
  }
};

// ─────────────────────────────────────────────────────────────
//  iniciarEliminacionCuentasJob
//  Registra el cron. Se llama una sola vez al arrancar el server.
//  Corre todos los días a las 03:00 (antes que VencimientosJob).
// ─────────────────────────────────────────────────────────────
const iniciarEliminacionCuentasJob = () => {
  cron.schedule("0 3 * * *", () => {
    console.log("[eliminacionCuentasJob] Ejecutando revisión diaria de cuentas por eliminar...");
    eliminarCuentasVencidas();
  });

  console.log("[eliminacionCuentasJob] Cron de eliminación de cuentas registrado (03:00 diario).");
};

module.exports = {
  iniciarEliminacionCuentasJob,
  eliminarCuentasVencidas,
};