const db = require('../models/db');
const fs   = require("fs");
const path = require('path');

// POST /vehiculos
exports.crearVehiculo = (req, res) => {
  /* 1. Campos de texto (vienen en req.body)  */
  const {
    modelo,
    marca,
    anio,
    color,
    placa,
    clienteEmail      // ← el e-mail del cliente que ya existe
  } = req.body;       // ⛔ NO desestructuramos “imagen”: Multer lo entrega en req.file

  if (!modelo || !marca || !anio || !color || !placa || !clienteEmail) {
    return res.status(400).json({ error: "Campos obligatorios incompletos" });
  }

  /* 2. Buscar el id del cliente a partir de su e-mail */
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

      /* 3. Procesar la imagen (si la enviaron)                             
             upload.single("imagen") guarda el archivo y coloca los
             datos en req.file  */
      const imagenRuta = req.file ? `/imagenes/${req.file.filename}` : null;

      /* 4. Insertar el vehículo */
      db.query(
        `INSERT INTO vehiculos
         (modelo, marca, anio, color, placa, imagen, usuario_id)
         VALUES (?,?,?,?,?,?,?)`,
        [modelo, marca, anio, color, placa, imagenRuta, usuario_id],
        (err) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .json({ error: "Error al registrar vehículo" });
          }

          res
            .status(201)
            .json({ message: "Vehículo registrado correctamente" });
        }
      );
    }
  );
};

// Obtener vehículos con paginación
exports.obtenerVehiculos = (req, res) => {
  const { rol_id, id } = req.user;
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  // Consulta principal para obtener nombre del mecánico más reciente
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



// PUT /vehiculos/:id  (single("imagen"))
exports.editarVehiculo = (req, res) => {
  if (req.user.rol_id === 1) {   
    return res.status(403).json({ error: "No tienes permiso para editar vehículos." });
  }

  const { id } = req.params;
  const { modelo, marca, anio, color, placa } = req.body;

  db.query("SELECT imagen FROM vehiculos WHERE id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Vehículo no encontrado" });

    const imagenAntigua = rows[0].imagen;  
    let   nuevaRutaImg  = imagenAntigua;     // por defecto se conserva la misma

    if (req.file) {
      nuevaRutaImg = `/imagenes/${req.file.filename}`;

      if (imagenAntigua) {
        const nombreViejo = path.basename(imagenAntigua);         // 1750….png
        const rutaFisica  = path.join(__dirname, "..", "uploads", "vehiculos", nombreViejo);

        if (fs.existsSync(rutaFisica)) {
          fs.unlink(rutaFisica, (e) => e && console.log("No se pudo actualizar la imagen:", e));
        }
      }
    }

    const sql = `UPDATE vehiculos 
                 SET modelo = ?, marca = ?, anio = ?, color = ?, placa = ?, imagen = ?
                 WHERE id = ?`;

    db.query(sql, [modelo, marca, anio, color, placa, nuevaRutaImg, id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: "Vehículo actualizado correctamente" });
    });
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

