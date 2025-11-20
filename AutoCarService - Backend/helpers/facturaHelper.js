const PDFDocument = require('pdfkit');
const db = require('../models/db');

/**
 * Generates a unique invoice number in format FAC-YYYY-XXXX
 */
function generarNumeroFactura() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FAC-${year}-${random}`;
}

/**
 * Generates PDF for an invoice
 * @param {Object} facturaData - Invoice data with client, vehicle, repair, and services
 * @returns {Promise<Buffer>} PDF buffer
 */
function generarPDFFactura(facturaData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24)
         .fillColor('#2D3573')
         .text('AutoCare Service', 50, 50, { align: 'left' });
      
      doc.fontSize(12)
         .fillColor('#666666')
         .text('Sistema de Gestión de Taller Mecánico', 50, 80);

      // Invoice Title
      doc.fontSize(20)
         .fillColor('#000000')
         .text('FACTURA', 50, 120, { align: 'left' });

      // Invoice Number and Date
      doc.fontSize(10)
         .fillColor('#333333')
         .text(`Número de Factura: ${facturaData.numero_factura}`, 400, 120, { align: 'right' })
         .text(`Fecha: ${new Date(facturaData.fecha).toLocaleDateString('es-ES')}`, 400, 140, { align: 'right' })
         .text(`Estado: ${facturaData.status}`, 400, 160, { align: 'right' });

      // Client Information Section
      doc.fontSize(14)
         .fillColor('#2D3573')
         .text('Información del Cliente', 50, 220);
      
      doc.fontSize(10)
         .fillColor('#000000')
         .text(`Nombre: ${facturaData.cliente.nombre_completo}`, 50, 250)
         .text(`Email: ${facturaData.cliente.email}`, 50, 270);
      
      if (facturaData.cliente.telefono) {
        doc.text(`Teléfono: ${facturaData.cliente.telefono}`, 50, 290);
      }
      if (facturaData.cliente.celular) {
        doc.text(`Celular: ${facturaData.cliente.celular}`, 50, 310);
      }

      // Vehicle Information Section
      doc.fontSize(14)
         .fillColor('#2D3573')
         .text('Información del Vehículo', 300, 220);
      
      doc.fontSize(10)
         .fillColor('#000000')
         .text(`Marca: ${facturaData.vehiculo.marca}`, 300, 250)
         .text(`Modelo: ${facturaData.vehiculo.modelo}`, 300, 270)
         .text(`Año: ${facturaData.vehiculo.anio || 'N/A'}`, 300, 290)
         .text(`Placa: ${facturaData.vehiculo.placa}`, 300, 310);
      
      if (facturaData.vehiculo.color) {
        doc.text(`Color: ${facturaData.vehiculo.color}`, 300, 330);
      }

      // Repair Information
      doc.fontSize(14)
         .fillColor('#2D3573')
         .text('Información de la Reparación', 50, 380);
      
      doc.fontSize(10)
         .fillColor('#000000')
         .text(`Tipo: ${facturaData.reparacion.tipo_reparacion}`, 50, 410)
         .text(`Descripción: ${facturaData.reparacion.descripcion || 'N/A'}`, 50, 430)
         .text(`Fecha Inicio: ${new Date(facturaData.reparacion.fecha_inicio).toLocaleDateString('es-ES')}`, 50, 450);
      
      if (facturaData.reparacion.fecha_fin) {
        doc.text(`Fecha Fin: ${new Date(facturaData.reparacion.fecha_fin).toLocaleDateString('es-ES')}`, 50, 470);
      }

      // Services Table
      let yPos = 520;
      doc.fontSize(14)
         .fillColor('#2D3573')
         .text('Servicios Realizados', 50, yPos);
      
      yPos += 30;

      // Table Header
      doc.fontSize(10)
         .fillColor('#FFFFFF')
         .rect(50, yPos, 500, 25)
         .fill('#2D3573');
      
      doc.text('Servicio', 60, yPos + 8)
         .text('Descripción', 200, yPos + 8)
         .text('Precio', 450, yPos + 8, { align: 'right' });

      yPos += 25;

      // Services Rows
      if (facturaData.servicios && facturaData.servicios.length > 0) {
        facturaData.servicios.forEach((servicio, index) => {
          const rowColor = index % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
          doc.rect(50, yPos, 500, 30)
             .fill(rowColor);
          
          doc.fillColor('#000000')
             .text(servicio.nombre_servicio || 'N/A', 60, yPos + 10, { width: 130 })
             .text(servicio.descripcion || 'N/A', 200, yPos + 10, { width: 240 })
             .text(`$${parseFloat(servicio.precio || 0).toFixed(2)}`, 450, yPos + 10, { align: 'right', width: 100 });
          
          yPos += 30;
        });
      } else {
        doc.fillColor('#666666')
           .text('No hay servicios registrados', 60, yPos + 10);
        yPos += 30;
      }

      // Totals Section
      yPos += 20;
      doc.rect(350, yPos, 200, 100)
         .stroke();

      doc.fontSize(12)
         .fillColor('#000000')
         .text('Resumen', 360, yPos + 10, { align: 'left' });

      doc.fontSize(10)
         .text('Subtotal:', 360, yPos + 35)
         .text(`$${parseFloat(facturaData.subtotal || 0).toFixed(2)}`, 500, yPos + 35, { align: 'right' });

      doc.fontSize(12)
         .fillColor('#2D3573')
         .text('Total:', 360, yPos + 60)
         .text(`$${parseFloat(facturaData.total || 0).toFixed(2)}`, 500, yPos + 60, { align: 'right', width: 40 });

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(8)
         .fillColor('#666666')
         .text('Gracias por confiar en AutoCare Service', 50, pageHeight - 50, { align: 'center' })
         .text('Este documento es generado automáticamente', 50, pageHeight - 35, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generarNumeroFactura,
  generarPDFFactura
};

