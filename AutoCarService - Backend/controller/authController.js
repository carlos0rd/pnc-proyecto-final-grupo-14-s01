const db = require('../models/db');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/hash');


exports.register = async (req, res) => {
  const { nombre_completo, email, contrasena, telefono, celular, rol_id } = req.body;

  try {
    const hashedPassword = await hashPassword(contrasena);

    const sql = `INSERT INTO usuarios (nombre_completo, email, contrasena, telefono, celular, rol_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sql, [nombre_completo, email, hashedPassword, telefono, celular, 1], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

//Funcion login
exports.login = (req, res) => {
  const { email, contrasena } = req.body;

  const sql = `SELECT * FROM usuarios WHERE email = ?`;

  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });

    if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = results[0];
    const match = await comparePassword(contrasena, user.contrasena);

    if (!match) return res.status(401).json({ error: 'Credenciales incorrectas' });

    //Configuracion del token JWT
    const token = jwt.sign(
      { id: user.id, rol_id: user.rol_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  });
};
