const express = require('express');
const { allowRoles } = require('../middlewares/roleMiddleware');

const {
  crearServicio,
  obtenerPorReparacion,
  editarServicio,
  eliminarServicio,
  obtenerServicioCompleto
} = require('../controller/servicioController');

const verifyToken = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(verifyToken);

router.post('/', allowRoles(2, 3), crearServicio);
router.get('/reparacion/:reparacion_id', verifyToken, obtenerPorReparacion);
router.put('/:id', allowRoles(2, 3), editarServicio);
router.delete('/:id', allowRoles(2, 3), eliminarServicio);
router.get('/:id/completo', allowRoles(1,2,3), obtenerServicioCompleto);



module.exports = router;
