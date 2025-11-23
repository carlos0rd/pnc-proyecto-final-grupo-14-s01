const db = require('../models/db');
const { recalcularPrecio } = require('../helpers/reparaciones');
const { calcularPrecioServicio } = require('../helpers/servicios');
const pool = require('../models/db');
const poolPromise = pool.promise();  

//111
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
    // Cliente no puede crear servicios
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
      costo_mano_obra,   
      reparacion_id,
      repuestos,       // array de { repuesto_id, cantidad }
    } = req.body;

    if (!nombre_servicio || !descripcion || !reparacion_id) {
      return res.status(400).json({
        error: 'nombre_servicio, descripcion y reparacion_id son obligatorios',
      });
    }

    const conn = await db.promise().getConnection();

    try {
      await conn.beginTransaction();

      const manoObra = parseFloat(costo_mano_obra) || 0;

      // Insertar el servicio con precio temporal = mano de obra
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
          manoObra,          
          reparacion_id,
        ]
      );

      const servicioId = result.insertId;

      // Insertar repuestos en tabla puente intermedia
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
          // Insertar múltiples filas usando múltiples VALUES
          const placeholders = valores.map(() => '(?, ?, ?)').join(',');
          const flatValues = valores.flat();
          await conn.query(
            `INSERT INTO servicio_repuesto
               (servicio_id, repuesto_id, cantidad)
             VALUES ${placeholders}`,
            flatValues
          );
        }
      }

      // Calcular costo de repuestos para este servicio
      const [repCostRows] = await conn.query(
        `SELECT IFNULL(SUM(sr.cantidad * r.precio_unitario), 0) AS total_repuestos
         FROM servicio_repuesto sr
         JOIN repuestos r ON r.id = sr.repuesto_id
         WHERE sr.servicio_id = ?`,
        [servicioId]
      );

      const totalRepuestos = Number(repCostRows[0].total_repuestos) || 0;
      const totalServicio  = manoObra + totalRepuestos;

      // Actualizar precio final del servicio = mano de obra + repuestos
      await conn.query(
        'UPDATE servicios SET precio = ? WHERE id = ?',
        [totalServicio, servicioId]
      );

      await conn.commit();

      // Recalcular total de la reparación
      await recalcularPrecio(reparacion_id);

      return res.status(201).json({
        message: 'Servicio agregado correctamente',
        servicio_id: servicioId,
        precio_total: totalServicio,
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

    /*if (req.user.rol_id === 1 && results.length) {
      const owner = Number(results[0].owner_id);
      const me    = Number(req.user.id);
      if (owner !== me)
        return res.status(403).json({ error: "No tienes acceso a estos servicios" });
    }*/

    res.json(results);
  });
};

// Editar servicio
/*
exports.editarServicio = async (req, res) => {
  try {
    if (req.user.rol_id === 1) {
      return res.status(403).json({ error: 'No tienes permiso para editar servicios.' });
    }

    const { id } = req.params;
    const { 
      nombre_servicio, 
      descripcion, 
      fecha_inicio, 
      fecha_fin, 
      costo_mano_obra,
      repuestos 
    } = req.body;

    // Get repair ID and existing service data
    const [rows] = await poolPromise.query(
      'SELECT reparacion_id FROM servicios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    const reparacionId = rows[0].reparacion_id;

    // Validate labor cost
    const costoManoObra = parseFloat(costo_mano_obra) || 0;
    if (costoManoObra < 0) {
      return res.status(400).json({
        error: 'costo_mano_obra debe ser un número mayor o igual a 0',
      });
    }

    const conn = await poolPromise.getConnection();
    try {
      await conn.beginTransaction();

      // Calculate new total price
      const precioTotal = await calcularPrecioServicio(costoManoObra, repuestos || []);

      // Update service
      await conn.query(
        `UPDATE servicios
         SET nombre_servicio = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, 
             costo_mano_obra = ?, precio = ?
         WHERE id = ?`,
        [nombre_servicio, descripcion, fecha_inicio, fecha_fin, costoManoObra, precioTotal, id]
      );

      // Delete existing spare parts associations
      await conn.query('DELETE FROM servicio_repuesto WHERE servicio_id = ?', [id]);

      // Insert new spare parts associations
      if (Array.isArray(repuestos) && repuestos.length > 0) {
        const valores = [];
        repuestos.forEach((r) => {
          const repuestoId = Number(r.repuesto_id);
          const cantidad = Number(r.cantidad) || 1;
          if (repuestoId && cantidad > 0) {
            valores.push([id, repuestoId, cantidad]);
          }
        });

        if (valores.length > 0) {
          await conn.query(
            `INSERT INTO servicio_repuesto (servicio_id, repuesto_id, cantidad) VALUES ?`,
            [valores]
          );
        }
      }

      await conn.commit();
      await recalcularPrecio(reparacionId);

      res.json({ message: 'Servicio actualizado correctamente' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
*/


