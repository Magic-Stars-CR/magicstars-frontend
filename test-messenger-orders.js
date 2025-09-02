// Script de prueba para verificar los pedidos del mensajero
// Este archivo es temporal y se puede eliminar después de la verificación

// Simular la generación de pedidos
const mockUsers = [
  { id: '3', name: 'Juan Pérez', role: 'mensajero' }
];

const mockCustomers = [
  { id: '1', name: 'Ana Rodríguez', address: 'Calle 5, Casa 123, Barrio La Paz, San José' },
  { id: '2', name: 'Roberto Morales', address: 'Avenida 10, Edificio Verde, Apto 4B, Escazú' },
  { id: '3', name: 'Carmen Jiménez', address: 'Residencial Los Álamos, Casa 45, Alajuela' },
  { id: '4', name: 'Diego Vargas', address: 'Del Banco Nacional 200m este, casa azul, Cartago' },
  { id: '5', name: 'Laura Méndez', address: 'Condominio Las Flores, Torre A, Apto 12, Heredia' },
  { id: '6', name: 'Carlos Herrera', address: 'Residencial El Bosque, Casa 78, Curridabat' },
  { id: '7', name: 'María López', address: 'Urbanización Los Pinos, Casa 23, Santa Ana' },
  { id: '8', name: 'Jorge Castro', address: 'Condominio Vista Verde, Apto 5B, Tibás' }
];

// Pedidos asignados a Juan Pérez (ID: 3)
const juanPerezOrders = [
  { id: 'MS-TODAY-016', status: 'confirmado', customer: mockCustomers[0], totalAmount: 32500, notes: 'Cliente solicita entrega temprano en la mañana' },
  { id: 'MS-TODAY-017', status: 'en_ruta', customer: mockCustomers[1], totalAmount: 18900, notes: 'Entregar en la entrada principal del condominio' },
  { id: 'MS-TODAY-018', status: 'confirmado', customer: mockCustomers[2], totalAmount: 45600, notes: 'Cliente prefiere entrega entre 10 AM y 12 PM' },
  { id: 'MS-TODAY-019', status: 'en_ruta', customer: mockCustomers[3], totalAmount: 28900, notes: 'Entregar en la recepción del edificio' },
  { id: 'MS-TODAY-020', status: 'confirmado', customer: mockCustomers[4], totalAmount: 15600, notes: 'Cliente solicita entrega después del almuerzo' },
  { id: 'MS-TODAY-021', status: 'en_ruta', customer: mockCustomers[5], totalAmount: 22300, notes: 'Entregar en la puerta trasera de la casa' },
  { id: 'MS-TODAY-022', status: 'confirmado', customer: mockCustomers[6], totalAmount: 18900, notes: 'Cliente prefiere entrega en la tarde' },
  { id: 'MS-TODAY-023', status: 'en_ruta', customer: mockCustomers[7], totalAmount: 45600, notes: 'Entregar en la entrada del condominio' },
  { id: 'MS-TODAY-024', status: 'confirmado', customer: mockCustomers[0], totalAmount: 12750, notes: 'Cliente solicita entrega antes de las 5 PM' },
  { id: 'MS-TODAY-025', status: 'en_ruta', customer: mockCustomers[1], totalAmount: 28900, notes: 'Entregar en la puerta principal' },
  { id: 'MS-TODAY-026', status: 'confirmado', customer: mockCustomers[2], totalAmount: 15600, notes: 'Cliente prefiere entrega en la noche' },
  { id: 'MS-TODAY-027', status: 'en_ruta', customer: mockCustomers[3], totalAmount: 22300, notes: 'Entregar en la entrada del edificio' },
  { id: 'MS-TODAY-028', status: 'confirmado', customer: mockCustomers[4], totalAmount: 45600, notes: 'Cliente solicita entrega antes de las 7 PM' },
  { id: 'MS-TODAY-029', status: 'entregado', customer: mockCustomers[5], totalAmount: 18900, notes: 'Entregado exitosamente temprano en la mañana' },
  { id: 'MS-TODAY-030', status: 'entregado', customer: mockCustomers[6], totalAmount: 12750, notes: 'Entregado exitosamente' },
  { id: 'MS-TODAY-031', status: 'devolucion', customer: mockCustomers[7], totalAmount: 28900, notes: 'Cliente no estaba en casa, devolver a oficina' },
  { id: 'MS-TODAY-032', status: 'reagendado', customer: mockCustomers[0], totalAmount: 45600, notes: 'Cliente solicitó reagendar para mañana a las 9 AM' },
  { id: 'MS-TODAY-033', status: 'entregado', customer: mockCustomers[1], totalAmount: 15600, notes: 'Entregado exitosamente' },
  { id: 'MS-TODAY-034', status: 'devolucion', customer: mockCustomers[2], totalAmount: 22300, notes: 'Producto dañado, cliente solicita devolución' },
  { id: 'MS-TODAY-035', status: 'entregado', customer: mockCustomers[3], totalAmount: 18900, notes: 'Entregado exitosamente' },
  { id: 'MS-TODAY-036', status: 'reagendado', customer: mockCustomers[4], totalAmount: 45600, notes: 'Cliente solicitó reagendar para el viernes' },
  { id: 'MS-TODAY-037', status: 'entregado', customer: mockCustomers[5], totalAmount: 12750, notes: 'Entregado exitosamente' },
  { id: 'MS-TODAY-038', status: 'entregado', customer: mockCustomers[6], totalAmount: 28900, notes: 'Entregado exitosamente' }
];

// Contar pedidos por estado
const ordersByStatus = juanPerezOrders.reduce((acc, order) => {
  acc[order.status] = (acc[order.status] || 0) + 1;
  return acc;
}, {});

console.log('=== PEDIDOS ASIGNADOS A JUAN PÉREZ (Mensajero ID: 3) ===');
console.log(`Total de pedidos: ${juanPerezOrders.length}`);
console.log('\nDistribución por estado:');
Object.entries(ordersByStatus).forEach(([status, count]) => {
  console.log(`- ${status}: ${count} pedidos`);
});

console.log('\n=== RESUMEN ===');
console.log(`Pedidos confirmados: ${ordersByStatus.confirmado || 0}`);
console.log(`Pedidos en ruta: ${ordersByStatus.en_ruta || 0}`);
console.log(`Pedidos entregados: ${ordersByStatus.entregado || 0}`);
console.log(`Pedidos devueltos: ${ordersByStatus.devolucion || 0}`);
console.log(`Pedidos reagendados: ${ordersByStatus.reagendado || 0}`);

console.log('\n=== PEDIDOS PARA HOY ===');
const todayOrders = juanPerezOrders.filter(order => 
  ['confirmado', 'en_ruta', 'reagendado'].includes(order.status)
);
console.log(`Pedidos activos para hoy: ${todayOrders.length}`);

console.log('\n=== DETALLES DE PEDIDOS ACTIVOS ===');
todayOrders.forEach(order => {
  console.log(`${order.id} - ${order.customer.name} - ${order.status} - ₡${order.totalAmount.toLocaleString()} - ${order.notes}`);
});
