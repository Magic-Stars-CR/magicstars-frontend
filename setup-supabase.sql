-- =============================================
-- SCRIPT DE CONFIGURACIÓN DE SUPABASE
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- 1. Crear la tabla pedidos_test
CREATE TABLE IF NOT EXISTS pedidos_test (
  id_pedido TEXT PRIMARY KEY,
  distrito TEXT NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  productos TEXT NOT NULL,
  link_ubicacion TEXT,
  nota_asesor TEXT,
  notas TEXT,
  mensajero_asignado TEXT,
  mensajero_concretado TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE pedidos_test ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de seguridad (permitir lectura y escritura para todos por ahora)
CREATE POLICY "Allow all operations on pedidos_test" ON pedidos_test
  FOR ALL USING (true);

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_pedidos_test_updated_at ON pedidos_test;
CREATE TRIGGER update_pedidos_test_updated_at
    BEFORE UPDATE ON pedidos_test
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insertar datos de prueba
INSERT INTO pedidos_test (id_pedido, distrito, valor_total, productos, link_ubicacion, nota_asesor, notas) VALUES
('PED-001', 'San José Centro', 25000.00, 'Producto A, Producto B', 'https://maps.google.com/ejemplo1', 'Cliente VIP', 'Entregar en horario de oficina'),
('PED-002', 'Escazú', 15000.00, 'Producto C', 'https://maps.google.com/ejemplo2', 'Llamar antes de entregar', NULL),
('PED-003', 'Cartago Centro', 30000.00, 'Producto D, Producto E, Producto F', 'https://maps.google.com/ejemplo3', NULL, 'Casa con portón azul'),
('PED-004', 'Heredia Centro', 12000.00, 'Producto G', NULL, 'Cliente frecuente', 'Dejar con portero'),
('PED-005', 'Alajuela Centro', 45000.00, 'Producto H, Producto I', 'https://maps.google.com/ejemplo5', 'Verificar identificación', 'Edificio de apartamentos, apto 3B');

-- 7. Verificar que la tabla se creó correctamente
SELECT 
  'Tabla pedidos_test creada correctamente' as status,
  COUNT(*) as total_pedidos
FROM pedidos_test;
