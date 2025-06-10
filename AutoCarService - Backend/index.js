require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const reparacionRoutes = require('./routes/reparacionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/vehiculos', vehiculoRoutes);
app.use('/reparaciones', reparacionRoutes);


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
