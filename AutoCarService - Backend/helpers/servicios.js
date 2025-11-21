const pool = require('../models/db');
const poolPromise = pool.promise();

/**
 * Calculates the total price of a service based on labor cost and spare parts
 * @param {number} costoManoObra - Labor cost
 * @param {Array} repuestos - Array of { repuesto_id, cantidad }
 * @returns {Promise<number>} Total service price
 */
async function calcularPrecioServicio(costoManoObra, repuestos) {
  try {
    // Start with labor cost
    let total = parseFloat(costoManoObra) || 0;

    // If no spare parts, return just labor cost
    if (!Array.isArray(repuestos) || repuestos.length === 0) {
      return total;
    }

    // Get spare part IDs
    const repuestoIds = repuestos
      .map(r => Number(r.repuesto_id))
      .filter(id => id && id > 0);

    if (repuestoIds.length === 0) {
      return total;
    }

    // Query spare parts prices
    const placeholders = repuestoIds.map(() => '?').join(',');
    const [rows] = await poolPromise.query(
      `SELECT id, precio_unitario FROM repuestos WHERE id IN (${placeholders})`,
      repuestoIds
    );

    // Create a map for quick lookup
    const preciosMap = {};
    rows.forEach(row => {
      preciosMap[row.id] = parseFloat(row.precio_unitario) || 0;
    });

    // Calculate total for spare parts
    repuestos.forEach(r => {
      const repuestoId = Number(r.repuesto_id);
      const cantidad = Number(r.cantidad) || 1;
      
      if (repuestoId && preciosMap[repuestoId]) {
        total += preciosMap[repuestoId] * cantidad;
      }
    });

    return Math.round(total * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating service price:', error);
    throw error;
  }
}

module.exports = {
  calcularPrecioServicio
};

