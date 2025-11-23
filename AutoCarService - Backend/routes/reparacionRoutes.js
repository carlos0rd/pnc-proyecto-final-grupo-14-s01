const express = require('express');
const multer = require('multer');
const { allowRoles } = require('../middlewares/roleMiddleware');
const upload = require('../utils/multer');

const {
  crearReparacion,
  obtenerReparaciones,
  editarReparacion,
  eliminarReparacion,
  obtenerPorVehiculo,
  obtenerReparacionPorId,
  decisionCotizacion,          // 👈 YA VIENE DESDE AQUÍ
} = require('../controller/reparacionController');

const verifyToken = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// POST con manejo de imagen "antes"
router.post(
  '/',
  allowRoles(2, 3),
  (req, res, next) => {
    upload.fields([{ name: 'imagen_antes', maxCount: 1 }])(
      req,
      res,
      (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res
                .status(400)
                .json({ error: 'El archivo es demasiado grande (máximo 2MB)' });
            }
            return res.status(400).json({ error: err.message });
          }
          return res.status(400).json({ error: err.message });
        }
        next();
      }
    );
  },
  crearReparacion
);

router.get('/', obtenerReparaciones);
router.get('/vehiculo/:identificador', obtenerPorVehiculo);
router.get('/:id', obtenerReparacionPorId);

// PUT con manejo de imagen "después" (y opcionalmente "antes")
router.put(
  '/:id',
  allowRoles(2, 3),
  (req, res, next) => {
    upload.fields([
      { name: 'imagen_antes', maxCount: 1 },
      { name: 'imagen_despues', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res
              .status(400)
              .json({ error: 'El archivo es demasiado grande (máximo 2MB)' });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  editarReparacion
);

router.delete('/:id', allowRoles(2, 3), eliminarReparacion);

// 👇 HU3: decidir cotización (aprobar / rechazar) desde el portal del cliente
router.patch('/:id/decision-cotizacion', decisionCotizacion);

module.exports = router;
