const cron = require("node-cron");
const pool = require("../../db/connection");
const {
  verificarUmbralGastos,
  verificarUmbralImprevistos,
} = require("../NotificacionesService");

// Corre cada 3 horas. Barato: solo consulta usuarios con período activo.
const revisarUmbralesTodosLosUsuarios = async () => {
  try {
    const { rows: usuarios } = await pool.query(
      `SELECT DISTINCT id_usuario FROM periodos WHERE activo = TRUE`
    );

    for (const { id_usuario } of usuarios) {
      await verificarUmbralGastos(id_usuario);
      await verificarUmbralImprevistos(id_usuario);
    }

    console.log(`[umbralesJob] Revisados ${usuarios.length} usuarios.`);
  } catch (error) {
    console.error("[umbralesJob] Error:", error.message);
  }
};

const iniciarUmbralesJob = () => {
  // Cada 3 horas en punto
  cron.schedule("0 */3 * * *", () => {
    console.log("[umbralesJob] Ejecutando revisión de umbrales...");
    revisarUmbralesTodosLosUsuarios();
  });
  console.log("[umbralesJob] Cron de umbrales registrado (cada 3h).");
};

module.exports = { iniciarUmbralesJob, revisarUmbralesTodosLosUsuarios };