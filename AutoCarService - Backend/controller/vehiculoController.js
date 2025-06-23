const db = require('../models/db');

// Crear vehículo (solo mecánico o admin)
/*exports.crearVehiculo = (req, res) => {
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
};*/

// POST /vehiculos
exports.crearVehiculo = (req, res) => {

  const {
    modelo,
    marca,
    anio,
    color,
    placa,
    imagen,        // nombre de archivo o URL
    clienteEmail   // correo con el que se registró el cliente
  } = req.body;

  /* 1. Buscar el id del cliente por su email */
  db.query(
    "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
    [clienteEmail],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error de base de datos" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      const usuario_id = rows[0].id;

      /* 2. Insertar el vehículo */
      db.query(
        `INSERT INTO vehiculos
         (modelo, marca, anio, color, placa, imagen, usuario_id)
         VALUES (?,?,?,?,?,?,?)`,
        [modelo, marca, anio, color, placa, imagen, usuario_id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al registrar vehículo" });
          }

          res.status(201).json({ message: "Vehículo registrado correctamente" });
        }
      );
    }
  );
};


// Obtener vehículos con paginación y nombre del mecánico más reciente
exports.obtenerVehiculos = (req, res) => {
  const { rol_id, id } = req.user;
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  // Consulta principal con LEFT JOIN para obtener nombre del mecánico más reciente
  let sql = `
    SELECT v.*,
           u.nombre_completo AS cliente,
           (
             SELECT m.nombre_completo
             FROM reparaciones r
             JOIN usuarios m ON r.mecanico_id = m.id
             WHERE r.vehiculo_id = v.id
             ORDER BY r.fecha_fin DESC
             LIMIT 1
           ) AS mecanico
    FROM vehiculos v
    JOIN usuarios u ON u.id = v.usuario_id
  `;

  let countSql = `
    SELECT COUNT(*) AS total
    FROM vehiculos
  `;

  const params = [];
  const countParams = [];

  if (rol_id === 1) {
    sql += ' WHERE v.usuario_id = ?';
    countSql += ' WHERE usuario_id = ?';
    params.push(id);
    countParams.push(id);
  }

  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.query(countSql, countParams, (err, countRows) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        data: rows,
        currentPage: page,
        totalPages,
        totalItems: total
      });
    });
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