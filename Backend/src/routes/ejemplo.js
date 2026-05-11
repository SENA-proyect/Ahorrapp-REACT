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

    const { id } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT 
                i.ID_ingresos AS id, 
                i.Monto AS monto, 
                i.Descripcion AS descripcion, 
                i.Fuente AS fuente, 
                i.Fecha_registro AS fecha
             FROM INGRESOS i
             INNER JOIN ENTRADA e ON i.ID_entrada = e.ID_entrada
             INNER JOIN MOVIMIENTOS m ON e.ID_movimiento = m.ID_movimiento
             WHERE m.ID_usuario = ?
             ORDER BY i.Fecha_registro DESC`,
            [id]                        
        );
        return res.status(200).json({ ok: true, ingresos: rows });
    } catch (error) {
        console.error("Error en getIngresos:", error.message);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener los ingresos" });
    }
};


const getDeudas = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT 
                d.ID_deudas AS id, 
                d.Monto AS monto, 
                d.Fuente AS fuente, 
                d.Descripcion AS descripcion, 
                d.Cuotas_total AS cuotas, 
                d.Cuotas_pagadas AS cuotas_pagas,
                d.Fecha_inicio AS inicio, 
                d.Fecha_fin AS fin, 
                d.Estado AS estado
             FROM DEUDAS d
             INNER JOIN SALIDA s ON d.ID_salida = s.ID_salida
             INNER JOIN MOVIMIENTOS m ON s.ID_movimiento = m.ID_movimiento
             WHERE m.ID_usuario = ? 
             ORDER BY d.ID_deudas DESC`, 
            [id] 
        );
        
        return res.status(200).json({ ok: true, deudas: rows });
    } catch (error) {
        console.error("Error en getDeudas:", error.message);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener las deudas" });
    }
};



app.get('/api/categorias', getCategorias);
app.get('/api/dependientes', getDependientes); 
app.get('/api/ingresos', getIngresos);
app.get('/api/deudas', getDeudas);

app.get('/', (req, res) => {
    res.send('Servidor AhorrApp activo en el puerto ' + PORT);
});

app.listen(PORT, () => {
    console.log(` Servidor corriendo en: http://localhost:${PORT}`);
    console.log(` Categorías: http://localhost:${PORT}/api/categorias`);
    console.log(` Dependientes: http://localhost:${PORT}/api/dependientes`);
    console.log(` Ingresos: http://localhost:${PORT}/api/ingresos`);
    console.log(` Deudas: http://localhost:${PORT}/api/deudas`);

});
