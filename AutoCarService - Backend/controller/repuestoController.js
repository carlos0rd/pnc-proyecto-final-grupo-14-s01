// controller/repuestoController.js
const db = require('../models/db');

// Devuelve todos los repuestos activos con su categoría (o todos si es admin)
exports.obtenerRepuestos = (req, res) => {
  const { rol_id } = req.user;
  const { categoria_id, activo } = req.query;

  let sql = `SELECT r.id,
              r.nombre,
              r.precio_unitario,
              r.descripcion,
              r.activo,
              r.categoria_id,
              c.nombre AS categoria_nombre
       FROM repuestos r
       LEFT JOIN categoria_repuesto c ON r.categoria_id = c.id
       WHERE 1=1`;

  const params = [];

  // Si no es admin, solo mostrar activos
  if (rol_id !== 3) {
    sql += ' AND r.activo = 1';
  } else if (activo !== undefined) {
    // Si es admin y especifica activo, filtrar
    sql += ' AND r.activo = ?';
    params.push(activo === 'true' ? 1 : 0);
  }

  // Filtrar por categoría si se especifica
  if (categoria_id) {
    sql += ' AND r.categoria_id = ?';
    params.push(categoria_id);
  }

  sql += ' ORDER BY c.nombre, r.nombre';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error al obtener repuestos:', err);
      return res.status(500).json({ error: 'Error al obtener repuestos', details: err.message });
    }

    res.json(results || []);
  });
};

// Obtener un repuesto por ID
exports.obtenerRepuestoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol_id } = req.user;

    let sql = `SELECT r.id,
                r.nombre,
                r.precio_unitario,
                r.descripcion,
                r.activo,
                r.categoria_id,
                c.nombre AS categoria_nombre
         FROM repuestos r
         LEFT JOIN categoria_repuesto c ON r.categoria_id = c.id
         WHERE r.id = ?`;

    const params = [id];

    // Si no es admin, solo mostrar si está activo
    if (rol_id !== 3) {
      sql += ' AND r.activo = 1';
    }

    const [rows] = await db.promise().query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener repuesto:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Crear repuesto (solo mecánico o admin)
