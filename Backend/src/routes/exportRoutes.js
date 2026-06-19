const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { exportarDatos } = require('../controllers/exportController');

// POST /api/exportar
router.post('/', verifyToken, exportarDatos);

module.exports = router;

// este archivo es el mismo de "exportar.js" ubicado en la misma carpeta de routes, desconozco el motivo del cambio de nombre, pero se recomienda mantener un nombre consistente para evitar confusiones.