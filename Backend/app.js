const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ ok: true, mensaje: 'Servidor AhorrApp corriendo' });
});

app.get('/api', (req, res) => {
    res.json({ ok: true, mensaje: 'API AhorrApp corriendo' });
});

module.exports = app;