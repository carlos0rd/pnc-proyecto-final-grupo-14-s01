const pool = require('../models/db');           
const p    = pool.promise();   

exports.recalcularPrecio = (reparacionId) => {
  const sql = `
    UPDATE reparaciones r
    SET r.precio = (
      SELECT IFNULL(SUM(s.precio), 0)
      FROM servicios s
      WHERE s.reparacion_id = ?
    )
    WHERE r.id = ?`;

  return p.query(sql, [reparacionId, reparacionId]);
};
