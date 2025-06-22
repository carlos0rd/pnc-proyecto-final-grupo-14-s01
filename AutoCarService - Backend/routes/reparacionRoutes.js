const express = require('express');
const { allowRoles } = require('../middlewares/roleMiddleware');

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

router.post('/', allowRoles(2, 3), crearReparacion);
router.get('/', obtenerReparaciones);
router.get('/vehiculo/:identificador', obtenerPorVehiculo);
router.get('/:id', obtenerReparacionPorId);
router.put('/:id', allowRoles(2, 3), editarReparacion);
router.delete('/:id', allowRoles(2, 3), eliminarReparacion);


module.exports = router;
