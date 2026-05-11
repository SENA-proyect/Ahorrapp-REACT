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

app.get('/dependientes', (req, res) => {

    const id_usuario = req.query.ID_usuario || null;
    let query = "SELECT * FROM dependientes where ID_usuario = ? ";
    const params = [];

    if (id_usuario) {
        params.push(id_usuario);
    }

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