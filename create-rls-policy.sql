-- Script para crear la política RLS necesaria
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar el estado actual
SELECT 
  'Estado actual de RLS' as info,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE table_name = 'pedidos' 
AND table_schema = 'public';

-- 2. Crear una política que permita todas las operaciones para todos los usuarios
-- (Esto es para desarrollo - en producción deberías ser más restrictivo)
CREATE POLICY "Allow all operations on pedidos" ON pedidos
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Verificar que la política se creó correctamente
SELECT 
  'Política creada' as status,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'pedidos';

-- 4. Probar que ahora puedes acceder a los datos
SELECT 
  'Prueba de acceso' as info,
  COUNT(*) as total_pedidos
FROM pedidos;

-- 5. Mostrar algunos registros
SELECT 
  'Registros de ejemplo' as info,
  id_pedido,
  distrito,
  valor_total
FROM pedidos 
LIMIT 3;
