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

const getCategorias = async (req, res) => {
    const id_usuario = req.query.id_usuario || 1; 
    try {
        const [rows] = await pool.query(
            `SELECT ID_categoria AS id, ID_usuario, Nombre AS nombre, Descripcion AS descripcion, 
             Color AS color, Icono AS icono, Activa AS activa, Sistema AS sistema, ES_global AS es_global
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

const getDependientes = async (req, res) => {
    const id_usuario = req.query.id_usuario || 1;
    try {
        const [rows] = await pool.query(
            `SELECT ID_dependientes AS id, ID_usuario AS id_usuario, Nombre AS nombre, 
             Relacion AS relacion, Ocupacion AS ocupacion, Fecha_nacimiento AS fecha, 
             Peso_economico AS dependencia
             FROM DEPENDIENTES
             WHERE ID_usuario = ? 
             ORDER BY id DESC`, 
            [id_usuario] 
        );
        return res.status(200).json({ ok: true, dependientes: rows });
    } catch (error) {
        console.error("Error en getDependientes:", error.message);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener dependientes" });
    }
};


const getIngresos = async (req, res) => {
    const id_usuario = req.query.id_usuario || 1;

    try {
        const [rows] = await pool.query(
            `SELECT 
                ID_ingresos AS id, 
                ID_entrada AS entrada, 
                ID_categoria AS categoria, 
                Monto AS monto, 
                Descripcion AS descripcion, 
                Fuente AS fuente, 
                Fecha_registro AS fecha
             FROM INGRESOS 
             WHERE ID_usuario = ?
             ORDER BY monto ASC`,
            [id_usuario]                        
        );
        
        return res.status(200).json({ ok: true, ingresos: rows });

    } catch (error) {
        console.error("Error en getIngresos:", error.message);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener los ingresos" });
    }
};




// Rutas (Asegúrate de incluir la COMA aquí abajo)
app.get('/api/categorias', getCategorias);
app.get('/api/dependientes', getDependientes); 
app.get('/api/ingresos', getIngresos);

app.get('/', (req, res) => {
    res.send('Servidor AhorrApp activo en el puerto ' + PORT);
});

app.listen(PORT, () => {
    console.log(` Servidor corriendo en: http://localhost:${PORT}`);
    console.log(` Categorías: http://localhost:${PORT}/api/categorias`);
    console.log(` Dependientes: http://localhost:${PORT}/api/dependientes`);
    console.log(` Ingresos: http://localhost:${PORT}/api/ingresos`);

});
