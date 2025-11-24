-- Script para crear usuario administrador por defecto
-- Este script puede ejecutarse manualmente después de crear la base de datos

USE autocarservice;

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
  contrasena = '$2b$10$aZq0w.IxRAjIEhy3mW2pM.lE2YIfM85pqDhfwBcB/JzrDnuchArcC';

SELECT 'Usuario administrador creado/actualizado exitosamente' AS mensaje;
SELECT 'Email: admin@autocare.com' AS credenciales;
SELECT 'Contraseña: admin123' AS credenciales;
SELECT 'IMPORTANTE: Cambiar la contraseña después del primer inicio de sesión' AS advertencia;

