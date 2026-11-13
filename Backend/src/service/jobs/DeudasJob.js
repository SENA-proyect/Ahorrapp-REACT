const cron = require("node-cron");
const pool = require("../../db/connection");
const { verificarDeudasProximasAVencer } = require("../../service/NotificacionesService");

const iniciarJobDeudas = () => {    q
  // '0 6 * * *' significa: Minuto 0, Hora 6, Todos los días
  cron.schedule("0 6 * * *", async () => {
    console.log("⏰ [CRON] Ejecutando revisión diaria de deudas próximas a vencer (06:00 AM)...");
    
    try {
      // Buscamos todos los usuarios activos
      const { rows: usuarios } = await pool.query(
        `SELECT id_usuario FROM usuarios WHERE activo = TRUE`
      );

      // Revisamos las deudas de cada usuario
      for (const { id_usuario } of usuarios) {
        await verificarDeudasProximasAVencer(id_usuario);
      }
      
      console.log("✅ [CRON] Revisión de deudas finalizada.");
    } catch (error) {
      console.error("❌ [CRON] Error en la revisión de deudas:", error.message);
    }
  });
};

module.exports = { iniciarJobDeudas };