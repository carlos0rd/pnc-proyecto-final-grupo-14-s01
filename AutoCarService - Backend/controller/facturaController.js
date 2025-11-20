const db = require('../models/db');
const { generarPDFFactura } = require('../helpers/facturaHelper');

/**
 * GET /facturas
 * Get all invoices for the authenticated client
 */
exports.obtenerFacturas = (req, res) => {
  const { id: usuario_id, rol_id } = req.user;

  // Only clients (rol_id = 1) can see their own invoices
  // Admins and mechanics can see all invoices
  let sql = `
    SELECT 
      f.id,
      f.numero_factura,
      f.fecha,
      f.subtotal,
      f.total,
      f.status,
      f.reparacion_id,
      f.usuario_id,
      v.marca,
      v.modelo,
      v.placa,
      v.anio
    FROM facturas f
    JOIN reparaciones r ON f.reparacion_id = r.id
    JOIN vehiculos v ON r.vehiculo_id = v.id
    WHERE 1=1
  `;

  const params = [];

  // Filter by client if user is a client
  if (rol_id === 1) {
    sql += ' AND f.usuario_id = ?';
    params.push(usuario_id);
  }

  sql += ' ORDER BY f.fecha DESC, f.id DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching invoices:', err);
      console.error('SQL:', sql);
      console.error('Params:', params);
      return res.status(500).json({ error: 'Error al obtener facturas', details: err.message });
    }

    // Si no hay resultados, devolver array vacío en lugar de error
    if (!results || results.length === 0) {
      return res.json([]);
    }

    // Format the response
    const facturas = results.map(factura => ({
      id: factura.id,
      numero_factura: factura.numero_factura,
      fecha: factura.fecha,
      vehiculo: `${factura.marca} ${factura.modelo} - ${factura.placa}`,
      total: parseFloat(factura.total),
      status: factura.status,
      reparacion_id: factura.reparacion_id
    }));

    res.json(facturas);
  });
};

/**
 * GET /facturas/:id
 * Get invoice details by ID
 */
