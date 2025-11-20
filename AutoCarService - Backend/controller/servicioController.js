const db = require('../models/db');
const { recalcularPrecio } = require('../helpers/reparaciones');
const pool = require('../models/db');
const poolPromise = pool.promise(); // Pool con promesas para transacciones  

// Crear servicio (solo mecánico o admin)
/*
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
*/

// Crear servicio (solo mecánico o admin)
exports.crearServicio = async (req, res) => {
  try {
    // Cliente (rol 1) NO puede crear servicios
    if (req.user.rol_id === 1) {
      return res
        .status(403)
        .json({ error: 'No tienes permiso para crear servicios.' });
    }

    const {
      nombre_servicio,
      descripcion,
      fecha_inicio,
      fecha_fin,
      precio,
      reparacion_id,
      repuestos, // <-- array de { repuesto_id, cantidad }
    } = req.body;

    if (!nombre_servicio || !descripcion || !reparacion_id) {
      return res.status(400).json({
        error: 'nombre_servicio, descripcion y reparacion_id son obligatorios',
      });
    }

    const conn = await poolPromise.getConnection();
    try {
      await conn.beginTransaction();

      // 1) Insertar el servicio
      const [result] = await conn.query(
        `INSERT INTO servicios
           (nombre_servicio, descripcion,
            fecha_inicio, fecha_fin, precio, reparacion_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nombre_servicio,
          descripcion,
          fecha_inicio || null,
          fecha_fin || null,
          precio || 0,
          reparacion_id,
        ]
      );

      const servicioId = result.insertId;

      // 2) Insertar repuestos en tabla puente (si vienen)
      if (Array.isArray(repuestos) && repuestos.length > 0) {
        const valores = [];

        repuestos.forEach((r) => {
          const repuestoId = Number(r.repuesto_id);
          const cantidad = Number(r.cantidad) || 1;
          if (repuestoId && cantidad > 0) {
            valores.push([servicioId, repuestoId, cantidad]);
          }
        });

        if (valores.length > 0) {
          await conn.query(
            `INSERT INTO servicio_repuesto
               (servicio_id, repuesto_id, cantidad)
             VALUES ?`,
            [valores]
          );
        }
      }

      await conn.commit();

      // 3) Recalcular el precio total de la reparación
      await recalcularPrecio(reparacion_id);

      return res.status(201).json({
        message: 'Servicio agregado correctamente',
        servicio_id: servicioId,
      });
    } catch (err) {
      await conn.rollback();
      console.error('Error creando servicio:', err);
      return res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error general en crearServicio:', err);
    return res.status(500).json({ error: err.message });
  }
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

    const [rows] = await poolPromise.query(
      'SELECT reparacion_id FROM servicios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    const reparacionId = rows[0].reparacion_id;

    await poolPromise.query(
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

    const [rows] = await poolPromise.query(
      'SELECT reparacion_id FROM servicios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    const reparacionId = rows[0].reparacion_id;

    await poolPromise.query('DELETE FROM servicios WHERE id = ?', [id]);

    await recalcularPrecio(reparacionId);

    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/servicios/:id/completo
// Devuelve datos del servicio con sus repuestos asociados
exports.obtenerServicioCompleto = async (req, res) => {
  const { id } = req.params;

  try {
    // 1) Datos del servicio
    const [servRows] = await poolPromise.query(
      `SELECT s.*,
              r.fecha_inicio AS reparacion_fecha_inicio,
              r.fecha_fin   AS reparacion_fecha_fin,
              r.status      AS reparacion_status
       FROM servicios s
       JOIN reparaciones r ON s.reparacion_id = r.id
       WHERE s.id = ?`,
      [id]
    );

    if (servRows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const servicio = servRows[0];

    // 2) Repuestos usados en ese servicio
    const [repRows] = await poolPromise.query(
      `SELECT sr.repuesto_id,
              sr.cantidad,
              rp.nombre,
              rp.precio_unitario,
              rp.descripcion,
              rp.categoria_id
       FROM servicio_repuesto sr
       JOIN repuestos rp ON sr.repuesto_id = rp.id
       WHERE sr.servicio_id = ?`,
      [id]
    );

    servicio.repuestos = repRows; // array de repuestos

    return res.json(servicio);
  } catch (err) {
    console.error('Error al obtener servicio completo:', err);
    return res.status(500).json({ error: err.message });
  }
};
