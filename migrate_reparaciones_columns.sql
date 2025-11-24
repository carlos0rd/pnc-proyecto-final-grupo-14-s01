-- Script de migración para agregar columnas faltantes a la tabla reparaciones
-- Este script es seguro de ejecutar múltiples veces (usa IF NOT EXISTS)

USE autocarservice;

-- Agregar columna comentarios_internos si no existe
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'autocarservice' 
    AND TABLE_NAME = 'reparaciones' 
    AND COLUMN_NAME = 'comentarios_internos'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE reparaciones ADD COLUMN comentarios_internos TEXT NULL AFTER imagen_despues',
  'SELECT "Columna comentarios_internos ya existe" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna fecha_proximo_mantenimiento si no existe
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'autocarservice' 
    AND TABLE_NAME = 'reparaciones' 
    AND COLUMN_NAME = 'fecha_proximo_mantenimiento'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE reparaciones ADD COLUMN fecha_proximo_mantenimiento DATE NULL AFTER fecha_aprobacion',
  'SELECT "Columna fecha_proximo_mantenimiento ya existe" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migración completada' AS status;

