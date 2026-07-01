const cron = require("node-cron");
const pool = require("../../db/connection");

const MESES_ANTIGUEDAD = 3;

const archivarHistorialAntiguo = async () => {
  try {
    const [result] = await pool.query(
      `UPDATE HISTORIAL
       SET Archivada = TRUE
       WHERE Archivada = FALSE
         AND Fecha < DATE_SUB(NOW(), INTERVAL ? MONTH)`,
      [MESES_ANTIGUEDAD]
    );

    console.log(`[archivadoHistorialJob] Registros archivados: ${result.affectedRows}`);
  } catch (error) {
    console.error("[archivadoHistorialJob] Error en archivarHistorialAntiguo:", error.message);
  }
};

const iniciarArchivadoHistorialJob = () => {
  cron.schedule("0 4 */3 * *", () => {
    console.log("[archivadoHistorialJob] Ejecutando archivado de historial antiguo...");
    archivarHistorialAntiguo();
  });

  console.log("[archivadoHistorialJob] Cron de archivado registrado (04:00, cada 3 días).");
};

module.exports = {
  iniciarArchivadoHistorialJob,
  archivarHistorialAntiguo, // exportado para poder probarlo manualmente
};