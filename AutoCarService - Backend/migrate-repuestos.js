require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrateRepuestos() {
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

    // Crear tabla categoria_repuesto si no existe
    const sqlCategoria = `
      CREATE TABLE IF NOT EXISTS categoria_repuesto (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE
      );
    `;

    await connection.query(sqlCategoria);
    console.log('✅ Tabla categoria_repuesto creada/verificada');

    // Crear tabla repuestos si no existe
    const sqlRepuestos = `
      CREATE TABLE IF NOT EXISTS repuestos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        categoria_id INT NOT NULL,
        descripcion TEXT,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        CONSTRAINT fk_repuestos_categoria
          FOREIGN KEY (categoria_id)
          REFERENCES categoria_repuesto(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `;

    await connection.query(sqlRepuestos);
    console.log('✅ Tabla repuestos creada/verificada');

    // Verificar si hay categorías, si no, insertar las básicas
    const [categorias] = await connection.query('SELECT COUNT(*) as count FROM categoria_repuesto');
    if (categorias[0].count === 0) {
      const insertCategorias = `
        INSERT INTO categoria_repuesto (nombre) VALUES
        ('Filtros'),
        ('Frenos'),
        ('Suspensión'),
        ('Motor'),
        ('Eléctrico'),
        ('Transmisión'),
        ('Aceites y lubricantes'),
        ('Refrigeración'),
        ('Escape'),
        ('Dirección');
      `;
      await connection.query(insertCategorias);
      console.log('✅ Categorías de repuestos insertadas');
    } else {
      console.log('ℹ️  Las categorías ya existen');
    }

    // Verificar si hay repuestos, si no, insertar algunos de ejemplo
    const [repuestos] = await connection.query('SELECT COUNT(*) as count FROM repuestos');
    if (repuestos[0].count === 0) {
      const insertRepuestos = `
        INSERT INTO repuestos (nombre, precio_unitario, categoria_id, descripcion, activo) VALUES
        ('Filtro de aceite Toyota', 12.50, 1, 'Filtro de aceite estándar para motores Toyota 1.8-2.5L', 1),
        ('Filtro de aire universal', 15.00, 1, 'Filtro de aire para múltiples modelos de motor', 1),
        ('Pastillas de freno delanteras', 35.00, 2, 'Juego de pastillas delanteras cerámicas', 1),
        ('Disco de freno ventilado', 55.00, 2, 'Disco ventilado de 280mm', 1),
        ('Amortiguador delantero KYB', 75.00, 3, 'Amortiguador hidráulico reforzado', 1),
        ('Bujía NGK Iridium', 10.00, 4, 'Bujía de iridio de alto rendimiento', 1);
      `;
      await connection.query(insertRepuestos);
      console.log('✅ Repuestos de ejemplo insertados');
    } else {
      console.log('ℹ️  Los repuestos ya existen');
    }

    // Verificar que las tablas existen
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'repuestos'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Verificación: La tabla repuestos existe en la base de datos');
    } else {
      console.log('⚠️  Advertencia: No se pudo verificar la creación de la tabla');
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Las tablas ya existen, no es necesario crearlas');
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

migrateRepuestos();

