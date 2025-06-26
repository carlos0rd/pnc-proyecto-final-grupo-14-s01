CREATE DATABASE AutoCarService;
USE AutoCarService;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL 
);

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  celular VARCHAR(20),
  rol_id INT NOT NULL,
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Tabla de vehículos
CREATE TABLE vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  anio INT,
  color VARCHAR(50),
  placa VARCHAR(20) UNIQUE,
  imagen VARCHAR(255),
  usuario_id INT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de reparaciones
CREATE TABLE reparaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_reparacion VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  status ENUM('Pendiente', 'En curso', 'Finalizado', 'Rechazado por el cliente') DEFAULT 'Pendiente',
  precio DECIMAL(10,2),
  vehiculo_id INT,
  mecanico_id INT,
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  FOREIGN KEY (mecanico_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de servicios por reparación
CREATE TABLE servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_servicio VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  precio DECIMAL(10,2),
  reparacion_id INT,
  FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE CASCADE
);
	
INSERT INTO roles (nombre) VALUES ('cliente'), ('mecanico'), ('admin');

ALTER TABLE usuarios
MODIFY COLUMN rol_id INT NOT NULL DEFAULT 1;

ALTER TABLE reparaciones
  MODIFY precio DECIMAL(10,2) NOT NULL DEFAULT 0;



