require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const reparacionRoutes = require('./routes/reparacionRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const errorHandler = require('./middlewares/errorHandler');
const usuarioRoutes = require('./routes/userRoutes');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173', // puerto de Vite
  credentials: true              
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/vehiculos', vehiculoRoutes);
app.use('/reparaciones', reparacionRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/usuarios', usuarioRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


