// routes/repuestos.js
const express = require('express');
const router = express.Router();

const repuestoController = require('../controller/repuestoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Solo usuarios autenticados pueden ver el catálogo
router.get('/', authMiddleware, repuestoController.obtenerRepuestos);

module.exports = router;