exports.crearRepuesto = async (req, res) => {
  try {
    if (req.user.rol_id === 1) {
      return res.status(403).json({ error: 'No tienes permiso para crear repuestos.' });
    }

    const { nombre, precio_unitario, categoria_id, descripcion, activo } = req.body;

    if (!nombre || !precio_unitario || !categoria_id) {
      return res.status(400).json({
        error: 'nombre, precio_unitario y categoria_id son obligatorios',
      });
    }

    const precio = parseFloat(precio_unitario);
    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({
        error: 'precio_unitario debe ser un número mayor o igual a 0',
      });
    }

    // Verificar que la categoría existe
    const [categoriaRows] = await db.promise().query(
      'SELECT id FROM categoria_repuesto WHERE id = ?',
      [categoria_id]
    );

    if (categoriaRows.length === 0) {
      return res.status(400).json({ error: 'La categoría especificada no existe' });
    }

    const sql = `INSERT INTO repuestos (nombre, precio_unitario, categoria_id, descripcion, activo)
                 VALUES (?, ?, ?, ?, ?)`;

    const [result] = await db.promise().query(sql, [
      nombre,
      precio,
      categoria_id,
      descripcion || null,
      activo !== undefined ? (activo ? 1 : 0) : 1,
    ]);

    res.status(201).json({
      message: 'Repuesto creado correctamente',
      id: result.insertId,
    });
  } catch (err) {
    console.error('Error al crear repuesto:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Editar repuesto (solo mecánico o admin)
exports.editarRepuesto = async (req, res) => {
  try {
    if (req.user.rol_id === 1) {
      return res.status(403).json({ error: 'No tienes permiso para editar repuestos.' });
    }

    const { id } = req.params;
    const { nombre, precio_unitario, categoria_id, descripcion, activo } = req.body;

    // Verificar que el repuesto existe
    const [rows] = await db.promise().query('SELECT id FROM repuestos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }

    // Construir la consulta dinámicamente según los campos proporcionados
    const updates = [];
    const params = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre);
    }

    if (precio_unitario !== undefined) {
      const precio = parseFloat(precio_unitario);
      if (isNaN(precio) || precio < 0) {
        return res.status(400).json({
          error: 'precio_unitario debe ser un número mayor o igual a 0',
        });
      }
      updates.push('precio_unitario = ?');
      params.push(precio);
    }

    if (categoria_id !== undefined) {
      // Verificar que la categoría existe
      const [categoriaRows] = await db.promise().query(
        'SELECT id FROM categoria_repuesto WHERE id = ?',
        [categoria_id]
      );
      if (categoriaRows.length === 0) {
        return res.status(400).json({ error: 'La categoría especificada no existe' });
      }
      updates.push('categoria_id = ?');
      params.push(categoria_id);
    }

    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(descripcion);
    }

    if (activo !== undefined) {
      updates.push('activo = ?');
      params.push(activo ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    params.push(id);

    const sql = `UPDATE repuestos SET ${updates.join(', ')} WHERE id = ?`;

    await db.promise().query(sql, params);

    res.json({ message: 'Repuesto actualizado correctamente' });
  } catch (err) {
    console.error('Error al editar repuesto:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Eliminar repuesto (soft delete, solo admin)
exports.eliminarRepuesto = async (req, res) => {
  try {
    if (req.user.rol_id !== 3) {
      return res.status(403).json({ error: 'Solo los administradores pueden eliminar repuestos.' });
    }

    const { id } = req.params;

    // Verificar que el repuesto existe
    const [rows] = await db.promise().query('SELECT id FROM repuestos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }

    // Soft delete: marcar como inactivo
    await db.promise().query('UPDATE repuestos SET activo = 0 WHERE id = ?', [id]);

    res.json({ message: 'Repuesto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar repuesto:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ========== GESTIÓN DE CATEGORÍAS ==========

// Obtener todas las categorías
exports.obtenerCategorias = (req, res) => {
  const sql = `SELECT c.id, c.nombre, COUNT(r.id) AS cantidad_repuestos
               FROM categoria_repuesto c
               LEFT JOIN repuestos r ON c.id = r.categoria_id AND r.activo = 1
               GROUP BY c.id, c.nombre
               ORDER BY c.nombre`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener categorías:', err);
      return res.status(500).json({ error: 'Error al obtener categorías', details: err.message });
    }

    res.json(results || []);
  });
};

// Obtener repuestos por categoría
exports.obtenerRepuestosPorCategoria = async (req, res) => {
  try {
    const { categoria_id } = req.params;
    const { rol_id } = req.user;

    // Verificar que la categoría existe
    const [categoriaRows] = await db.promise().query(
      'SELECT id, nombre FROM categoria_repuesto WHERE id = ?',
      [categoria_id]
    );

    if (categoriaRows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    let sql = `SELECT r.id,
                r.nombre,
                r.precio_unitario,
                r.descripcion,
                r.activo,
                r.categoria_id,
                c.nombre AS categoria_nombre
         FROM repuestos r
         LEFT JOIN categoria_repuesto c ON r.categoria_id = c.id
         WHERE r.categoria_id = ?`;

    const params = [categoria_id];

    // Si no es admin, solo mostrar activos
    if (rol_id !== 3) {
      sql += ' AND r.activo = 1';
    }

    sql += ' ORDER BY r.nombre';

    const [rows] = await db.promise().query(sql, params);

    res.json({
      categoria: categoriaRows[0],
      repuestos: rows,
    });
  } catch (err) {
    console.error('Error al obtener repuestos por categoría:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Crear categoría (solo admin)
exports.crearCategoria = async (req, res) => {
  try {
    if (req.user.rol_id !== 3) {
      return res.status(403).json({ error: 'Solo los administradores pueden crear categorías.' });
    }

    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    }

    const sql = 'INSERT INTO categoria_repuesto (nombre) VALUES (?)';

    const [result] = await db.promise().query(sql, [nombre.trim()]);

    res.status(201).json({
      message: 'Categoría creada correctamente',
      id: result.insertId,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    console.error('Error al crear categoría:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Editar categoría (solo admin)
exports.editarCategoria = async (req, res) => {
  try {
    if (req.user.rol_id !== 3) {
      return res.status(403).json({ error: 'Solo los administradores pueden editar categorías.' });
    }

    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    }

    // Verificar que la categoría existe
    const [rows] = await db.promise().query('SELECT id FROM categoria_repuesto WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const sql = 'UPDATE categoria_repuesto SET nombre = ? WHERE id = ?';

    await db.promise().query(sql, [nombre.trim(), id]);

    res.json({ message: 'Categoría actualizada correctamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    console.error('Error al editar categoría:', err);
    return res.status(500).json({ error: err.message });
  }
};
