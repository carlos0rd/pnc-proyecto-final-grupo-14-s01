const jwt = require("jsonwebtoken");
const db  = require("../models/db");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Token no proporcionado" });

  const token = authHeader.split(" ")[1];

  try {
    // 1. Verifica firma y extrae el id del payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Consulta la BD para traer los datos completos
    const sql =
      "SELECT id, email, rol_id, nombre_completo, telefono, celular \
       FROM usuarios WHERE id = ?";
    db.query(sql, [decoded.id], (err, results) => {
      if (err)   return res.status(500).json({ error: err.message });
      if (!results.length)
        return res.status(401).json({ error: "Usuario no encontrado" });

      // 3. Guarda todo en req.user para el resto de la request
      req.user = results[0];
      next();
    });
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
};

module.exports = verifyToken;
