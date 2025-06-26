const express = require('express');
const { allowRoles } = require('../middlewares/roleMiddleware');
const upload  = require('../utils/multer');


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

//router.post('/', crearVehiculo, upload.single('imagen'));           
router.post("/", upload.single("imagen"), crearVehiculo);
router.get('/', obtenerVehiculos);
router.get('/:id', obtenerVehiculoPorId);         
//router.put('/:id', editarVehiculo);
router.put("/:id", verifyToken, upload.single("imagen"), editarVehiculo);
router.delete('/:id', eliminarVehiculo);   



module.exports = router;
