const express = require('express');
const router = express.Router();
const { getDependientes, addDependiente, updateDependiente, deleteDependiente } = require('../controllers/dependientesController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/',     verifyToken, getDependientes);
router.post('/',    verifyToken, addDependiente);
router.put('/:id',  verifyToken, updateDependiente);
router.delete('/:id', verifyToken, deleteDependiente);

module.exports = router;
