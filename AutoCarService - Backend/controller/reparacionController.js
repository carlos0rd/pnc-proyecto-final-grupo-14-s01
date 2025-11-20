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
    precio,
    vehiculo_id
  } = req.body;

  // Procesar la imagen "antes" (si la enviaron)
  // upload.fields() guarda los archivos en req.files como un objeto
  const imagenAntesRuta = req.files && req.files.imagen_antes && req.files.imagen_antes[0]
    ? `/imagenes/${req.files.imagen_antes[0].filename}`
    : null;

  const sql = `INSERT INTO reparaciones 
  (tipo_reparacion, descripcion, fecha_inicio, fecha_fin, status, precio, imagen_antes, vehiculo_id, mecanico_id) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [
    tipo_reparacion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    status,
    precio,
    imagenAntesRuta,
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
    SELECT r.*, v.modelo, v.placa, u.nombre_completo AS cliente 
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
    res.json(results);
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
    precio
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

    const sql = `UPDATE reparaciones 
                 SET tipo_reparacion=?, descripcion=?, fecha_inicio=?, fecha_fin=?, status=?, precio=?, imagen_antes=?, imagen_despues=? 
                 WHERE id=?`;

    db.query(sql, [
      tipo_reparacion,
      descripcion,
      fecha_inicio,
      fecha_fin,
      status,
      precio,
      nuevaRutaImgAntes,
      nuevaRutaImgDespues,
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
           u.nombre_completo      AS cliente
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

    res.json(rep);
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
