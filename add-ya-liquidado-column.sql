-- =============================================
-- SCRIPT PARA AGREGAR COLUMNA ya_liquidado
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- 1. Verificar la estructura actual de la tabla liquidaciones
SELECT 
  'Estructura actual de liquidaciones' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'liquidaciones' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Agregar la columna ya_liquidado si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'liquidaciones' 
        AND column_name = 'ya_liquidado'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE liquidaciones ADD COLUMN ya_liquidado BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna ya_liquidado agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna ya_liquidado ya existe';
    END IF;
END $$;

-- 3. Agregar otras columnas que podrían faltar
DO $$
BEGIN
    -- Agregar plata_inicial si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liquidaciones' AND column_name = 'plata_inicial' AND table_schema = 'public'
    ) THEN
        ALTER TABLE liquidaciones ADD COLUMN plata_inicial DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Columna plata_inicial agregada';
    END IF;
    
    -- Agregar total_recaudado si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liquidaciones' AND column_name = 'total_recaudado' AND table_schema = 'public'
    ) THEN
        ALTER TABLE liquidaciones ADD COLUMN total_recaudado DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Columna total_recaudado agregada';
    END IF;
    
    -- Agregar pagos_sinp si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liquidaciones' AND column_name = 'pagos_sinp' AND table_schema = 'public'
    ) THEN
        ALTER TABLE liquidaciones ADD COLUMN pagos_sinp DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Columna pagos_sinp agregada';
    END IF;
    
    -- Agregar updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liquidaciones' AND column_name = 'updated_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE liquidaciones ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at agregada';
    END IF;
END $$;

-- 4. Verificar la nueva estructura
SELECT 
  'Nueva estructura de liquidaciones' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'liquidaciones' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Actualizar algunos registros existentes para marcar como liquidados (ejemplo)
-- Descomenta y modifica según tus datos reales
/*
UPDATE liquidaciones 
SET ya_liquidado = TRUE 
WHERE fecha = '2025-10-08' 
AND mensajero IN ('JOHAN', 'PABLO', 'IRVING');

-- Verificar los cambios
SELECT * FROM liquidaciones WHERE fecha = '2025-10-08';
*/

-- 6. Mostrar algunos registros de ejemplo
SELECT 
  'Registros de ejemplo' as info,
  fecha,
  mensajero,
  ya_liquidado,
  created_at
FROM liquidaciones 
ORDER BY fecha DESC, mensajero 
LIMIT 10;