// Editar servicio (actualiza repuestos y recalcula precio final)
exports.editarServicio = async (req, res) => {
  try {
    if (req.user.rol_id === 1) {
      return res
        .status(403)
        .json({ error: 'No tienes permiso para editar servicios.' });
    }

    const { id } = req.params;
    const {
      nombre_servicio,
      descripcion,
      fecha_inicio,
      fecha_fin,
      costo_mano_obra,  
      repuestos,  // array de { repuesto_id, cantidad }
    } = req.body;

    if (!nombre_servicio || !descripcion) {
      return res.status(400).json({
        error: 'nombre_servicio y descripcion son obligatorios',
      });
    }

    const conn = await db.promise().getConnection();

    try {
      await conn.beginTransaction();

      // Obtener reparacion_id del servicio
      const [rows] = await conn.query(
        'SELECT reparacion_id FROM servicios WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }
      const reparacionId = rows[0].reparacion_id;

      const manoObra = parseFloat(costo_mano_obra) || 0;

      // Actualizar datos básicos del servicio
      await conn.query(
        `UPDATE servicios
         SET nombre_servicio = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, precio = ?
         WHERE id = ?`,
        [
          nombre_servicio,
          descripcion,
          fecha_inicio || null,
          fecha_fin || null,
          manoObra,
          id,
        ]
      );

      //Borrar repuestos actuales del servicio
      await conn.query(
        'DELETE FROM servicio_repuesto WHERE servicio_id = ?',
        [id]
      );

      //Insertar nuevos repuestos
      if (Array.isArray(repuestos) && repuestos.length > 0) {
        const valores = [];

        repuestos.forEach((r) => {
          const repuestoId = Number(r.repuesto_id);
          const cantidad = Number(r.cantidad) || 1;

          if (repuestoId && cantidad > 0) {
            valores.push([id, repuestoId, cantidad]);
          }
        });

        if (valores.length > 0) {
          await conn.query(
            `INSERT INTO servicio_repuesto (servicio_id, repuesto_id, cantidad)
             VALUES ?`,
            [valores]
          );
        }
      }

      //Calcular nuevo costo de repuestos
      const [repCostRows] = await conn.query(
        `SELECT IFNULL(SUM(sr.cantidad * r.precio_unitario), 0) AS total_repuestos
         FROM servicio_repuesto sr
         JOIN repuestos r ON r.id = sr.repuesto_id
         WHERE sr.servicio_id = ?`,
        [id]
      );

      const totalRepuestos = Number(repCostRows[0].total_repuestos) || 0;
      const totalServicio  = manoObra + totalRepuestos;

      //Actualizar precio final del servicio
      await conn.query(
        'UPDATE servicios SET precio = ? WHERE id = ?',
        [totalServicio, id]
      );

      await conn.commit();

      //Recalcular total de la reparación
      await recalcularPrecio(reparacionId);

      return res.json({
        message: 'Servicio actualizado correctamente',
        precio_total: totalServicio,
      });
    } catch (err) {
      await conn.rollback();
      console.error('Error al actualizar servicio:', err);
      return res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error general en editarServicio:', err);
    return res.status(500).json({ error: err.message });
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

// Devuelve datos del servicio con sus repuestos asociados
exports.obtenerServicioCompleto = async (req, res) => {
  const { id } = req.params;

  try {
    //Datos del servicio
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

    //Repuestos asociados al servicio
    const [repRows] = await db.promise().query(
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

    servicio.repuestos = repRows;

    //Calcular total de repuestos
    let totalRepuestos = 0;
    for (const r of repRows) {
      const precio = Number(r.precio_unitario) || 0;
      const cant   = Number(r.cantidad) || 0;
      totalRepuestos += precio * cant;
    }

    //Separar mano de obra del total
    const precioTotal = Number(servicio.precio) || 0;
    let manoObra = precioTotal - totalRepuestos;
    if (manoObra < 0) manoObra = 0;

    servicio.total_repuestos = totalRepuestos;
    servicio.mano_obra       = manoObra;

    return res.json(servicio);
  } catch (err) {
    console.error('Error al obtener servicio completo:', err);
    return res.status(500).json({ error: err.message });
  }
};

