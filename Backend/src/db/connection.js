const { Pool } = require("pg");
require("dotenv").config();

// Supabase (como casi todo Postgres alojado en la nube) EXIGE conexión
// por SSL. Sin "ssl: { rejectUnauthorized: false }" la conexión falla
// con un error de certificado, aunque el resto esté bien configurado.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool
  .connect()
  .then((client) => {
    console.log("Conexión a la base de datos exitosa");
    client.release();
  })
  .catch((error) => {
    console.error("Error al conectar a la base de datos:", error.message);
  });

module.exports = pool;