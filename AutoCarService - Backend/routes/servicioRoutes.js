const express = require('express');
const { allowRoles } = require('../middlewares/roleMiddleware');

const {
  crearServicio,
  obtenerPorReparacion,
  editarServicio,
  eliminarServicio
} = require('../controller/servicioController');

const verifyToken = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(verifyToken);

router.post('/', allowRoles(2, 3), crearServicio);
router.get('/reparacion/:reparacion_id', verifyToken, obtenerPorReparacion);
router.put('/:id', allowRoles(2, 3), editarServicio);
router.delete('/:id', allowRoles(2, 3), eliminarServicio);


module.exports = router;
