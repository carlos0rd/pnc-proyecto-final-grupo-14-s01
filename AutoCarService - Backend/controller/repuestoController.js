// controller/repuestoController.js
const db = require('../models/db');

// Devuelve todos los repuestos activos con su categoría
exports.obtenerRepuestos = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT r.id,
              r.nombre,
              r.precio_unitario,
              r.descripcion,
              r.activo,
              r.categoria_id,
              c.nombre AS categoria_nombre
       FROM repuestos r
       LEFT JOIN categoria_repuesto c ON r.categoria_id = c.id
       WHERE r.activo = 1
       ORDER BY c.nombre, r.nombre`
    );

    res.json(rows);
  } catch (err) {
    console.error('Error al obtener repuestos:', err);
    res.status(500).json({ error: err.message });
  }
};
