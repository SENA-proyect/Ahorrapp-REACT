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

app.get('/gastos', (req, res) => {
    const id_usuario = req.query.ID_usuario || null;

    // Si no envían ID_usuario, podrías querer avisar o traer todos
    if (!id_usuario) {
        return res.status(400).json({ error: 'Debes proporcionar un ID_usuario' });
    }

    // Usamos los JOINs porque GASTOS no sabe quién es el usuario directamente
    let query = `
        SELECT G.* 
        FROM GASTOS G
        JOIN SALIDA S ON G.ID_salida = S.ID_salida
        JOIN MOVIMIENTOS M ON S.ID_movimiento = M.ID_movimiento
        WHERE M.ID_usuario = ?
    `;

    const params = [id_usuario];

    conexion.query(query, params, (err, result) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: 'Error al consultar la base de datos' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Este usuario no tiene gastos registrados' });
        }
        
        return res.json(result);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});