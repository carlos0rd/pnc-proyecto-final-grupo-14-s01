const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');
const {
  obtenerFacturas,
  obtenerFacturaPorId,
  generarPDFFactura,
  crearFactura
} = require('../controller/facturaController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /facturas - Get all invoices (filtered by user role)
router.get('/', obtenerFacturas);

// GET /facturas/:id - Get invoice details
router.get('/:id', obtenerFacturaPorId);

// GET /facturas/:id/pdf - Download invoice as PDF
router.get('/:id/pdf', generarPDFFactura);

// POST /facturas - Create invoice (only for mechanics and admins)
router.post('/', allowRoles(2, 3), crearFactura);

module.exports = router;

