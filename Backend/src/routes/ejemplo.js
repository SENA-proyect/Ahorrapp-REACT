const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 4000; 

app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'AhorrApp',
  password: 'Ah0rrApp_2026!',
  database: 'SEproyectoNA'
});

// obtener TODAS las categorias, tanto predeterminadas como las registradas por el usuario "1"

const getCategorias = async (req, res) => {
    const id_usuario = req.query.id_usuario || 1; 

    try {
        const [rows] = await pool.query(
            `SELECT 
                ID_categoria  AS id,
                ID_usuario    AS id_usuario,
                Nombre        AS nombre,
                Descripcion   AS descripcion,
                Color         AS color,
                Icono         AS icono,
                Activa        AS activa,
                Sistema       AS sistema,
                ES_global     AS es_global
             FROM CATEGORIAS
             WHERE ES_global = TRUE OR ID_usuario = ?
             ORDER BY ES_global DESC, id ASC`,
            [id_usuario]
        );

        
        return res.status(200).json({ ok: true, categorias: rows });

    } catch (error) {
        console.error("Error en la consulta:", error.message);
        return res.status(500).json({ ok: false, mensaje: "Error en la base de datos" });
    }
};

// obtener TODOS los dependientes del usuario "1"
const getDependientes = async (req, res) => {
    const id_dependientes = req.query.id_dependientes || 1;

    try {
        const [rows] = await pool.query(
            'SELECT
                ID_dependientes AS id,
                ID_usuario AS id_usuario,
                Nombre AS nombre,
                Relacion AS relacion,
                Ocupacion AS ocupacion, 
                Fecha_nacimiento AS fecha,
                Peso_economico
                '
        )
    }
}

app.get('/api/categorias', getCategorias);


app.get('/', (req, res) => {
    res.send('Servidor AhorrApp activo en el puerto ' + PORT);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`Ruta de categorías: http://localhost:${PORT}/api/categorias`);
});
