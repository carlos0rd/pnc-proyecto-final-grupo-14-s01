const express = require('express');
const {
  obtenerUsuarios,
  editarUsuario,
  editarUsuarioAdmin,
  cambiarRol,
  eliminarUsuario,
  cambiarContrasena
} = require('../controller/userController');

const verifyToken = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get("/me", (req, res) => {
  const {
    id,
    email,
    rol_id,
    nombre_completo,
    telefono,
    celular
  } = req.user;

  res.json({
    id,
    email,
    rol_id,
    nombre_completo,
    telefono,
    celular
  });
});

router.get('/', allowRoles(3), obtenerUsuarios);                        
router.put('/:id', editarUsuario);     
router.put('/cambiar-contrasena/:id', cambiarContrasena);
router.put('/admin/:id', allowRoles(3), editarUsuarioAdmin);           
router.patch('/:id/rol', allowRoles(3), cambiarRol);                   
router.delete('/:id', allowRoles(3), eliminarUsuario);


module.exports = router;
