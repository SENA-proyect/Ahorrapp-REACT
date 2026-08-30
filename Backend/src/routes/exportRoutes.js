const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { 
    exportarDatos, 
    obtenerExportaciones, 
    eliminarExportacion 
} = require('../controllers/exportController');

// GET /api/exportar - Obtener el historial de exportaciones
router.get('/', verifyToken, obtenerExportaciones);

// POST /api/exportar - Crear una nueva exportación
router.post('/', verifyToken, exportarDatos);

// DELETE /api/exportar/:id - Eliminar una exportación específica
router.delete('/:id', verifyToken, eliminarExportacion);

module.exports = router;


// este archivo es el mismo de "exportar.js" ubicado en la misma carpeta de routes, desconozco el motivo del cambio de nombre, pero se recomienda mantener un nombre consistente para evitar confusiones.