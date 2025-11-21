const pool = require('../models/db');           
const p    = pool.promise();   

exports.recalcularPrecio = async (reparacionId) => {
  // Calculate total from all services
  const sql = `
    UPDATE reparaciones r
    SET r.precio = (
      SELECT 
        CASE 
          WHEN COUNT(s.id) = 0 THEN NULL
          WHEN SUM(s.precio) IS NULL THEN NULL
          WHEN SUM(s.precio) = 0 THEN NULL
          ELSE SUM(s.precio)
        END
      FROM servicios s
      WHERE s.reparacion_id = ?
    )
    WHERE r.id = ?`;

  return p.query(sql, [reparacionId, reparacionId]);
};
