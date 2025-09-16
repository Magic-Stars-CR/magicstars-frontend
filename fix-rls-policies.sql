-- Script para configurar RLS y políticas en la tabla pedidos_test
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar el estado actual de RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pedidos_test' 
AND schemaname = 'public';

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE pedidos_test ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Allow all operations on pedidos_test" ON pedidos_test;
DROP POLICY IF EXISTS "Enable read access for all users" ON pedidos_test;
DROP POLICY IF EXISTS "Enable insert for all users" ON pedidos_test;
DROP POLICY IF EXISTS "Enable update for all users" ON pedidos_test;
DROP POLICY IF EXISTS "Enable delete for all users" ON pedidos_test;

-- 4. Crear políticas que permitan todas las operaciones (para testing)
CREATE POLICY "Allow all operations on pedidos_test" ON pedidos_test
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'pedidos_test';

-- 6. Probar una consulta simple
SELECT COUNT(*) as total_pedidos FROM pedidos_test;

-- 7. Mostrar algunos registros
SELECT * FROM pedidos_test LIMIT 3;
