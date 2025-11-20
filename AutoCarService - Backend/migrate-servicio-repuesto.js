require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateServicioRepuesto() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'AutoCarService',
    });

    console.log('✅ Conectado a la base de datos');

    // Crear tabla servicio_repuesto si no existe
    const sql = `
      CREATE TABLE IF NOT EXISTS servicio_repuesto (
        servicio_id INT NOT NULL,
        repuesto_id INT NOT NULL,
        cantidad INT NOT NULL DEFAULT 1,
        PRIMARY KEY (servicio_id, repuesto_id),
        CONSTRAINT fk_servicio_repuesto_servicio
          FOREIGN KEY (servicio_id)
          REFERENCES servicios(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_servicio_repuesto_repuesto
          FOREIGN KEY (repuesto_id)
          REFERENCES repuestos(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `;

    await connection.query(sql);
    console.log('✅ Tabla servicio_repuesto creada/verificada');

    // Verificar que la tabla existe
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'servicio_repuesto'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Verificación: La tabla servicio_repuesto existe');
    } else {
      console.log('⚠️  Advertencia: No se pudo verificar la creación de la tabla');
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  La tabla ya existe, no es necesario crearla');
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

migrateServicioRepuesto();

