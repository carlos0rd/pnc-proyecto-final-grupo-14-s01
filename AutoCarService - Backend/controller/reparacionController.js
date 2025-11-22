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
    comentarios_internos
  } = req.body;

  // Procesar la imagen "antes" (si la enviaron)
  // upload.fields() guarda los archivos en req.files como un objeto
  const imagenAntesRuta = req.files && req.files.imagen_antes && req.files.imagen_antes[0]
    ? `/imagenes/${req.files.imagen_antes[0].filename}`
    : null;

  // Price is now calculated from services, so set to 0 initially
  const sql = `INSERT INTO reparaciones 
  (tipo_reparacion, descripcion, fecha_inicio, fecha_fin, status, precio, imagen_antes, comentarios_internos, vehiculo_id, mecanico_id) 
  VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`;

  db.query(sql, [
    tipo_reparacion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    status,
    imagenAntesRuta,
    comentarios_internos || null,
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
    
    // Format results: precio will be NULL if no services, or the calculated sum
    // Ocultar comentarios_internos para clientes (rol_id === 1)
    const formatted = results.map(r => {
      const result = {
        ...r,
        precio: r.precio === null ? null : parseFloat(r.precio),
        tiene_servicios: r.tiene_servicios > 0
      };
      
      // Si es cliente, no incluir comentarios_internos
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
    return res.status(403).json({ error: 'No tienes permiso para editar reparaciones.' });
  }

  const { id } = req.params;
  const {
    tipo_reparacion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    status,
    comentarios_internos
    // precio is removed - it's calculated from services
  } = req.body;

  // Primero obtener las imágenes actuales
  db.query("SELECT imagen_antes, imagen_despues FROM reparaciones WHERE id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Reparación no encontrada" });

    const imagenAntesAntigua = rows[0].imagen_antes;
    const imagenDespuesAntigua = rows[0].imagen_despues;
    let nuevaRutaImgAntes = imagenAntesAntigua; // por defecto se conserva la misma
    let nuevaRutaImgDespues = imagenDespuesAntigua; // por defecto se conserva la misma

    // Función auxiliar para eliminar imagen antigua
    const eliminarImagen = (rutaImagen) => {
      if (rutaImagen) {
        const nombreViejo = path.basename(rutaImagen);
        const rutaFisica = path.join(__dirname, "..", "imagenes", nombreViejo);
        if (fs.existsSync(rutaFisica)) {
          fs.unlink(rutaFisica, (e) => e && console.log("No se pudo eliminar la imagen antigua:", e));
        }
      }
    };

    // Si se subió una nueva imagen "después"
    if (req.files && req.files.imagen_despues && req.files.imagen_despues[0]) {
      nuevaRutaImgDespues = `/imagenes/${req.files.imagen_despues[0].filename}`;
      // Eliminar la imagen antigua si existe
      eliminarImagen(imagenDespuesAntigua);
    }

    // Si se subió una nueva imagen "antes" (aunque normalmente solo se sube al crear)
    if (req.files && req.files.imagen_antes && req.files.imagen_antes[0]) {
      nuevaRutaImgAntes = `/imagenes/${req.files.imagen_antes[0].filename}`;
      // Eliminar la imagen antigua si existe
      eliminarImagen(imagenAntesAntigua);
    }

    // Price is calculated from services, so we don't update it manually
    const sql = `UPDATE reparaciones 
                 SET tipo_reparacion=?, descripcion=?, fecha_inicio=?, fecha_fin=?, status=?, imagen_antes=?, imagen_despues=?, comentarios_internos=? 
                 WHERE id=?`;

    db.query(sql, [
      tipo_reparacion,
      descripcion,
      fecha_inicio,
      fecha_fin,
      status,
      nuevaRutaImgAntes,
      nuevaRutaImgDespues,
      comentarios_internos || null,
      id
    ], (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: 'Reparación actualizada correctamente' });
    });
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
      return res.status(404).json({ error: "Reparación no encontrada" });

    const rep      = results[0];
    const ownerId  = Number(rep.owner_id);   // <- SIEMPRE número
    const current  = Number(req.user.id);    // <- SIEMPRE número

    // 🔒 Permiso sólo si es el dueño
    if (req.user.rol_id === 1 && ownerId !== current) {
      return res.status(403).json({ error: "No tienes acceso a esta reparación" });
    }

    // Format response: precio will be NULL if no services
    const formatted = {
      ...rep,
      precio: rep.precio === null ? null : parseFloat(rep.precio),
      tiene_servicios: rep.tiene_servicios > 0
    };

    // Ocultar comentarios_internos para clientes (rol_id === 1)
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

    if (req.user.rol_id === 1) {
      // Filtrar por cliente dueño del vehículo
      results = results.filter(r => r.usuario_id == req.user.id);
      
      // Ocultar comentarios_internos para clientes
      results = results.map(r => {
        const { comentarios_internos, ...rest } = r;
        return rest;
      });
    }

    res.json(results);
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
