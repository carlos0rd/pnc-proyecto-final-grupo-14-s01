// Requiere que el usuario tenga uno de los roles especificados
function allowRoles(...rolesPermitidos) {
    return (req, res, next) => {
      const rolId = req.user.rol_id;
      if (!rolesPermitidos.includes(rolId)) {
        return res.status(403).json({ error: 'Acceso denegado. Rol no autorizado.' });
      }
      next();
    };
  }
  
  module.exports = { allowRoles };
  