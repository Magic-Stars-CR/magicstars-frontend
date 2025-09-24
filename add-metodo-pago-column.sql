-- =============================================
-- AGREGAR COLUMNA metodo_pago A LA TABLA pedidos
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- 1. Agregar la columna metodo_pago a la tabla pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS metodo_pago TEXT;

-- 2. Agregar también otras columnas que podrían ser necesarias
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS estado_pedido TEXT;

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS fecha_entrega TIMESTAMP WITH TIME ZONE;

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS comprobante_sinpe TEXT;

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS numero_sinpe TEXT;

-- 3. Verificar que las columnas se agregaron correctamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Actualizar algunos registros de prueba con valores de metodo_pago
UPDATE pedidos 
SET metodo_pago = 'efectivo' 
WHERE id_pedido IN ('PED-001', 'PED-002', 'PED-003');

UPDATE pedidos 
SET metodo_pago = 'sinpe' 
WHERE id_pedido IN ('PED-004', 'PED-005');

-- 5. Verificar los datos actualizados
SELECT id_pedido, metodo_pago, estado_pedido FROM pedidos LIMIT 5;
