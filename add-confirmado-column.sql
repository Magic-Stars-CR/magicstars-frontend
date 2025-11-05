-- =============================================
-- AGREGAR COLUMNA confirmado A LA TABLA pedidos_preconfirmacion
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- 1. Agregar la columna confirmado a la tabla pedidos_preconfirmacion
ALTER TABLE pedidos_preconfirmacion 
ADD COLUMN IF NOT EXISTS confirmado BOOLEAN DEFAULT FALSE;

-- 2. Verificar que la columna se agregó correctamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pedidos_preconfirmacion' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Actualizar algunos registros de prueba con valores de confirmado
-- (Esto es opcional, solo para testing)
UPDATE pedidos_preconfirmacion 
SET confirmado = TRUE 
WHERE id_pedido IN (SELECT id_pedido FROM pedidos_preconfirmacion LIMIT 10);

-- 4. Verificar los datos actualizados
SELECT id_pedido, confirmado FROM pedidos_preconfirmacion LIMIT 10;




