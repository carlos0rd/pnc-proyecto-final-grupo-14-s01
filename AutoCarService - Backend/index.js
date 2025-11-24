require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const reparacionRoutes = require('./routes/reparacionRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const repuestosRoutes = require('./routes/repuestosRoutes');
const errorHandler = require('./middlewares/errorHandler');
const usuarioRoutes = require('./routes/userRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const cors = require('cors');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS - permite desarrollo local y contenedores Docker
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost', 'http://frontend'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman o aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos los orígenes en desarrollo
    }
  },
  credentials: true              
}));

app.use(express.json());

app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));
app.use('/auth', authRoutes);
app.use('/vehiculos', vehiculoRoutes);
app.use('/reparaciones', reparacionRoutes); 
app.use('/api/servicios', servicioRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/repuestos', repuestosRoutes);
app.use('/facturas', facturaRoutes);

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});


