const db = require('../models/db');

// Crear servicio (solo mecánico o admin)
exports.crearServicio = (req, res) => {
  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'No tienes permiso para crear servicios.' });
  }

  const {
    nombre_servicio,
    descripcion,
    fecha_inicio,
    fecha_fin,
    precio,
    reparacion_id
  } = req.body;

  const sql = `INSERT INTO servicios 
  (nombre_servicio, descripcion, fecha_inicio, fecha_fin, precio, reparacion_id)
  VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [nombre_servicio, descripcion, fecha_inicio, fecha_fin, precio, reparacion_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Servicio agregado correctamente' });
  });
};

// Obtener servicios por reparación
exports.obtenerPorReparacion = (req, res) => {
  const { reparacion_id } = req.params;

  const sql = `
    SELECT s.* 
    FROM servicios s
    JOIN reparaciones r ON s.reparacion_id = r.id
    JOIN vehiculos v ON r.vehiculo_id = v.id
    WHERE s.reparacion_id = ?
  `;

  db.query(sql, [reparacion_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // Verificación de propiedad para clientes
    if (req.user.rol_id === 1 && results.length > 0) {
      const usuario_id = results[0].usuario_id;
      if (usuario_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso a estos servicios.' });
      }
    }

    res.json(results);
  });
};

// Editar servicio
exports.editarServicio = (req, res) => {
  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'No tienes permiso para editar servicios.' });
  }

  const { id } = req.params;
  const { nombre_servicio, descripcion, fecha_inicio, fecha_fin, precio } = req.body;

  const sql = `
    UPDATE servicios SET 
    nombre_servicio=?, descripcion=?, fecha_inicio=?, fecha_fin=?, precio=?
    WHERE id=?
  `;

  db.query(sql, [nombre_servicio, descripcion, fecha_inicio, fecha_fin, precio, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Servicio actualizado correctamente' });
  });
};

// Eliminar servicio
exports.eliminarServicio = (req, res) => {
  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar servicios.' });
  }

  const { id } = req.params;

  const sql = `DELETE FROM servicios WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Servicio eliminado correctamente' });
  });
};
