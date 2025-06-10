const express = require('express');
const {
  crearVehiculo,
  obtenerVehiculos,
  editarVehiculo,
  eliminarVehiculo,
  obtenerVehiculoPorId
} = require('../controller/vehiculoController');

const verifyToken = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(verifyToken);

router.post('/', crearVehiculo);           
router.get('/', obtenerVehiculos);
router.get('/:id', obtenerVehiculoPorId);         
router.put('/:id', editarVehiculo);
router.delete('/:id', eliminarVehiculo);   

module.exports = router;
