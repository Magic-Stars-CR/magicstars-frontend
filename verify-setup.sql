-- =============================================
-- SCRIPT DE VERIFICACIÓN
-- Ejecuta esto después del auth-setup-only.sql
-- para verificar que todo esté funcionando
-- =============================================

-- 1. Verificar que la tabla profiles existe
SELECT 'Tabla profiles creada correctamente' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'profiles' 
  AND table_schema = 'public'
);

-- 2. Verificar que RLS está habilitado en profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- 3. Verificar que las políticas existen
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Verificar que la función handle_new_user existe
SELECT 'Función handle_new_user creada' as status
WHERE EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'handle_new_user'
);

-- 5. Verificar que el trigger existe
SELECT 'Trigger on_auth_user_created creado' as status
WHERE EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
);

-- 6. Mostrar estructura de la tabla profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar que la tabla pedidos sigue intacta
SELECT 
  'Tabla pedidos intacta' as status,
  COUNT(*) as total_pedidos
FROM pedidos;

