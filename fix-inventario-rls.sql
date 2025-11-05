-- Script para verificar y arreglar RLS de la tabla Inventario
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar el estado actual de RLS
SELECT 
  'Estado actual de Inventario' as info,
  table_name,
  row_security as rls_enabled
FROM information_schema.tables 
WHERE table_name = 'Inventario' 
AND table_schema = 'public';

-- 2. Ver las políticas actuales de RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'Inventario'
AND schemaname = 'public';

-- 3. Crear política de lectura para todos (anon y authenticated)
CREATE POLICY "Permitir lectura de Inventario a todos"
ON public.Inventario
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Verificar que se creó la política
SELECT 
  'Políticas después de crear' as info,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'Inventario'
AND schemaname = 'public';

-- 5. Probar que ahora puedes acceder a los datos
SELECT 
  'Prueba de acceso' as info,
  COUNT(*) as total_productos,
  COUNT(*) FILTER (WHERE tienda ILIKE '%ALL STARS%') as productos_allstars
FROM Inventario;

-- 6. Mostrar algunos registros de ALL STARS
SELECT 
  'Registros de ejemplo ALL STARS' as info,
  producto,
  cantidad,
  tienda
FROM Inventario
WHERE tienda ILIKE '%ALL STARS%'
LIMIT 10;

