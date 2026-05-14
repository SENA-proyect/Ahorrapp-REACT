const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { exportarDatos } = require('../controllers/exportController');

// POST /api/exportar
router.post('/', verifyToken, exportarDatos);

module.exports = router;