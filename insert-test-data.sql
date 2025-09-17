-- Script para insertar datos de prueba en la tabla pedidos
-- Ejecuta esto en el SQL Editor de Supabase

-- Primero, verificar si ya hay datos
SELECT COUNT(*) as total_antes FROM pedidos;

-- Insertar datos de prueba
INSERT INTO pedidos (id_pedido, distrito, valor_total, productos, link_ubicacion, nota_asesor, notas) VALUES
('PED-001', 'San José Centro', 25000.00, 'Producto A, Producto B', 'https://maps.google.com/ejemplo1', 'Cliente VIP', 'Entregar en horario de oficina'),
('PED-002', 'Escazú', 15000.00, 'Producto C', 'https://maps.google.com/ejemplo2', 'Llamar antes de entregar', NULL),
('PED-003', 'Cartago Centro', 30000.00, 'Producto D, Producto E, Producto F', 'https://maps.google.com/ejemplo3', NULL, 'Casa con portón azul'),
('PED-004', 'Heredia Centro', 12000.00, 'Producto G', NULL, 'Cliente frecuente', 'Dejar con portero'),
('PED-005', 'Alajuela Centro', 45000.00, 'Producto H, Producto I', 'https://maps.google.com/ejemplo5', 'Verificar identificación', 'Edificio de apartamentos, apto 3B'),
('PED-006', 'Puntarenas Centro', 18000.00, 'Producto J', 'https://maps.google.com/ejemplo6', NULL, 'Casa de dos pisos'),
('PED-007', 'Limón Centro', 22000.00, 'Producto K, Producto L', 'https://maps.google.com/ejemplo7', 'Cliente nuevo', 'Casa amarilla'),
('PED-008', 'San José Centro', 35000.00, 'Producto M', 'https://maps.google.com/ejemplo8', 'Cliente VIP', 'Oficina, piso 3'),
('PED-009', 'Escazú', 28000.00, 'Producto N, Producto O', 'https://maps.google.com/ejemplo9', 'Llamar antes', 'Casa con jardín'),
('PED-010', 'Cartago Centro', 19000.00, 'Producto P', 'https://maps.google.com/ejemplo10', NULL, 'Casa blanca');

-- Verificar que se insertaron los datos
SELECT COUNT(*) as total_despues FROM pedidos;

-- Mostrar algunos registros para verificar
SELECT * FROM pedidos LIMIT 5;
