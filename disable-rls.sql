-- Script para desactivar RLS temporalmente
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar el estado actual de RLS
SELECT 
  'Estado actual' as info,
  table_name,
  row_security as rls_enabled
FROM information_schema.tables 
WHERE table_name = 'pedidos_test' 
AND table_schema = 'public';

-- 2. Desactivar RLS en la tabla pedidos_test
ALTER TABLE pedidos_test DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que RLS se desactivó
SELECT 
  'Estado después de desactivar' as info,
  table_name,
  row_security as rls_enabled
FROM information_schema.tables 
WHERE table_name = 'pedidos_test' 
AND table_schema = 'public';

-- 4. Probar que ahora puedes acceder a los datos
SELECT 
  'Prueba de acceso' as info,
  COUNT(*) as total_pedidos
FROM pedidos_test;

-- 5. Mostrar algunos registros
SELECT 
  'Registros de ejemplo' as info,
  id_pedido,
  distrito,
  valor_total
FROM pedidos_test 
LIMIT 5;
