-- Migration: Add costo_mano_obra to servicios table and allow NULL in reparaciones.precio
-- This enables automatic price calculation based on labor cost + spare parts

USE AutoCarService;

-- Add costo_mano_obra column to servicios table
ALTER TABLE servicios
ADD COLUMN costo_mano_obra DECIMAL(10,2) DEFAULT 0 AFTER descripcion;

-- Allow NULL in reparaciones.precio to indicate "no value yet"
ALTER TABLE reparaciones
MODIFY COLUMN precio DECIMAL(10,2) NULL DEFAULT NULL;

-- Update existing services: if precio exists but costo_mano_obra is 0, 
-- assume the entire precio was labor cost (for backward compatibility)
-- Note: Using id > 0 to satisfy MySQL safe update mode requirement
UPDATE servicios
SET costo_mano_obra = COALESCE(precio, 0)
WHERE id > 0 AND costo_mano_obra = 0 AND precio IS NOT NULL;

