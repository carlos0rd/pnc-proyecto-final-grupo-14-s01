const db = require('../models/db');

exports.crearReparacion = (req, res) => {
  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  const {
    tipo_reparacion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    status,
    precio,
    vehiculo_id
  } = req.body;

  const sql = `INSERT INTO reparaciones 
  (tipo_reparacion, descripcion, fecha_inicio, fecha_fin, status, precio, vehiculo_id, mecanico_id) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [
    tipo_reparacion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    status,
    precio,
    vehiculo_id,
    req.user.id
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Reparación registrada correctamente' });
  });
};

exports.obtenerReparaciones = (req, res) => {
  const { rol_id, id } = req.user;

  let sql = `
    SELECT r.*, v.modelo, v.placa, u.nombre_completo AS cliente 
    FROM reparaciones r
    JOIN vehiculos v ON r.vehiculo_id = v.id
    JOIN usuarios u ON v.usuario_id = u.id
  `;

  const params = [];

  if (rol_id === 1) {
    sql += ' WHERE v.usuario_id = ?';
    params.push(id);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.editarReparacion = (req, res) => {
  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'No tienes permiso para editar reparaciones.' });
  }

  const { id } = req.params;
  const {
    tipo_reparacion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    status,
    precio
  } = req.body;

  const sql = `UPDATE reparaciones 
               SET tipo_reparacion=?, descripcion=?, fecha_inicio=?, fecha_fin=?, status=?, precio=? 
               WHERE id=?`;

  db.query(sql, [
    tipo_reparacion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    status,
    precio,
    id
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Reparación actualizada correctamente' });
  });
};

exports.eliminarReparacion = (req, res) => {
  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar reparaciones.' });
  }

  const { id } = req.params;

  const sql = `DELETE FROM reparaciones WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Reparación eliminada correctamente' });
  });
};

exports.obtenerReparacionPorId = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT r.*, v.modelo, v.placa, u.nombre_completo AS cliente
    FROM reparaciones r
    JOIN vehiculos v ON r.vehiculo_id = v.id
    JOIN usuarios u ON v.usuario_id = u.id
    WHERE r.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Reparación no encontrada' });
    }

    const reparacion = results[0];

    if (req.user.rol_id === 1 && reparacion.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta reparación' });
    }

    res.json(reparacion);
  });
};


// Obtener reparaciones por vehículo ya sea por id o por placa
exports.obtenerPorVehiculo = (req, res) => {
  const identificador = req.params.identificador;

  const sql = `
    SELECT r.*, v.modelo, v.placa, u.nombre_completo AS cliente
    FROM reparaciones r
    JOIN vehiculos v ON r.vehiculo_id = v.id
    JOIN usuarios u ON v.usuario_id = u.id
    WHERE v.id = ? OR v.placa = ?
  `;

  db.query(sql, [identificador, identificador], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (req.user.rol_id === 1) {
      // Filtrar por cliente dueño del vehículo
      results = results.filter(r => r.usuario_id === req.user.id);
    }

    res.json(results);
  });
};
