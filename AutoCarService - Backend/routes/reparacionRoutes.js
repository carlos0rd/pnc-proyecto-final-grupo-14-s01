const express = require('express');
const {
  crearReparacion,
  obtenerReparaciones,
  editarReparacion,
  eliminarReparacion,
  obtenerPorVehiculo,
  obtenerReparacionPorId
} = require('../controller/reparacionController');

const verifyToken = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(verifyToken);

router.post('/', crearReparacion);
router.get('/', obtenerReparaciones);
router.get('/vehiculo/:identificador', obtenerPorVehiculo);
router.get('/:id', obtenerReparacionPorId);
router.put('/:id', editarReparacion);
router.delete('/:id', eliminarReparacion);

module.exports = router;
