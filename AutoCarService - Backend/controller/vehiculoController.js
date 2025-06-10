const db = require('../models/db');

// Crear vehículo (solo mecánico o admin)
exports.crearVehiculo = (req, res) => {
  const { modelo, marca, anio, color, placa, imagen, usuario_id } = req.body;

  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  const sql = `INSERT INTO vehiculos (modelo, marca, anio, color, placa, imagen, usuario_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [modelo, marca, anio, color, placa, imagen, usuario_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Vehículo registrado correctamente' });
  });
};

// Obtener vehículos
exports.obtenerVehiculos = (req, res) => {
  const { rol_id, id } = req.user;

  let sql = 'SELECT * FROM vehiculos';
  let params = [];

  if (rol_id === 1) {
    sql += ' WHERE usuario_id = ?';
    params.push(id);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Editar vehículo (solo mecánico o admin)
exports.editarVehiculo = (req, res) => {
  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'No tienes permiso para editar vehículos.' });
  }

  const { id } = req.params;
  const { modelo, marca, anio, color, placa } = req.body;

  const sql = `UPDATE vehiculos SET modelo=?, marca=?, anio=?, color=?, placa=? WHERE id = ?`;

  db.query(sql, [modelo, marca, anio, color, placa, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vehículo actualizado correctamente' });
  });
};

// Eliminar vehículo (solo mecánico o admin)
exports.eliminarVehiculo = (req, res) => {
  if (req.user.rol_id === 1) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar vehículos.' });
  }

  const { id } = req.params;

  const sql = `DELETE FROM vehiculos WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vehículo eliminado correctamente' });
  });
};

//Obtener un vehículo por ID (solo mecánico o admin)
exports.obtenerVehiculoPorId = (req, res) => {
  const { id } = req.params;

  const sql = `SELECT * FROM vehiculos WHERE id = ?`;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(results[0]);
  });
};