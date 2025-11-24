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
  status ENUM('Pendiente', 'En curso', 'Finalizado', 'Rechazado por el cliente', 'Aprobado por el cliente') DEFAULT 'Pendiente',
  precio DECIMAL(10,2),
  imagen_antes VARCHAR(255) NULL,
  imagen_despues VARCHAR(255) NULL,
  comentarios_internos TEXT NULL,
  vehiculo_id INT,
  mecanico_id INT,
  fecha_aprobacion DATETIME NULL,
  fecha_proximo_mantenimiento DATE NULL,
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

-- Crear usuario administrador por defecto
-- Email: admin@autocare.com
-- Contraseña: admin123
-- NOTA: Cambiar la contraseña después del primer inicio de sesión
INSERT INTO usuarios (
  nombre_completo, 
  email, 
  contrasena, 
  telefono, 
  celular, 
  rol_id
) VALUES (
  'Administrador',
  'admin@autocare.com',
  '$2b$10$aZq0w.IxRAjIEhy3mW2pM.lE2YIfM85pqDhfwBcB/JzrDnuchArcC', -- admin123
  '0000000000',
  '0000000000',
  3 -- rol_id = 3 es administrador
) ON DUPLICATE KEY UPDATE 
  nombre_completo = 'Administrador',
  contrasena = '$2b$10$ScccphMYfVGkJ3KfRIMWu./zUXUUS7PlBr2zoCmlMLvBWCR16yZYu';

ALTER TABLE usuarios
MODIFY COLUMN rol_id INT NOT NULL DEFAULT 1;

ALTER TABLE reparaciones
  MODIFY precio DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Nota: Las columnas imagen_antes, imagen_despues, comentarios_internos y fecha_proximo_mantenimiento
-- ya están incluidas en el CREATE TABLE reparaciones, por lo que no necesitan ALTER TABLE

-- Tabla de facturas
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
  
  CREATE TABLE categoria_repuesto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE repuestos (
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

CREATE TABLE reparacion_repuesto (
  reparacion_id INT NOT NULL,
  repuesto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,

  PRIMARY KEY (reparacion_id, repuesto_id),

  CONSTRAINT fk_rep_rep_reparacion
    FOREIGN KEY (reparacion_id)
    REFERENCES reparaciones(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_rep_rep_repuesto
    FOREIGN KEY (repuesto_id)
    REFERENCES repuestos(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

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


INSERT INTO repuestos (nombre, precio_unitario, categoria_id, descripcion, activo) VALUES
-- Filtros (categoria_id = 1)
('Filtro de aceite Toyota', 12.50, 1, 'Filtro de aceite estándar para motores Toyota 1.8-2.5L', 1),
('Filtro de aire universal', 15.00, 1, 'Filtro de aire para múltiples modelos de motor', 1),
('Filtro de combustible Bosch', 22.00, 1, 'Filtro de gasolina de alta eficiencia', 1),

-- Frenos (categoria_id = 2)
('Pastillas de freno delanteras', 35.00, 2, 'Juego de pastillas delanteras cerámicas', 1),
('Disco de freno ventilado', 55.00, 2, 'Disco ventilado de 280mm', 1),
('Líquido de frenos DOT 4', 8.00, 2, 'Bote de 500ml de líquido DOT 4', 1),

-- Suspensión (categoria_id = 3)
('Amortiguador delantero KYB', 75.00, 3, 'Amortiguador hidráulico reforzado', 1),
('Buje de horquilla', 12.00, 3, 'Buje de goma para brazo de suspensión', 1),

-- Motor (categoria_id = 4)
('Bujía NGK Iridium', 10.00, 4, 'Bujía de iridio de alto rendimiento', 1),
('Correa de distribución', 45.00, 4, 'Correa de goma reforzada', 1),
('Sensor MAP', 38.00, 4, 'Sensor de presión absoluta del múltiple', 1),

-- Eléctrico (categoria_id = 5)
('Batería 12V 65Ah', 90.00, 5, 'Batería libre de mantenimiento', 1),
('Alternador reconstruido', 120.00, 5, 'Alternador para motor 1.6-2.0L', 1),
('Bombillo H4 12V', 6.00, 5, 'Bombillo halógeno estándar', 1),

-- Transmisión (categoria_id = 6)
('Kit de clutch', 140.00, 6, 'Disco, prensa y balero de empuje', 1),
('Aceite para transmisión ATF', 11.00, 6, 'Aceite ATF Dexron III por litro', 1),

-- Aceites y Lubricantes (categoria_id = 7)
('Aceite 10W-30 sintético', 9.00, 7, 'Litro de aceite sintético', 1),
('Grasa multiusos', 5.00, 7, 'Tubo de 250g de grasa amarilla', 1),

-- Refrigeración (categoria_id = 8)
('Bomba de agua', 48.00, 8, 'Bomba metálica reforzada', 1),
('Refrigerante largo uso', 7.50, 8, 'Galón de refrigerante verde', 1),

-- Escape (categoria_id = 9)
('Silenciador universal', 60.00, 9, 'Silenciador de acero inoxidable', 1),

-- Dirección (categoria_id = 10)
('Rotula de dirección', 18.00, 10, 'Rótula para sistema de dirección mecánica', 1),
('Brazo axial', 28.00, 10, 'Barra axial reforzada', 1);





-- Nota: Las columnas imagen_antes, imagen_despues, comentarios_internos y fecha_proximo_mantenimiento
-- ya están incluidas en el CREATE TABLE reparaciones (líneas 34-47), por lo que no necesitan ALTER TABLE




  -- historia 3 y 4 de aprobacion y rechazo y historial 
  -- 3
  ALTER TABLE reparaciones
MODIFY status ENUM(
  'Pendiente',
  'En curso',
  'Finalizado',
  'Rechazado por el cliente',
  'Aprobada por el cliente'
) NOT NULL;

--4
CREATE TABLE IF NOT EXISTS aprobacion_cotizacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reparacion_id INT NOT NULL,
  cliente_id INT NOT NULL,
  estado ENUM('aprobada', 'rechazada') NOT NULL,
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- opcionalmente podrías guardar más cosas (precio, comentario, etc.)
  
  CONSTRAINT fk_aprobacion_reparacion
    FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id),
  CONSTRAINT fk_aprobacion_cliente
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
);








