require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrateFacturas() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'AutoCarService',
    });

    console.log('✅ Conectado a la base de datos');

    // SQL para crear la tabla facturas
    const sql = `
      CREATE TABLE IF NOT EXISTS facturas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_factura VARCHAR(50) UNIQUE NOT NULL,
        fecha DATE NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        status ENUM('Pagado', 'Pendiente') DEFAULT 'Pendiente',
        reparacion_id INT NOT NULL,
        usuario_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_reparacion_id (reparacion_id),
        INDEX idx_numero_factura (numero_factura)
      );
    `;

    await connection.query(sql);
    console.log('✅ Tabla facturas creada exitosamente');

    // Verificar que la tabla existe
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'facturas'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Verificación: La tabla facturas existe en la base de datos');
    } else {
      console.log('⚠️  Advertencia: No se pudo verificar la creación de la tabla');
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  La tabla facturas ya existe, no es necesario crearla');
    } else {
      console.error('Detalles del error:', error);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Conexión cerrada');
    }
  }
}

migrateFacturas();

