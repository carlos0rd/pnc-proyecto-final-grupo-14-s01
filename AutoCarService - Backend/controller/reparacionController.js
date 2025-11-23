const db = require('../models/db');
const fs = require('fs');
const path = require('path');

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
    vehiculo_id,
    comentarios_internos,
    fecha_proximo_mantenimiento,
  } = req.body;

  const imagenAntesRuta =
    req.files &&
    req.files.imagen_antes &&
    req.files.imagen_antes[0]
      ? `/imagenes/${req.files.imagen_antes[0].filename}`
      : null;

  const sql = `INSERT INTO reparaciones 
    (tipo_reparacion, descripcion, fecha_inicio, fecha_fin, status, precio, imagen_antes, comentarios_internos, vehiculo_id, mecanico_id, fecha_proximo_mantenimiento) 
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [
      tipo_reparacion,
      descripcion,
      fecha_inicio,
      fecha_fin,
      status,
      imagenAntesRuta,
      comentarios_internos || null,
      vehiculo_id,
      req.user.id,
      fecha_proximo_mantenimiento || null,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res
        .status(201)
        .json({ message: 'Reparación registrada correctamente' });
    }
  );
};

exports.obtenerReparaciones = (req, res) => {
  const { rol_id, id } = req.user;

  let sql = `
    SELECT r.*, v.modelo, v.placa, u.nombre_completo AS cliente,
           (SELECT COUNT(*) FROM servicios s WHERE s.reparacion_id = r.id) AS tiene_servicios
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

    const formatted = results.map((r) => {
      const result = {
        ...r,
        precio: r.precio === null ? null : parseFloat(r.precio),
        tiene_servicios: r.tiene_servicios > 0,
      };

      if (rol_id === 1) {
        delete result.comentarios_internos;
      }

      return result;
    });

    res.json(formatted);
  });
};

exports.editarReparacion = (req, res) => {
  if (req.user.rol_id === 1) {
    return res
      .status(403)
      .json({ error: 'No tienes permiso para editar reparaciones.' });
  }

  const { id } = req.params;
  const {
    tipo_reparacion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    status,
    comentarios_internos,
    fecha_proximo_mantenimiento,
  } = req.body;

  db.query(
    'SELECT imagen_antes, imagen_despues FROM reparaciones WHERE id = ?',
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0)
        return res
          .status(404)
          .json({ error: 'Reparación no encontrada' });

      const imagenAntesAntigua = rows[0].imagen_antes;
      const imagenDespuesAntigua = rows[0].imagen_despues;
      let nuevaRutaImgAntes = imagenAntesAntigua;
      let nuevaRutaImgDespues = imagenDespuesAntigua;

      const eliminarImagen = (rutaImagen) => {
        if (rutaImagen) {
          const nombreViejo = path.basename(rutaImagen);
          const rutaFisica = path.join(
            __dirname,
            '..',
            'imagenes',
            nombreViejo
          );
          if (fs.existsSync(rutaFisica)) {
            fs.unlink(rutaFisica, (e) => {
              if (e)
                console.log(
                  'No se pudo eliminar la imagen antigua:',
                  e
                );
            });
          }
        }
      };

      if (
        req.files &&
        req.files.imagen_despues &&
        req.files.imagen_despues[0]
      ) {
        nuevaRutaImgDespues = `/imagenes/${req.files.imagen_despues[0].filename}`;
        eliminarImagen(imagenDespuesAntigua);
      }

      if (
        req.files &&
        req.files.imagen_antes &&
        req.files.imagen_antes[0]
      ) {
        nuevaRutaImgAntes = `/imagenes/${req.files.imagen_antes[0].filename}`;
        eliminarImagen(imagenAntesAntigua);
      }

      const sql = `UPDATE reparaciones 
                   SET tipo_reparacion=?, descripcion=?, fecha_inicio=?, fecha_fin=?, status=?, imagen_antes=?, imagen_despues=?, comentarios_internos=?, fecha_proximo_mantenimiento=? 
                   WHERE id=?`;

      db.query(
        sql,
        [
          tipo_reparacion,
          descripcion,
          fecha_inicio,
          fecha_fin,
          status,
          nuevaRutaImgAntes,
          nuevaRutaImgDespues,
          comentarios_internos || null,
          fecha_proximo_mantenimiento || null,
          id,
        ],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ message: 'Reparación actualizada correctamente' });
        }
      );
    }
  );
};

exports.eliminarReparacion = (req, res) => {
  if (req.user.rol_id === 1) {
    return res
      .status(403)
      .json({ error: 'No tienes permiso para eliminar reparaciones.' });
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
    SELECT r.*, v.modelo, v.placa,
           v.usuario_id           AS owner_id,
           u.nombre_completo      AS cliente,
           (SELECT COUNT(*) FROM servicios s WHERE s.reparacion_id = r.id) AS tiene_servicios
    FROM   reparaciones r
    JOIN   vehiculos    v ON r.vehiculo_id = v.id
    JOIN   usuarios     u ON v.usuario_id = u.id
    WHERE  r.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length)
      return res
        .status(404)
        .json({ error: 'Reparación no encontrada' });

    const rep = results[0];
    const ownerId = Number(rep.owner_id);
    const current = Number(req.user.id);

    if (req.user.rol_id === 1 && ownerId !== current) {
      return res
        .status(403)
        .json({ error: 'No tienes acceso a esta reparación' });
    }

    const formatted = {
      ...rep,
      precio: rep.precio === null ? null : parseFloat(rep.precio),
      tiene_servicios: rep.tiene_servicios > 0,
    };

    if (req.user.rol_id === 1) {
      delete formatted.comentarios_internos;
    }

    res.json(formatted);
  });
};

