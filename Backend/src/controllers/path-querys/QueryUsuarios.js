const mysql = require("mysql2");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

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

    const email = req.query.Email || null;
    const limitNumber = Number(req.query.limit) || 10;
    if (!Number.isInteger(limitNumber)) {
        return res.status(400).json({ error: 'El limite debe ser un numero entero' });
    }
    if (limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({ error: 'El limite debe estar entre 1 y 100' });
    }

    let query = "SELECT * FROM usuarios";
    const params = [];

    if (email) {
        query += " WHERE Email = ?";
        params.push(email);
    }
    query += " LIMIT ?";
    params.push(limitNumber);

    conexion.query(query, params, (err, result) => {

        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener los usuarios' });
        }

        return res.json(result);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});