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

app.get('/usuarios/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'El ID del usuario debe ser un número entero positivo' });
    }
    const query = "SELECT * FROM usuarios WHERE ID_usuario = ?";
    conexion.query(query, [id], (err, result) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener el usuario' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(result);
    });
});

app.listen(3001, () => {
    console.log('Servidor corriendo en el puerto 3001');
});