// controller/repuestoController.js
const db = require('../models/db');

// Devuelve todos los repuestos activos con su categoría
exports.obtenerRepuestos = (req, res) => {
  const sql = `SELECT r.id,
              r.nombre,
              r.precio_unitario,
              r.descripcion,
              r.activo,
              r.categoria_id,
              c.nombre AS categoria_nombre
       FROM repuestos r
       LEFT JOIN categoria_repuesto c ON r.categoria_id = c.id
       WHERE r.activo = 1
       ORDER BY c.nombre, r.nombre`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener repuestos:', err);
      return res.status(500).json({ error: 'Error al obtener repuestos', details: err.message });
    }

    // Si no hay resultados, devolver array vacío
    res.json(results || []);
  });
};
