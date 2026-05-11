const mysql = require("mysql2");
const express = require("express");
const app = express();

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'AhorrApp',
    password: 'Ah0rrApp_2026!',
    database: 'SEproyectoNA'
});

conexion.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos');
});

app.get('/usuarios', (req, res) => {
    const query = "SELECT * FROM usuarios";
    conexion.query(query, (err, result) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener los usuarios' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'No se encontraron usuarios' });
        }
        return res.json(result);
    });
});