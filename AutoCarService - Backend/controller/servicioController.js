const db = require('../models/db');
const { recalcularPrecio } = require('../helpers/reparaciones');
const pool = require('../models/db');  

// Crear servicio (solo mecánico o admin)
exports.crearServicio = (req, res) => {
  const { nombre_servicio, descripcion,
          fecha_inicio,   fecha_fin,
          precio,         reparacion_id } = req.body;

  const sql = `INSERT INTO servicios
               (nombre_servicio, descripcion,
                fecha_inicio, fecha_fin, precio, reparacion_id)
               VALUES (?, ?, ?, ?, ?, ?)`;

  pool.query(sql,
    [nombre_servicio, descripcion,
     fecha_inicio,    fecha_fin,
     precio,          reparacion_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      recalcularPrecio(reparacion_id)
        .then(() => {
          res.status(201).json({ message: 'Servicio agregado correctamente' });
        })
        .catch((e) => res.status(500).json({ error: e.message }));
    });
};

exports.obtenerPorReparacion = (req, res) => {
  const { reparacion_id } = req.params;

  const sql = `
    SELECT s.*, v.usuario_id AS owner_id
    FROM   servicios    s
    JOIN   reparaciones r ON s.reparacion_id = r.id
    JOIN   vehiculos    v ON r.vehiculo_id  = v.id
    WHERE  s.reparacion_id = ?
  `;

  db.query(sql, [reparacion_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (req.user.rol_id === 1 && results.length) {
      const owner = Number(results[0].owner_id);
      const me    = Number(req.user.id);
      if (owner !== me)
        return res.status(403).json({ error: "No tienes acceso a estos servicios" });
    }

    res.json(results);
  });
};

// Editar servicio
exports.editarServicio = async (req, res) => {
  try {
    if (req.user.rol_id === 1) {
      return res.status(403).json({ error: 'No tienes permiso para editar servicios.' });
    }

    const { id } = req.params;
    const { nombre_servicio, descripcion, fecha_inicio, fecha_fin, precio } = req.body;

    const [rows] = await db.promise().query(
      'SELECT reparacion_id FROM servicios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    const reparacionId = rows[0].reparacion_id;

    await db.promise().query(
      `UPDATE servicios
       SET nombre_servicio = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, precio = ?
       WHERE id = ?`,
      [nombre_servicio, descripcion, fecha_inicio, fecha_fin, precio, id]
    );

    await recalcularPrecio(reparacionId);

    res.json({ message: 'Servicio actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar servicio
exports.eliminarServicio = async (req, res) => {
  try {
    if (req.user.rol_id === 1) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar servicios.' });
    }

    const { id } = req.params;

    const [rows] = await db.promise().query(
      'SELECT reparacion_id FROM servicios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    const reparacionId = rows[0].reparacion_id;

    await db.promise().query('DELETE FROM servicios WHERE id = ?', [id]);

    await recalcularPrecio(reparacionId);

    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};