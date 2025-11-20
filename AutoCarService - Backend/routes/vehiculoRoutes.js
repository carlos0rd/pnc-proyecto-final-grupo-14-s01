const express = require('express');
const multer = require('multer');
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

router.post("/", (req, res, next) => {
  upload.single("imagen")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'El archivo es demasiado grande (máximo 2MB)' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, crearVehiculo);
router.get('/', obtenerVehiculos);
router.get('/:id', obtenerVehiculoPorId);         
//router.put('/:id', editarVehiculo);
router.put("/:id", verifyToken, upload.single("imagen"), editarVehiculo);
router.delete('/:id', eliminarVehiculo);   



module.exports = router;