// Obtener reparaciones por vehículo ya sea por id o por placa
exports.obtenerPorVehiculo = (req, res) => {
  const identificador = req.params.identificador;

  const sql = `
    SELECT r.*, v.modelo, v.placa, v.usuario_id, u.nombre_completo AS cliente
    FROM reparaciones r
    JOIN vehiculos v ON r.vehiculo_id = v.id
    JOIN usuarios u ON v.usuario_id = u.id
    WHERE v.id = ? OR v.placa = ?
  `;

  db.query(sql, [identificador, identificador], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    let filtered = results;

    if (req.user.rol_id === 1) {
      filtered = filtered.filter(
        (r) => r.usuario_id == req.user.id
      );

      filtered = filtered.map((r) => {
        const { comentarios_internos, ...rest } = r;
        return rest;
      });
    }

    res.json(filtered);
  });
};

// HU3 + HU4: aprobar/rechazar cotización del cliente y registrar historial
exports.decisionCotizacion = (req, res) => {
  const { id } = req.params;
  const { decision } = req.body; // "aprobada" | "rechazada"

  if (!['aprobada', 'rechazada'].includes(decision)) {
    return res.status(400).json({
      error: "La decisión debe ser 'aprobada' o 'rechazada'.",
    });
  }

  // Estos textos deben coincidir con el ENUM de la tabla reparaciones.status
  const nuevoStatus =
    decision === 'aprobada'
      ? 'Aprobada por el cliente'
      : 'Rechazado por el cliente';

  const sqlUpdate = `
    UPDATE reparaciones 
    SET status = ?
    WHERE id = ?
  `;

  db.query(sqlUpdate, [nuevoStatus, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar reparación:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reparación no encontrada.' });
    }

    // 🔹 HU4: registrar historial de aprobación/rechazo
    const historialSql = `
      INSERT INTO aprobacion_cotizacion
        (reparacion_id, cliente_id, estado, fecha_hora)
      VALUES (?, ?, ?, NOW())
    `;

    const clienteId = req.user.id; // viene del token (rol cliente)

    db.query(historialSql, [id, clienteId, decision], (errHist) => {
      if (errHist) {
        console.error('Error al guardar historial de aprobación:', errHist);
        return res.status(500).json({ error: errHist.message });
      }

      // Devolver la reparación actualizada al frontend (como ya hacíamos)
      db.query(
        `
        SELECT id,
               descripcion,
               fecha_inicio,
               fecha_fin,
               status,
               precio,
               imagen_antes,
               imagen_despues
        FROM reparaciones
        WHERE id = ?
        `,
        [id],
        (err2, rows) => {
          if (err2) {
            console.error(
              'Error al obtener reparación actualizada:',
              err2
            );
            return res.status(500).json({ error: err2.message });
          }
          res.json(rows[0]);
        }
      );
    });
  });
};



exports.recalcularValorReparacion = (reparacionId) => {
  const sql = `
    UPDATE reparaciones r
    SET r.precio = (
      SELECT IFNULL(SUM(s.precio), 0)
      FROM servicios s
      WHERE s.reparacion_id = ?
    )
    WHERE r.id = ?`;
  return db.query(sql, [reparacionId, reparacionId]);
};

// Obtener reparaciones con mantenimiento próximo (para notificaciones del cliente)
exports.obtenerMantenimientosProximos = (req, res) => {
  const { rol_id, id } = req.user;

  // Solo clientes pueden ver sus propios mantenimientos próximos
  if (rol_id !== 1) {
    return res.status(403).json({ error: 'Solo los clientes pueden ver sus mantenimientos próximos' });
  }

  // Obtener reparaciones con fecha de mantenimiento hoy o mañana
  // Y que no estén cerradas o anuladas
  const hoy = new Date().toISOString().split('T')[0];
  const mañana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const sql = `
    SELECT r.id, r.tipo_reparacion, r.fecha_proximo_mantenimiento,
           v.marca, v.modelo, v.placa, v.id AS vehiculo_id
    FROM reparaciones r
    JOIN vehiculos v ON r.vehiculo_id = v.id
    WHERE v.usuario_id = ?
      AND r.fecha_proximo_mantenimiento IS NOT NULL
      AND r.fecha_proximo_mantenimiento BETWEEN ? AND ?
      AND r.status NOT IN ('Finalizado', 'Rechazado por el cliente', 'Aprobada por el cliente')
    ORDER BY r.fecha_proximo_mantenimiento ASC
  `;

  db.query(sql, [id, hoy, mañana], (err, results) => {
    if (err) {
      console.error('[Mantenimientos Próximos] Error en query:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};
