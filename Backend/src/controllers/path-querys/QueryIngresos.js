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

app.get('/ingresos', (req, res) => {
    // 1. Captura y conversión de tipos
    const id_usuario = req.query.ID_usuario || null;
    const monto_minimo = parseFloat(req.query.monto_minimo) || 0;
    const limitNumber = parseInt(req.query.limit) || 10;

    // 2. Validaciones estrictas
    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({ error: 'El limite debe ser un numero entero entre 1 y 100' });
    }
    if (isNaN(monto_minimo) || monto_minimo < 0) {
        return res.status(400).json({ error: 'El monto minimo debe ser un numero positivo' });
    }

    // 3. Construcción de la Query
    let query = `
        SELECT 
            I.ID_ingresos,
            I.Monto,
            I.Descripcion,
            I.Fuente,
            I.Fecha_registro,
            M.ID_usuario
        FROM INGRESOS I
        JOIN ENTRADA E ON I.ID_entrada = E.ID_entrada
        JOIN MOVIMIENTOS M ON E.ID_movimiento = M.ID_movimiento
    `;

    const conditions = [];
    const params = [];

    if (id_usuario) {
        conditions.push("M.ID_usuario = ?");
        params.push(id_usuario);
    }

    if (monto_minimo > 0) {
        conditions.push("I.Monto >= ?");
        params.push(monto_minimo);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    // Importante: Ordenar por fecha suele ser útil en ingresos
    query += " ORDER BY I.Fecha_registro DESC LIMIT ?";
    params.push(limitNumber);

    // 4. Ejecución
    conexion.query(query, params, (err, result) => {
        if (err) {
            console.error("Detalle del error en SQL:", err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Si prefieres devolver un array vacío en lugar de 404:
        // El 404 es debatible en filtros; usualmente se prefiere [] si la consulta es exitosa pero vacía.
        if (result.length === 0) {
            return res.status(404).json({ message: 'No se encontraron ingresos con los filtros aplicados' });
        }
        
        return res.json(result);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});