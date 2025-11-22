// routes/repuestos.js
const express = require('express');
const router = express.Router();
const { allowRoles } = require('../middlewares/roleMiddleware');

const repuestoController = require('../controller/repuestoController');
const verifyToken = require('../middlewares/authMiddleware');

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

//Rutas de categorías
//Obtener todas las categorías
router.get('/categorias/todas', repuestoController.obtenerCategorias);

//Obtener repuestos por categoría
router.get('/categorias/:categoria_id', repuestoController.obtenerRepuestosPorCategoria);

//Crear categoría (solo admin)
router.post('/categorias', allowRoles(3), repuestoController.crearCategoria);

//Editar categoría (solo admin)
router.put('/categorias/:id', allowRoles(3), repuestoController.editarCategoria);

//Rutas de repuestos
//Obtener todos los repuestos (activos o todos si es admin)
router.get('/', repuestoController.obtenerRepuestos);

//Crear repuesto (solo mecánico o admin)
router.post('/', allowRoles(2, 3), repuestoController.crearRepuesto);

//Obtener un repuesto por ID
router.get('/:id', repuestoController.obtenerRepuestoPorId);

//Editar repuesto (solo mecánico o admin)
router.put('/:id', allowRoles(2, 3), repuestoController.editarRepuesto);

//Eliminar repuesto (soft delete, solo admin)
router.delete('/:id', allowRoles(3), repuestoController.eliminarRepuesto);

module.exports = router;
