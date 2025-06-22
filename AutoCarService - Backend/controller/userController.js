const db = require('../models/db');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios (admin)
exports.obtenerUsuarios = (req, res) => {
  db.query('SELECT id, nombre_completo, email, telefono, celular, rol_id FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Editar usuario (sin rol)
exports.editarUsuario = (req, res) => {
  const { id } = req.params;
  const { nombre_completo, email, telefono, celular } = req.body;

  if (req.user.rol_id !== 3 && req.user.id != id) {
    return res.status(403).json({ error: 'No puedes editar otros usuarios' });
  }

  const sql = `UPDATE usuarios SET nombre_completo=?, email=?, telefono=?, celular=? WHERE id=?`;

  db.query(sql, [nombre_completo, email, telefono, celular, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Usuario actualizado correctamente' });
  });
};

exports.cambiarContrasena = (req, res) => {
  const { id } = req.params;
  const { nuevaContrasena } = req.body;

  // Solo el usuario dueño puede cambiar su contraseña
  if (req.user.rol_id !== 3 && req.user.id != id) {
    return res.status(403).json({ error: 'No tienes permiso para cambiar esta contraseña' });
  }

  if (!nuevaContrasena || nuevaContrasena.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const hashedPassword = bcrypt.hashSync(nuevaContrasena, 10);

  const sql = `UPDATE usuarios SET contrasena = ? WHERE id = ?`;

  db.query(sql, [hashedPassword, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Contraseña actualizada correctamente' });
  });
};

// Editar usuario completo (incluye rol)
exports.editarUsuarioAdmin = (req, res) => {
  const { id } = req.params;
  const { nombre_completo, email, telefono, celular, rol_id } = req.body;

  if (req.user.rol_id !== 3) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const sql = `UPDATE usuarios SET nombre_completo=?, email=?, telefono=?, celular=?, rol_id=? WHERE id=?`;

  db.query(sql, [nombre_completo, email, telefono, celular, rol_id, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Usuario (admin) actualizado correctamente' });
  });
};

// Cambiar rol de usuario
exports.cambiarRol = (req, res) => {
  if (req.user.rol_id !== 3) {
    return res.status(403).json({ error: 'Solo el administrador puede cambiar roles' });
  }

  const { id } = req.params;
  const { rol_id } = req.body;

  const sql = `UPDATE usuarios SET rol_id = ? WHERE id = ?`;

  db.query(sql, [rol_id, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Rol actualizado correctamente' });
  });
};

// Eliminar usuario
exports.eliminarUsuario = (req, res) => {
  if (req.user.rol_id !== 3) {
    return res.status(403).json({ error: 'Solo el administrador puede eliminar usuarios' });
  }

  const { id } = req.params;

  db.query('DELETE FROM usuarios WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Usuario eliminado correctamente' });
  });
};