exports.obtenerFacturaPorId = (req, res) => {
  const { id } = req.params;
  const { id: usuario_id, rol_id } = req.user;

  const sql = `
    SELECT 
      f.*,
      u.nombre_completo,
      u.email,
      u.telefono,
      u.celular,
      v.marca,
      v.modelo,
      v.placa,
      v.anio,
      v.color,
      r.tipo_reparacion,
      r.descripcion AS reparacion_descripcion,
      r.fecha_inicio,
      r.fecha_fin
    FROM facturas f
    JOIN usuarios u ON f.usuario_id = u.id
    JOIN reparaciones r ON f.reparacion_id = r.id
    JOIN vehiculos v ON r.vehiculo_id = v.id
    WHERE f.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching invoice:', err);
      return res.status(500).json({ error: 'Error al obtener factura' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const factura = results[0];

    // Security check: clients can only see their own invoices
    if (rol_id === 1 && Number(factura.usuario_id) !== Number(usuario_id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta factura' });
    }

    // Get services for this repair
    const serviciosSql = `
      SELECT id, nombre_servicio, descripcion, precio
      FROM servicios
      WHERE reparacion_id = ?
      ORDER BY id
    `;

    db.query(serviciosSql, [factura.reparacion_id], (err, servicios) => {
      if (err) {
        console.error('Error fetching services:', err);
        return res.status(500).json({ error: 'Error al obtener servicios' });
      }

      res.json({
        id: factura.id,
        numero_factura: factura.numero_factura,
        fecha: factura.fecha,
        subtotal: parseFloat(factura.subtotal),
        total: parseFloat(factura.total),
        status: factura.status,
        cliente: {
          nombre_completo: factura.nombre_completo,
          email: factura.email,
          telefono: factura.telefono,
          celular: factura.celular
        },
        vehiculo: {
          marca: factura.marca,
          modelo: factura.modelo,
          placa: factura.placa,
          anio: factura.anio,
          color: factura.color
        },
        reparacion: {
          tipo_reparacion: factura.tipo_reparacion,
          descripcion: factura.reparacion_descripcion,
          fecha_inicio: factura.fecha_inicio,
          fecha_fin: factura.fecha_fin
        },
        servicios: servicios.map(s => ({
          id: s.id,
          nombre_servicio: s.nombre_servicio,
          descripcion: s.descripcion,
          precio: parseFloat(s.precio)
        }))
      });
    });
  });
};

/**
 * GET /facturas/:id/pdf
 * Generate and download invoice as PDF
 */
exports.generarPDFFactura = async (req, res) => {
  const { id } = req.params;
  const { id: usuario_id, rol_id } = req.user;

  // First, get the invoice data
  const sql = `
    SELECT 
      f.*,
      u.nombre_completo,
      u.email,
      u.telefono,
      u.celular,
      v.marca,
      v.modelo,
      v.placa,
      v.anio,
      v.color,
      r.tipo_reparacion,
      r.descripcion AS reparacion_descripcion,
      r.fecha_inicio,
      r.fecha_fin
    FROM facturas f
    JOIN usuarios u ON f.usuario_id = u.id
    JOIN reparaciones r ON f.reparacion_id = r.id
    JOIN vehiculos v ON r.vehiculo_id = v.id
    WHERE f.id = ?
  `;

  db.query(sql, [id], async (err, results) => {
    if (err) {
      console.error('Error fetching invoice for PDF:', err);
      return res.status(500).json({ error: 'Error al obtener factura' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const factura = results[0];

    // Security check: clients can only download their own invoices
    if (rol_id === 1 && Number(factura.usuario_id) !== Number(usuario_id)) {
      return res.status(403).json({ error: 'No tienes permiso para descargar esta factura' });
    }

    // Get services
    const serviciosSql = `
      SELECT nombre_servicio, descripcion, precio
      FROM servicios
      WHERE reparacion_id = ?
      ORDER BY id
    `;

    db.query(serviciosSql, [factura.reparacion_id], async (err, servicios) => {
      if (err) {
        console.error('Error fetching services for PDF:', err);
        return res.status(500).json({ error: 'Error al obtener servicios' });
      }

      try {
        // Prepare data for PDF generation
        const facturaData = {
          numero_factura: factura.numero_factura,
          fecha: factura.fecha,
          subtotal: parseFloat(factura.subtotal),
          total: parseFloat(factura.total),
          status: factura.status,
          cliente: {
            nombre_completo: factura.nombre_completo,
            email: factura.email,
            telefono: factura.telefono,
            celular: factura.celular
          },
          vehiculo: {
            marca: factura.marca,
            modelo: factura.modelo,
            placa: factura.placa,
            anio: factura.anio,
            color: factura.color
          },
          reparacion: {
            tipo_reparacion: factura.tipo_reparacion,
            descripcion: factura.reparacion_descripcion,
            fecha_inicio: factura.fecha_inicio,
            fecha_fin: factura.fecha_fin
          },
          servicios: servicios.map(s => ({
            nombre_servicio: s.nombre_servicio,
            descripcion: s.descripcion,
            precio: parseFloat(s.precio)
          }))
        };

        // Generate PDF
        const pdfBuffer = await generarPDFFactura(facturaData);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.numero_factura}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Error al generar PDF' });
      }
    });
  });
};

/**
 * POST /facturas
 * Create a new invoice from a repair (optional - for admin/mechanic)
 */
exports.crearFactura = (req, res) => {
  const { rol_id } = req.user;

  // Only mechanics and admins can create invoices
  if (rol_id === 1) {
    return res.status(403).json({ error: 'No tienes permiso para crear facturas' });
  }

  const { reparacion_id, status = 'Pendiente' } = req.body;

  if (!reparacion_id) {
    return res.status(400).json({ error: 'reparacion_id es requerido' });
  }

  // Get repair data to calculate totals
  const reparacionSql = `
    SELECT 
      r.id,
      r.precio,
      r.vehiculo_id,
      v.usuario_id
    FROM reparaciones r
    JOIN vehiculos v ON r.vehiculo_id = v.id
    WHERE r.id = ?
  `;

  db.query(reparacionSql, [reparacion_id], (err, reparaciones) => {
    if (err) {
      console.error('Error fetching repair:', err);
      return res.status(500).json({ error: 'Error al obtener reparación' });
    }

    if (reparaciones.length === 0) {
      return res.status(404).json({ error: 'Reparación no encontrada' });
    }

    const reparacion = reparaciones[0];
    const subtotal = parseFloat(reparacion.precio || 0);
    const total = subtotal; // Can add taxes here if needed

    // Generate invoice number
    const { generarNumeroFactura } = require('../helpers/facturaHelper');
    const numero_factura = generarNumeroFactura();

    // Check if invoice already exists for this repair
    const checkSql = 'SELECT id FROM facturas WHERE reparacion_id = ?';
    db.query(checkSql, [reparacion_id], (err, existing) => {
      if (err) {
        console.error('Error checking existing invoice:', err);
        return res.status(500).json({ error: 'Error al verificar factura existente' });
      }

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Ya existe una factura para esta reparación' });
      }

      // Create invoice
      const insertSql = `
        INSERT INTO facturas 
        (numero_factura, fecha, subtotal, total, status, reparacion_id, usuario_id)
        VALUES (?, CURDATE(), ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [numero_factura, subtotal, total, status, reparacion_id, reparacion.usuario_id],
        (err, result) => {
          if (err) {
            console.error('Error creating invoice:', err);
            return res.status(500).json({ error: 'Error al crear factura' });
          }

          res.status(201).json({
            message: 'Factura creada exitosamente',
            factura: {
              id: result.insertId,
              numero_factura,
              fecha: new Date().toISOString().split('T')[0],
              subtotal,
              total,
              status
            }
          });
        }
      );
    });
  });
};

