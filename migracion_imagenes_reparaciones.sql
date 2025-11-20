-- Script de migración para agregar columnas de imágenes antes y después
-- Ejecutar este script si la base de datos ya existe

USE AutoCarService;

-- Verificar si existe la columna 'imagen' antigua y migrar datos si es necesario
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'AutoCarService' 
    AND TABLE_NAME = 'reparaciones' 
    AND COLUMN_NAME = 'imagen'
);

-- Si existe la columna 'imagen', migrar los datos a 'imagen_antes'
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE reparaciones ADD COLUMN imagen_antes VARCHAR(255) NULL AFTER precio; UPDATE reparaciones SET imagen_antes = imagen WHERE imagen IS NOT NULL;',
  'ALTER TABLE reparaciones ADD COLUMN imagen_antes VARCHAR(255) NULL AFTER precio;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna imagen_despues
ALTER TABLE reparaciones
  ADD COLUMN imagen_despues VARCHAR(255) NULL AFTER imagen_antes;

-- Opcional: Eliminar la columna 'imagen' antigua después de migrar (descomentar si deseas eliminarla)
-- ALTER TABLE reparaciones DROP COLUMN imagen;

