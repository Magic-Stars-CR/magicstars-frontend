-- Script para configurar RLS y políticas en la tabla pedidos
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar el estado actual de RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pedidos' 
AND schemaname = 'public';

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Allow all operations on pedidos" ON pedidos;
DROP POLICY IF EXISTS "Enable read access for all users" ON pedidos;
DROP POLICY IF EXISTS "Enable insert for all users" ON pedidos;
DROP POLICY IF EXISTS "Enable update for all users" ON pedidos;
DROP POLICY IF EXISTS "Enable delete for all users" ON pedidos;

-- 4. Crear políticas que permitan todas las operaciones (para testing)
CREATE POLICY "Allow all operations on pedidos" ON pedidos
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
WHERE tablename = 'pedidos';

-- 6. Probar una consulta simple
SELECT COUNT(*) as total_pedidos FROM pedidos;

-- 7. Mostrar algunos registros
SELECT * FROM pedidos LIMIT 3;
