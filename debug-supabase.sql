-- Script para diagnosticar problemas con la tabla pedidos
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar que la tabla existe
SELECT 
  'Tabla pedidos existe' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_name = 'pedidos' 
AND table_schema = 'public';

-- 2. Ver la estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Contar total de registros
SELECT 
  'Total de registros' as info,
  COUNT(*) as total_pedidos
FROM pedidos;

-- 4. Ver algunos registros de ejemplo (primeros 5)
SELECT 
  'Registros de ejemplo' as info,
  *
FROM pedidos 
LIMIT 5;

-- 5. Verificar si hay políticas RLS que bloqueen el acceso
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'pedidos';

-- 6. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pedidos' 
AND schemaname = 'public';
