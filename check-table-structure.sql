-- Script para verificar la estructura de la tabla pedidos existente
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Ver la estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver algunos registros de ejemplo
SELECT * FROM pedidos LIMIT 5;

-- 3. Contar total de registros
SELECT COUNT(*) as total_pedidos FROM pedidos;
