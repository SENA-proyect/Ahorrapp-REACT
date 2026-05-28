const mysql = require("mysql2/promise");
require("dotenv").config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const query = `
      CREATE TABLE IF NOT EXISTS CONFIGURACIONES (
          ID_configuracion INT AUTO_INCREMENT PRIMARY KEY,
          ID_usuario INT NOT NULL UNIQUE,
          idioma VARCHAR(10) DEFAULT 'es',
          formatoFecha VARCHAR(20) DEFAULT 'DD/MM/AAAA',
          alertasActivas BOOLEAN DEFAULT TRUE,
          moneda VARCHAR(5) DEFAULT 'COP',
          presupuestoMensual DECIMAL(15,2) DEFAULT 1000000.00,
          alertaGastos BOOLEAN DEFAULT TRUE,
          recordatorioPresupuesto BOOLEAN DEFAULT TRUE,
          notificacionMetas BOOLEAN DEFAULT TRUE,
          correoResumen BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `;
    
    await connection.query(query);
    console.log("Tabla CONFIGURACIONES creada o ya existente.");
    await connection.end();
  } catch (error) {
    console.error("Error creando la tabla:", error);
  }
}

run();
