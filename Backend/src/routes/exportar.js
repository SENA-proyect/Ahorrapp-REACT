const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { exportarDatos, obtenerExportaciones, eliminarExportacion } = require('../controllers/exportController');

router.get('/', verifyToken, obtenerExportaciones);
router.post('/', verifyToken, exportarDatos);
router.delete('/:id', verifyToken, eliminarExportacion);

module.exports = router;