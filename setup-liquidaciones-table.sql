-- =============================================
-- SCRIPT PARA CONFIGURAR TABLA LIQUIDACIONES
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- 1. Verificar si la tabla liquidaciones existe
SELECT 
  'Verificando existencia de tabla liquidaciones' as info,
  EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'liquidaciones' 
    AND table_schema = 'public'
  ) as tabla_existe;

-- 2. Si no existe, crear la tabla liquidaciones
CREATE TABLE IF NOT EXISTS liquidaciones (
  id SERIAL PRIMARY KEY,
  mensajero TEXT NOT NULL,
  fecha DATE NOT NULL,
  plata_inicial DECIMAL(10,2) DEFAULT 0.00,
  total_recaudado DECIMAL(10,2) DEFAULT 0.00,
  pagos_sinp DECIMAL(10,2) DEFAULT 0.00,
  ya_liquidado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice único para evitar duplicados
  UNIQUE(mensajero, fecha)
);

-- 3. Verificar el estado actual de RLS en la tabla liquidaciones
SELECT 
  'Estado actual de RLS en liquidaciones' as info,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE table_name = 'liquidaciones' 
AND table_schema = 'public';

-- 4. Habilitar RLS en la tabla liquidaciones
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Allow all operations on liquidaciones" ON liquidaciones;
DROP POLICY IF EXISTS "Enable read access for all users" ON liquidaciones;
DROP POLICY IF EXISTS "Enable insert for all users" ON liquidaciones;
DROP POLICY IF EXISTS "Enable update for all users" ON liquidaciones;
DROP POLICY IF EXISTS "Enable delete for all users" ON liquidaciones;

-- 6. Crear política que permita todas las operaciones (para desarrollo)
CREATE POLICY "Allow all operations on liquidaciones" ON liquidaciones
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Verificar que las políticas se crearon correctamente
SELECT 
  'Políticas creadas en liquidaciones' as info,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'liquidaciones';

-- 8. Crear función para actualizar updated_at automáticamente (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Crear trigger para actualizar updated_at en liquidaciones
DROP TRIGGER IF EXISTS update_liquidaciones_updated_at ON liquidaciones;
CREATE TRIGGER update_liquidaciones_updated_at
    BEFORE UPDATE ON liquidaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Probar una consulta simple para verificar que todo funciona
SELECT 
  'Prueba de acceso a liquidaciones' as info,
  COUNT(*) as total_liquidaciones
FROM liquidaciones;

-- 11. Mostrar la estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'liquidaciones' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12. Insertar algunos datos de prueba (opcional)
-- Descomenta las siguientes líneas si quieres insertar datos de prueba
/*
INSERT INTO liquidaciones (mensajero, fecha, plata_inicial, total_recaudado, pagos_sinp, ya_liquidado) VALUES
('JOHAN', '2025-10-08', 0.00, 326044.00, 157879.00, true),
('PABLO', '2025-10-08', 0.00, 332240.00, 155140.00, true),
('IRVING', '2025-10-08', 0.00, 85600.00, 43800.00, true)
ON CONFLICT (mensajero, fecha) DO NOTHING;

-- Verificar que los datos se insertaron
SELECT * FROM liquidaciones WHERE fecha = '2025-10-08';
*/


