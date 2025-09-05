import { 
  User, Order, Customer, Product, OrderItem, OrderStatus, PaymentMethod, OrderOrigin, 
  Stats, MessengerStats, Company, CompanyStats, MonthlyStats,
  InventoryItem, InventoryTransaction, InventoryAdjustment, InventoryAlert, 
  InventoryStats, InventoryActionType, InventoryFilters, ProductWithInventory,
  RedLogisticOrder, RedLogisticTracking, RedLogisticStats, RedLogisticFilters,
  RedLogisticStatus, DeliveryMethod, RouteLiquidation, RouteLiquidationStats, RouteLiquidationFilters,
  DailyRoute, RouteExpense, RouteHistoryStats, RouteHistoryFilters, RouteAssignment, ZoneGroup,
  UnassignedOrder, RouteMessengerStats, RouteManagementFilters, RouteCreationData, RouteInfo, RouteStats
} from './types';

// Mock Companies
export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Para Machos CR',
    taxId: '3-101-789456',
    address: 'Avenida Central, Calle 5, San José Centro, Costa Rica',
    phone: '+506 2257-1234',
    email: 'info@paramachoscr.com',
    isActive: true,
    createdAt: '2023-06-15T08:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'BeautyFan',
    taxId: '3-101-456789',
    address: 'Plaza Mayor, Escazú, San José, Costa Rica',
    phone: '+506 2289-5678',
    email: 'ventas@beautyfan.cr',
    isActive: true,
    createdAt: '2023-09-20T09:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '3',
    name: 'AllStars',
    taxId: '3-101-321654',
    address: 'Centro Comercial Multiplaza, Curridabat, San José, Costa Rica',
    phone: '+506 2272-9012',
    email: 'contacto@allstars.cr',
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
];

// Mock Users with company relationships
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@magicstars.com',
    name: 'Carlos Administrador',
    role: 'admin',
    phone: '+506 8888-1111',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '2023-06-15T08:00:00Z',
    isActive: true,
    companyId: undefined, // Admin no tiene empresa asociada
    company: undefined,
  },
  {
    id: '2',
    email: 'maria.asesor@paramachoscr.com',
    name: 'María Fernández',
    role: 'asesor',
    phone: '+506 8888-2222',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b9e1?w=150',
    createdAt: '2023-07-01T10:00:00Z',
    isActive: true,
    companyId: '1', // Solo asesor de Para Machos CR
    company: mockCompanies[0],
  },
  {
    id: '3',
    email: 'juan.mensajero@magicstars.com',
    name: 'Juan Pérez',
    role: 'mensajero',
    phone: '+506 8888-3333',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2023-07-15T10:00:00Z',
    isActive: true,
    companyId: undefined, // Mensajero no tiene empresa asociada
    company: undefined,
  },
  {
    id: '4',
    email: 'luis.mensajero@magicstars.com',
    name: 'Luis González',
    role: 'mensajero',
    phone: '+506 8888-4444',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2023-09-20T09:00:00Z',
    isActive: true,
    companyId: undefined, // Mensajero no tiene empresa asociada
    company: undefined,
  },
  {
    id: '5',
    email: 'ana.mensajero@magicstars.com',
    name: 'Ana Martínez',
    role: 'mensajero',
    phone: '+506 8888-5555',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    createdAt: '2024-01-10T10:00:00Z',
    isActive: true,
    companyId: undefined, // Mensajero no tiene empresa asociada
    company: undefined,
  },
  {
    id: '6',
    email: 'pedro.asesor@beautyfan.cr',
    name: 'Pedro Ramírez',
    role: 'asesor',
    phone: '+506 8888-6666',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2023-10-01T10:00:00Z',
    isActive: true,
    companyId: '2', // Solo asesor de BeautyFan
    company: mockCompanies[1],
  },
  {
    id: '7',
    email: 'carlos.asesor@allstars.cr',
    name: 'Carlos Herrera',
    role: 'asesor',
    phone: '+506 8888-7777',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2024-01-15T10:00:00Z',
    isActive: true,
    companyId: '3', // Solo asesor de AllStars
    company: mockCompanies[2],
  },
  // Administradores adicionales
  {
    id: '8',
    email: 'admin2@magicstars.com',
    name: 'Roberto Silva',
    role: 'admin',
    phone: '+506 8888-8888',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '2023-08-15T08:00:00Z',
    isActive: true,
    companyId: undefined,
    company: undefined,
  },
  {
    id: '9',
    email: 'admin3@magicstars.com',
    name: 'Patricia López',
    role: 'admin',
    phone: '+506 8888-9999',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b9e1?w=150',
    createdAt: '2023-09-01T08:00:00Z',
    isActive: true,
    companyId: undefined,
    company: undefined,
  },
  // Mensajeros adicionales
  {
    id: '10',
    email: 'carlos.mensajero@magicstars.com',
    name: 'Carlos Rodríguez',
    role: 'mensajero',
    phone: '+506 8888-0000',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '2023-11-01T10:00:00Z',
    isActive: true,
    companyId: undefined,
    company: undefined,
  },
  {
    id: '11',
    email: 'sofia.mensajero@magicstars.com',
    name: 'Sofía Herrera',
    role: 'mensajero',
    phone: '+506 8888-1111',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    createdAt: '2023-11-15T10:00:00Z',
    isActive: true,
    companyId: undefined,
    company: undefined,
  },
  {
    id: '12',
    email: 'miguel.mensajero@magicstars.com',
    name: 'Miguel Torres',
    role: 'mensajero',
    phone: '+506 8888-2222',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2023-12-01T10:00:00Z',
    isActive: true,
    companyId: undefined,
    company: undefined,
  },
  {
    id: '13',
    email: 'laura.mensajero@magicstars.com',
    name: 'Laura Vargas',
    role: 'mensajero',
    phone: '+506 8888-3333',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b9e1?w=150',
    createdAt: '2023-12-10T10:00:00Z',
    isActive: true,
    companyId: undefined,
    company: undefined,
  },
  // Asesores adicionales
  {
    id: '14',
    email: 'pedro.asesor@paramachoscr.com',
    name: 'Pedro Jiménez',
    role: 'asesor',
    phone: '+506 8888-4444',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '2023-08-01T10:00:00Z',
    isActive: true,
    companyId: '1',
    company: mockCompanies[0],
  },
  {
    id: '15',
    email: 'carmen.asesor@beautyfan.com',
    name: 'Carmen Ruiz',
    role: 'asesor',
    phone: '+506 8888-5555',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    createdAt: '2023-09-15T10:00:00Z',
    isActive: true,
    companyId: '2',
    company: mockCompanies[1],
  },
  {
    id: '16',
    email: 'diego.asesor@allstars.com',
    name: 'Diego Morales',
    role: 'asesor',
    phone: '+506 8888-6666',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2023-10-15T10:00:00Z',
    isActive: true,
    companyId: '3',
    company: mockCompanies[2],
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'PMC-001',
    name: 'Crema Facial Anti-edad Para Machos',
    category: 'Cuidado Facial Masculino',
    price: 28500,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
  },
  {
    id: '2',
    sku: 'PMC-002',
    name: 'Sérum Vitamina C Masculino',
    category: 'Cuidado Facial Masculino',
    price: 21900,
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bdf303?w=300',
  },
  {
    id: '3',
    sku: 'PMC-003',
    name: 'Mascarilla Hidratante Para Machos',
    category: 'Cuidado Facial Masculino',
    price: 15750,
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=300',
  },
  {
    id: '4',
    sku: 'PMC-004',
    name: 'Protector Solar SPF 50 Masculino',
    category: 'Protección Solar',
    price: 25300,
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300',
  },
  {
    id: '5',
    sku: 'PMC-005',
    name: 'Kit Limpieza Facial Para Machos',
    category: 'Kits Masculinos',
    price: 52600,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
  },
  {
    id: '6',
    sku: 'PMC-006',
    name: 'Aceite Facial Nutritivo Masculino',
    category: 'Cuidado Facial Masculino',
    price: 32900,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
  },
  {
    id: '7',
    sku: 'PMC-007',
    name: 'Exfoliante Suave Para Machos',
    category: 'Cuidado Facial Masculino',
    price: 18600,
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bdf303?w=300',
  },
  {
    id: '8',
    sku: 'PMC-008',
    name: 'Tónico Facial Masculino',
    category: 'Cuidado Facial Masculino',
    price: 21900,
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=300',
  },
  {
    id: '9',
    sku: 'BF-001',
    name: 'Crema Facial BeautyFan Premium',
    category: 'Cuidado Facial Premium',
    price: 32500,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
  },
  {
    id: '10',
    sku: 'BF-002',
    name: 'Sérum BeautyFan Vitamina C+',
    category: 'Cuidado Facial Premium',
    price: 28900,
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bdf303?w=300',
  },
  {
    id: '11',
    sku: 'AS-001',
    name: 'Crema Facial AllStars Pro',
    category: 'Cuidado Facial Profesional',
    price: 29500,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
  },
  {
    id: '12',
    sku: 'AS-002',
    name: 'Sérum AllStars Multi-Vitaminas',
    category: 'Cuidado Facial Profesional',
    price: 25900,
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bdf303?w=300',
  },
];

// Generate mock order items
const generateOrderItems = (count: number): OrderItem[] => {
  const items: OrderItem[] = [];
  const usedProducts = new Set<string>(); // Avoid duplicate products in same order
  
  for (let i = 0; i < count; i++) {
    let product: Product;
    let attempts = 0;
    
    // Try to get a unique product for this order
    do {
      product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      attempts++;
    } while (usedProducts.has(product.id) && attempts < 10);
    
    usedProducts.add(product.id);
    
    // More realistic quantity distribution
    let quantity: number;
    const quantityRandom = Math.random();
    if (quantityRandom < 0.6) {
      quantity = 1; // 60% single items
    } else if (quantityRandom < 0.85) {
      quantity = 2; // 25% two items
    } else {
      quantity = 3; // 15% three items
    }
    
    items.push({
      id: `item-${Date.now()}-${i}`,
      product,
      quantity,
      price: product.price,
      totalPrice: product.price * quantity,
    });
  }
  return items;
};

// Generate realistic dates for the last 90 days
const generateRealisticDates = (): Date[] => {
  const dates: Date[] = [];
  const now = new Date();
  
  // Generate dates for the last 90 days
  for (let i = 0; i < 90; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some randomness to make it more realistic
    const randomHour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
    const randomMinute = Math.floor(Math.random() * 60);
    date.setHours(randomHour, randomMinute, 0, 0);
    
    dates.push(date);
  }
  
  return dates;
};

// Generate today's orders with specific scenarios
const generateTodayOrders = (): Order[] => {
  const todayOrders: Order[] = [];
  const messengers = mockUsers.filter(u => u.role === 'mensajero');
  const advisors = mockUsers.filter(u => u.role === 'asesor');
  
  // Obtener la fecha de hoy
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Para Machos CR - 8 pedidos del día
  const pmcTodayOrders: Order[] = [
    {
      id: 'PMC-TODAY-001',
      customerName: 'Ana Rodríguez',
      customerPhone: '50687654321',
      customerAddress: 'Calle 5, Casa 123, Barrio La Paz',
      customerProvince: 'San José',
      customerCanton: 'CENTRAL',
      customerDistrict: 'CARMEN',
      customerLocationLink: 'https://maps.app.goo.gl/example1',
      
      items: generateOrderItems(2),
      totalAmount: 52600,
      status: 'en_ruta', // Cambiado a en_ruta para que sea visible
      paymentMethod: 'efectivo',
      origin: 'csv',
      deliveryMethod: 'mensajeria_propia',
      createdAt: `${todayString}T08:30:00Z`,
      updatedAt: `${todayString}T08:30:00Z`,
      
      assignedMessengerId: messengers[0].id, // Juan Pérez
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Cliente solicita entrega antes de las 10 AM',
      deliveryAddress: 'Calle 5, Casa 123, Barrio La Paz',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-TODAY-002',
      customerName: 'Roberto Morales',
      customerPhone: '50687745225',
      customerAddress: 'Avenida 10, Edificio Verde, Apto 4B',
      customerProvince: 'San José',
      customerCanton: 'ESCAZU',
      customerDistrict: 'ESCAZU',
      customerLocationLink: 'https://maps.app.goo.gl/example2',
      
      items: generateOrderItems(1),
      totalAmount: 21900,
      status: 'en_ruta',
      paymentMethod: 'sinpe',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: `${todayString}T09:15:00Z`,
      updatedAt: `${todayString}T11:00:00Z`,
      
      assignedMessengerId: messengers[1].id, // Luis González
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Entregar en recepción del edificio',
      deliveryAddress: 'Avenida 10, Edificio Verde, Apto 4B',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-TODAY-003',
      customerName: 'Carmen Jiménez',
      customerPhone: '50663687157',
      customerAddress: 'Residencial Los Álamos, Casa 45',
      customerProvince: 'Alajuela',
      customerCanton: 'ALAJUELA',
      customerDistrict: 'ALAJUELA',
      customerLocationLink: 'https://maps.app.goo.gl/example3',
      
      items: generateOrderItems(3),
      totalAmount: 15750,
      status: 'en_ruta',
      paymentMethod: 'efectivo',
      origin: 'csv',
      deliveryMethod: 'correos_costa_rica',
      createdAt: `${todayString}T09:45:00Z`,
      updatedAt: `${todayString}T11:30:00Z`,
      
      assignedMessengerId: messengers[2].id, // Ana Martínez
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Cliente no disponible hasta las 2 PM',
      deliveryAddress: 'Residencial Los Álamos, Casa 45',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-TODAY-004',
      customerName: 'Diego Vargas',
      customerPhone: '50687657654',
      customerAddress: 'Del Banco Nacional 200m este, casa azul',
      customerProvince: 'Cartago',
      customerCanton: 'CARTAGO',
      customerDistrict: 'ORIENTAL',
      customerLocationLink: 'https://maps.app.goo.gl/example4',
      
      items: generateOrderItems(1),
      totalAmount: 22300,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'sinpe',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: `${todayString}T10:00:00Z`,
      updatedAt: `${todayString}T10:00:00Z`,
      
      assignedMessengerId: messengers[0].id, // Juan Pérez
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Dirección difícil de encontrar, llamar antes de llegar',
      deliveryAddress: 'Del Banco Nacional 200m este, casa azul',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-TODAY-005',
      customerName: 'Laura Méndez',
      customerPhone: '50687658765',
      customerAddress: 'Condominio Las Flores, Torre A, Apto 12',
      customerProvince: 'Heredia',
      customerCanton: 'HEREDIA',
      customerDistrict: 'HEREDIA',
      customerLocationLink: 'https://maps.app.goo.gl/example5',
      
      items: generateOrderItems(2),
      totalAmount: 28900,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'efectivo',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: `${todayString}T10:30:00Z`,
      updatedAt: `${todayString}T10:30:00Z`,
      
      assignedMessengerId: messengers[1].id, // Luis González
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Nuevo pedido urgente',
      deliveryAddress: 'Condominio Las Flores, Torre A, Apto 12',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-TODAY-006',
      customerName: 'Carlos Herrera',
      customerPhone: '50687659876',
      customerAddress: 'Residencial El Bosque, Casa 78',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/example6',
      
      items: generateOrderItems(1),
      totalAmount: 15600,
      status: 'en_ruta',
      paymentMethod: 'efectivo',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: `${todayString}T11:00:00Z`,
      updatedAt: `${todayString}T12:00:00Z`,
      
      assignedMessengerId: messengers[2].id, // Ana Martínez
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Entregar en la puerta principal',
      deliveryAddress: 'Residencial El Bosque, Casa 78',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-TODAY-007',
      customerName: 'María López',
      customerPhone: '50687651098',
      customerAddress: 'Urbanización Los Pinos, Casa 23',
      customerProvince: 'San José',
      customerCanton: 'SANTA ANA',
      customerDistrict: 'SANTA ANA',
      customerLocationLink: 'https://maps.app.goo.gl/example7',
      
      items: generateOrderItems(2),
      totalAmount: 18900,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'sinpe',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: `${todayString}T11:30:00Z`,
      updatedAt: `${todayString}T11:30:00Z`,
      
      assignedMessengerId: messengers[0].id, // Juan Pérez
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Cliente prefiere entrega en la tarde',
      deliveryAddress: 'Urbanización Los Pinos, Casa 23',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-TODAY-008',
      customerName: 'Jorge Castro',
      customerPhone: '50687652109',
      customerAddress: 'Condominio Vista Verde, Apto 5B',
      customerProvince: 'San José',
      customerCanton: 'TIBAS',
      customerDistrict: 'TIBAS',
      customerLocationLink: 'https://maps.app.goo.gl/example8',
      
      items: generateOrderItems(3),
      totalAmount: 45600,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: `${todayString}T12:00:00Z`,
      updatedAt: `${todayString}T12:00:00Z`,
      
      assignedMessengerId: messengers[1].id, // Luis González
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Pedido de último minuto',
      deliveryAddress: 'Condominio Vista Verde, Apto 5B',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
  ];

  // BeautyFan - 8 pedidos del día
  const bfTodayOrders: Order[] = [
    {
      id: 'BF-TODAY-001',
      customerName: 'Mario Montenegro',
      customerPhone: '50663687157',
      customerAddress: 'Mercedes norte del bar España 175 metros al norte',
      customerProvince: 'Heredia',
      customerCanton: 'BARVA',
      customerDistrict: 'SANTA LUCIA',
      customerLocationLink: 'https://maps.app.goo.gl/bf1',
      
      items: generateOrderItems(1),
      totalAmount: 19900,
      status: 'en_ruta',
      paymentMethod: 'efectivo',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: `${todayString}T08:00:00Z`,
      updatedAt: `${todayString}T10:00:00Z`,
      
      assignedMessengerId: messengers[1].id, // Luis González
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'paga en efectivo',
      deliveryAddress: 'Mercedes norte del bar España 175 metros al norte',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-TODAY-002',
      customerName: 'Stiff Zuñiga',
      customerPhone: '50663943885',
      customerAddress: 'Frente a la escuela San Nicolás de Loyola',
      customerProvince: 'Cartago',
      customerCanton: 'CARTAGO',
      customerDistrict: 'SAN NICOLAS',
      customerLocationLink: 'https://maps.app.goo.gl/bf2',
      
      items: generateOrderItems(3),
      totalAmount: 31850,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'sinpe',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: `${todayString}T09:00:00Z`,
      updatedAt: `${todayString}T09:00:00Z`,
      
      assignedMessengerId: messengers[2].id, // Ana Martínez
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Cliente premium',
      deliveryAddress: 'Frente a la escuela San Nicolás de Loyola',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-TODAY-003',
      customerName: 'Adriana',
      customerPhone: '50661408823',
      customerAddress: 'Fresh market piedades',
      customerProvince: 'San José',
      customerCanton: 'SANTA ANA',
      customerDistrict: 'PIEDADES',
      customerLocationLink: 'https://maps.app.goo.gl/bf3',
      
      items: generateOrderItems(1),
      totalAmount: 19900,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: `${todayString}T10:00:00Z`,
      updatedAt: `${todayString}T10:00:00Z`,
      
      assignedMessengerId: messengers[0].id, // Juan Pérez
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Nuevo pedido premium',
      deliveryAddress: 'Fresh market piedades',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-TODAY-004',
      customerName: 'Sonia',
      customerPhone: '50687557316',
      customerAddress: '25 metros norte de la Iglesia de San Miguel',
      customerProvince: 'Heredia',
      customerCanton: 'BARVA',
      customerDistrict: 'SAN JOSE DE LA MONTANA',
      customerLocationLink: 'https://maps.app.goo.gl/bf4',
      
      items: generateOrderItems(1),
      totalAmount: 19900,
      status: 'en_ruta',
      paymentMethod: 'sinpe',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: `${todayString}T11:00:00Z`,
      updatedAt: `${todayString}T12:00:00Z`,
      
      assignedMessengerId: messengers[2].id, // Ana Martínez
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Entregar en la iglesia',
      deliveryAddress: '25 metros norte de la Iglesia de San Miguel',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-TODAY-005',
      customerName: 'Roberto Jiménez',
      customerPhone: '50687654321',
      customerAddress: 'Condominio Los Pinos, Casa 15',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/bf5',
      
      items: generateOrderItems(2),
      totalAmount: 28900,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: `${todayString}T12:00:00Z`,
      updatedAt: `${todayString}T12:00:00Z`,
      
      assignedMessengerId: messengers[1].id, // Luis González
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Cliente solicita entrega en la tarde',
      deliveryAddress: 'Condominio Los Pinos, Casa 15',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-TODAY-006',
      customerName: 'Carmen Fernández',
      customerPhone: '50687654322',
      customerAddress: 'Residencial El Bosque, Casa 25',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/bf6',
      
      items: generateOrderItems(1),
      totalAmount: 25900,
      status: 'en_ruta',
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: `${todayString}T13:00:00Z`,
      updatedAt: `${todayString}T14:00:00Z`,
      
      assignedMessengerId: messengers[0].id, // Juan Pérez
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Entregar en la puerta principal',
      deliveryAddress: 'Residencial El Bosque, Casa 25',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-TODAY-007',
      customerName: 'Diego Ramírez',
      customerPhone: '50687654323',
      customerAddress: 'Condominio Vista Verde, Apto 8C',
      customerProvince: 'San José',
      customerCanton: 'TIBAS',
      customerDistrict: 'TIBAS',
      customerLocationLink: 'https://maps.app.goo.gl/bf7',
      
      items: generateOrderItems(2),
      totalAmount: 55400,
      status: 'en_ruta',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: `${todayString}T14:00:00Z`,
      updatedAt: `${todayString}T14:00:00Z`,
      
      assignedMessengerId: messengers[2].id, // Ana Martínez
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Cliente prefiere entrega en la tarde',
      deliveryAddress: 'Condominio Vista Verde, Apto 8C',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-TODAY-008',
      customerName: 'Laura González',
      customerPhone: '50687654324',
      customerAddress: 'Residencial El Bosque, Casa 67',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/bf8',
      
      items: generateOrderItems(1),
      totalAmount: 18900,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: `${todayString}T15:00:00Z`,
      updatedAt: `${todayString}T15:00:00Z`,
      
      assignedMessengerId: messengers[1].id, // Luis González
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Entregar en la recepción',
      deliveryAddress: 'Residencial El Bosque, Casa 67',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
  ];

  // AllStars - 8 pedidos del día
  const asTodayOrders: Order[] = [
    {
      id: 'AS-TODAY-001',
      customerName: 'Carlos Méndez',
      customerPhone: '50687654321',
      customerAddress: 'Residencial El Bosque, Casa 25',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/as1',
      
      items: generateOrderItems(1),
      totalAmount: 29500,
      status: 'en_ruta',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: `${todayString}T08:00:00Z`,
      updatedAt: `${todayString}T10:30:00Z`,
      
      assignedMessengerId: messengers[2].id, // Ana Martínez
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Entregar en la puerta principal',
      deliveryAddress: 'Residencial El Bosque, Casa 25',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-TODAY-002',
      customerName: 'Ana González',
      customerPhone: '50687654322',
      customerAddress: 'Condominio Vista Verde, Apto 8C',
      customerProvince: 'San José',
      customerCanton: 'TIBAS',
      customerDistrict: 'TIBAS',
      customerLocationLink: 'https://maps.app.goo.gl/as2',
      
      items: generateOrderItems(3),
      totalAmount: 25900,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: `${todayString}T09:00:00Z`,
      updatedAt: `${todayString}T11:00:00Z`,
      
      assignedMessengerId: messengers[0].id, // Juan Pérez
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Cliente solicitó reagendar para mañana a las 9 AM',
      deliveryAddress: 'Condominio Vista Verde, Apto 8C',
      scheduledDate: '2024-12-02T09:00:00Z',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-TODAY-003',
      customerName: 'Luis Ramírez',
      customerPhone: '50687654323',
      customerAddress: 'Urbanización Los Pinos, Casa 45',
      customerProvince: 'San José',
      customerCanton: 'SANTA ANA',
      customerDistrict: 'SANTA ANA',
      customerLocationLink: 'https://maps.app.goo.gl/as3',
      
      items: generateOrderItems(2),
      totalAmount: 55400,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: `${todayString}T10:30:00Z`,
      updatedAt: `${todayString}T10:30:00Z`,
      
      assignedMessengerId: messengers[1].id, // Luis González
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Cliente prefiere entrega en la tarde',
      deliveryAddress: 'Urbanización Los Pinos, Casa 45',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-TODAY-004',
      customerName: 'María Fernández',
      customerPhone: '50687654324',
      customerAddress: 'Residencial El Bosque, Casa 67',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/as4',
      
      items: generateOrderItems(1),
      totalAmount: 18900,
      status: 'en_ruta',
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: `${todayString}T11:00:00Z`,
      updatedAt: `${todayString}T12:30:00Z`,
      
      assignedMessengerId: messengers[2].id, // Ana Martínez
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Entregar en la recepción',
      deliveryAddress: 'Residencial El Bosque, Casa 67',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-TODAY-005',
      customerName: 'Pedro López',
      customerPhone: '50687654325',
      customerAddress: 'Condominio Vista Verde, Apto 12D',
      customerProvince: 'San José',
      customerCanton: 'TIBAS',
      customerDistrict: 'TIBAS',
      customerLocationLink: 'https://maps.app.goo.gl/as5',
      
      items: generateOrderItems(2),
      totalAmount: 32500,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: `${todayString}T12:00:00Z`,
      updatedAt: `${todayString}T12:00:00Z`,
      
      assignedMessengerId: messengers[0].id, // Juan Pérez
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Nuevo pedido profesional',
      deliveryAddress: 'Condominio Vista Verde, Apto 12D',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-TODAY-006',
      customerName: 'Roberto Castro',
      customerPhone: '50687654326',
      customerAddress: 'Urbanización Los Pinos, Casa 89',
      customerProvince: 'San José',
      customerCanton: 'SANTA ANA',
      customerDistrict: 'SANTA ANA',
      customerLocationLink: 'https://maps.app.goo.gl/as6',
      
      items: generateOrderItems(1),
      totalAmount: 29500,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: `${todayString}T13:00:00Z`,
      updatedAt: `${todayString}T13:00:00Z`,
      
      assignedMessengerId: messengers[1].id, // Luis González
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Cliente solicita entrega después del almuerzo',
      deliveryAddress: 'Urbanización Los Pinos, Casa 89',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-TODAY-007',
      customerName: 'Carmen Herrera',
      customerPhone: '50687654327',
      customerAddress: 'Residencial El Bosque, Casa 34',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/as7',
      
      items: generateOrderItems(3),
      totalAmount: 55400,
      status: 'en_ruta',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: `${todayString}T14:00:00Z`,
      updatedAt: `${todayString}T15:00:00Z`,
      
      assignedMessengerId: messengers[2].id, // Ana Martínez
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Entregar en la puerta principal',
      deliveryAddress: 'Residencial El Bosque, Casa 34',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-TODAY-008',
      customerName: 'Diego Jiménez',
      customerPhone: '50687654328',
      customerAddress: 'Condominio Vista Verde, Apto 15E',
      customerProvince: 'San José',
      customerCanton: 'TIBAS',
      customerDistrict: 'TIBAS',
      customerLocationLink: 'https://maps.app.goo.gl/as8',
      
      items: generateOrderItems(2),
      totalAmount: 25900,
      status: 'en_ruta', // Cambiado a en_ruta
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: `${todayString}T15:00:00Z`,
      updatedAt: `${todayString}T15:00:00Z`,
      
      assignedMessengerId: messengers[0].id, // Juan Pérez
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Nuevo pedido profesional',
      deliveryAddress: 'Condominio Vista Verde, Apto 15E',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
  ];

  // Combine all today's orders
  todayOrders.push(...pmcTodayOrders, ...bfTodayOrders, ...asTodayOrders);
  
  return todayOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Generate mock orders with realistic distribution
const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const messengers = mockUsers.filter(u => u.role === 'mensajero');
  const advisors = mockUsers.filter(u => u.role === 'asesor');

  // Para Machos CR - 3 pedidos
  const pmcOrders: Order[] = [
    {
      id: 'PMC-000001',
      customerName: 'Patricia Soto Flores',
      customerPhone: '50685686124',
      customerAddress: 'De la iglesia agonia 1km al este y 50 norte',
      customerProvince: 'Alajuela',
      customerCanton: 'ALAJUELA',
      customerDistrict: 'ALAJUELA',
      customerLocationLink: 'https://maps.app.goo.gl/pv7M7nJttkEsh7JS7',
      
      items: generateOrderItems(2),
      totalAmount: 52600,
      status: 'entregado',
      paymentMethod: 'efectivo',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: '2024-12-01T08:30:00Z',
      updatedAt: '2024-12-01T10:45:00Z',
      
      assignedMessengerId: messengers[0].id,
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Cliente solicitó entrega temprano en la mañana',
      deliveryNotes: 'Entregado exitosamente',
      deliveryAddress: 'De la iglesia agonia 1km al este y 50 norte',
      deliveryDate: '2024-12-01T10:45:00Z',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-000002',
      customerName: 'Roberto Morales',
      customerPhone: '50687745225',
      customerAddress: 'Residencial Villa bonita casa 11b',
      customerProvince: 'Cartago',
      customerCanton: 'CARTAGO',
      customerDistrict: 'DULCE NOMBRE',
      customerLocationLink: 'https://maps.app.goo.gl/GKuoBDegbeXd5UwK9',
      
      items: generateOrderItems(1),
      totalAmount: 21900,
      status: 'en_ruta',
      paymentMethod: 'sinpe',
      origin: 'csv',
      deliveryMethod: 'correos_costa_rica',
      createdAt: '2024-12-01T09:15:00Z',
      updatedAt: '2024-12-01T11:00:00Z',
      
      assignedMessengerId: messengers[1].id,
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Entregar en recepción del edificio',
      deliveryAddress: 'Residencial Villa bonita casa 11b',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-000003',
      customerName: 'Carmen Jiménez',
      customerPhone: '50663687157',
      customerAddress: 'Residencial Los Álamos, Casa 45',
      customerProvince: 'Alajuela',
      customerCanton: 'ALAJUELA',
      customerDistrict: 'ALAJUELA',
      customerLocationLink: 'https://maps.app.goo.gl/aWK51Wzo23ovnDUD9',
      
      items: generateOrderItems(3),
      totalAmount: 15750,
      status: 'confirmado',
      paymentMethod: 'efectivo',
      origin: 'csv',
      deliveryMethod: 'correos_costa_rica',
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z',
      
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Cliente no disponible hasta las 2 PM',
      deliveryAddress: 'Residencial Los Álamos, Casa 45',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
  ];

  // BeautyFan - 3 pedidos
  const bfOrders: Order[] = [
    {
      id: 'BF-000001',
      customerName: 'Diego Vargas',
      customerPhone: '50687657654',
      customerAddress: 'Del Banco Nacional 200m este, casa azul',
      customerProvince: 'Cartago',
      customerCanton: 'CARTAGO',
      customerDistrict: 'ORIENTAL',
      customerLocationLink: 'https://maps.app.goo.gl/example1',
      
      items: generateOrderItems(2),
      totalAmount: 32500,
      status: 'entregado',
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: '2024-12-01T08:45:00Z',
      updatedAt: '2024-12-01T11:30:00Z',
      
      assignedMessengerId: messengers[1].id,
      assignedMessenger: messengers[1],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Cliente solicitó entrega después del almuerzo',
      deliveryNotes: 'Entregado exitosamente',
      deliveryAddress: 'Del Banco Nacional 200m este, casa azul',
      deliveryDate: '2024-12-01T11:30:00Z',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-000002',
      customerName: 'Laura Méndez',
      customerPhone: '50687658765',
      customerAddress: 'Condominio Las Flores, Torre A, Apto 12',
      customerProvince: 'Heredia',
      customerCanton: 'HEREDIA',
      customerDistrict: 'HEREDIA',
      customerLocationLink: 'https://maps.app.goo.gl/example2',
      
      items: generateOrderItems(1),
      totalAmount: 28900,
      status: 'pendiente',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: '2024-12-01T09:30:00Z',
      updatedAt: '2024-12-01T09:30:00Z',
      
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Nuevo pedido premium',
      deliveryAddress: 'Condominio Las Flores, Torre A, Apto 12',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-000003',
      customerName: 'Carlos Herrera',
      customerPhone: '50687659876',
      customerAddress: 'Residencial El Bosque, Casa 78',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/example3',
      
      items: generateOrderItems(2),
      totalAmount: 61400,
      status: 'devolucion',
      paymentMethod: 'sinpe',
      origin: 'csv',
      deliveryMethod: 'red_logistic',
      createdAt: '2024-12-01T07:00:00Z',
      updatedAt: '2024-12-01T12:00:00Z',
      
      assignedMessengerId: messengers[2].id,
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Cliente no estaba en casa, devolver a oficina',
      deliveryAddress: 'Residencial El Bosque, Casa 78',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
  ];

  // AllStars - 3 pedidos
  const asOrders: Order[] = [
    {
      id: 'AS-000001',
      customerName: 'María López',
      customerPhone: '50687651098',
      customerAddress: 'Urbanización Los Pinos, Casa 23',
      customerProvince: 'San José',
      customerCanton: 'SANTA ANA',
      customerDistrict: 'SANTA ANA',
      customerLocationLink: 'https://maps.app.goo.gl/example4',
      
      items: generateOrderItems(1),
      totalAmount: 29500,
      status: 'en_ruta',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: '2024-12-01T08:00:00Z',
      updatedAt: '2024-12-01T10:30:00Z',
      
      assignedMessengerId: messengers[2].id,
      assignedMessenger: messengers[2],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Entregar en la puerta principal',
      deliveryAddress: 'Urbanización Los Pinos, Casa 23',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-000002',
      customerName: 'Jorge Castro',
      customerPhone: '50687652109',
      customerAddress: 'Condominio Vista Verde, Apto 5B',
      customerProvince: 'San José',
      customerCanton: 'TIBAS',
      customerDistrict: 'TIBAS',
      customerLocationLink: 'https://maps.app.goo.gl/example5',
      
      items: generateOrderItems(3),
      totalAmount: 25900,
      status: 'reagendado',
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: '2024-12-01T09:00:00Z',
      updatedAt: '2024-12-01T11:00:00Z',
      
      assignedMessengerId: messengers[0].id,
      assignedMessenger: messengers[0],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Cliente solicitó reagendar para mañana a las 9 AM',
      deliveryAddress: 'Condominio Vista Verde, Apto 5B',
      scheduledDate: '2024-12-02T09:00:00Z',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-000003',
      customerName: 'Ana Rodríguez',
      customerPhone: '50687654321',
      customerAddress: 'Calle 5, Casa 123, Barrio La Paz',
      customerProvince: 'San José',
      customerCanton: 'CENTRAL',
      customerDistrict: 'CARMEN',
      customerLocationLink: 'https://maps.app.goo.gl/example6',
      
      items: generateOrderItems(2),
      totalAmount: 55400,
      status: 'confirmado',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: '2024-12-01T10:30:00Z',
      updatedAt: '2024-12-01T10:30:00Z',
      
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Cliente prefiere entrega en la tarde',
      deliveryAddress: 'Calle 5, Casa 123, Barrio La Paz',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    // Pedidos adicionales para nuevos mensajeros
    {
      id: 'PMC-NEW-001',
      customerName: 'Fernando Castro',
      customerPhone: '50688887777',
      customerAddress: 'Residencial Los Robles, Casa 15',
      customerProvince: 'San José',
      customerCanton: 'SANTA ANA',
      customerDistrict: 'SANTA ANA',
      customerLocationLink: 'https://maps.app.goo.gl/example_new1',
      
      items: generateOrderItems(2),
      totalAmount: 32000,
      status: 'entregado',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: '2024-12-12T08:00:00Z',
      updatedAt: '2024-12-12T14:30:00Z',
      
      assignedMessengerId: '10', // Carlos Rodríguez
      assignedMessenger: mockUsers[9],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Cliente muy amable, entrega exitosa',
      deliveryNotes: 'Entregado exitosamente',
      deliveryAddress: 'Residencial Los Robles, Casa 15',
      deliveryDate: '2024-12-12T14:30:00Z',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-NEW-002',
      customerName: 'Isabel Morales',
      customerPhone: '50688886666',
      customerAddress: 'Condominio Las Palmas, Apto 8B',
      customerProvince: 'Alajuela',
      customerCanton: 'ALAJUELA',
      customerDistrict: 'ALAJUELA',
      customerLocationLink: 'https://maps.app.goo.gl/example_new2',
      
      items: generateOrderItems(3),
      totalAmount: 45000,
      status: 'entregado',
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: '2024-12-12T09:00:00Z',
      updatedAt: '2024-12-12T16:00:00Z',
      
      assignedMessengerId: '10', // Carlos Rodríguez
      assignedMessenger: mockUsers[9],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Cliente confirmó pago por SINPE',
      deliveryNotes: 'Entregado exitosamente',
      deliveryAddress: 'Condominio Las Palmas, Apto 8B',
      deliveryDate: '2024-12-12T16:00:00Z',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
    {
      id: 'BF-NEW-001',
      customerName: 'Patricia Herrera',
      customerPhone: '50688885555',
      customerAddress: 'Urbanización El Prado, Casa 22',
      customerProvince: 'Cartago',
      customerCanton: 'CARTAGO',
      customerDistrict: 'ORIENTAL',
      customerLocationLink: 'https://maps.app.goo.gl/example_new3',
      
      items: generateOrderItems(2),
      totalAmount: 28000,
      status: 'entregado',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: '2024-12-12T10:00:00Z',
      updatedAt: '2024-12-12T17:30:00Z',
      
      assignedMessengerId: '11', // Sofía Herrera
      assignedMessenger: mockUsers[10],
      advisorId: advisors.find(a => a.companyId === '2')?.id,
      advisor: advisors.find(a => a.companyId === '2'),
      
      notes: 'Cliente solicitó entrega en la tarde',
      deliveryNotes: 'Entregado exitosamente',
      deliveryAddress: 'Urbanización El Prado, Casa 22',
      deliveryDate: '2024-12-12T17:30:00Z',
      
      companyId: '2',
      company: mockCompanies[1],
      routeSchedule: 'DIA',
    },
    {
      id: 'AS-NEW-001',
      customerName: 'Roberto Silva',
      customerPhone: '50688884444',
      customerAddress: 'Residencial Vista Hermosa, Casa 45',
      customerProvince: 'Heredia',
      customerCanton: 'HEREDIA',
      customerDistrict: 'HEREDIA',
      customerLocationLink: 'https://maps.app.goo.gl/example_new4',
      
      items: generateOrderItems(4),
      totalAmount: 52000,
      status: 'entregado',
      paymentMethod: 'efectivo',
      origin: 'csv',
      createdAt: '2024-12-11T08:30:00Z',
      updatedAt: '2024-12-11T15:45:00Z',
      
      assignedMessengerId: '12', // Miguel Torres
      assignedMessenger: mockUsers[11],
      advisorId: advisors.find(a => a.companyId === '3')?.id,
      advisor: advisors.find(a => a.companyId === '3'),
      
      notes: 'Cliente muy satisfecho con el servicio',
      deliveryNotes: 'Entregado exitosamente',
      deliveryAddress: 'Residencial Vista Hermosa, Casa 45',
      deliveryDate: '2024-12-11T15:45:00Z',
      
      companyId: '3',
      company: mockCompanies[2],
      routeSchedule: 'DIA',
    },
    {
      id: 'PMC-NEW-003',
      customerName: 'Carmen López',
      customerPhone: '50688883333',
      customerAddress: 'Condominio Los Laureles, Apto 12C',
      customerProvince: 'San José',
      customerCanton: 'CURRIDABAT',
      customerDistrict: 'CURRIDABAT',
      customerLocationLink: 'https://maps.app.goo.gl/example_new5',
      
      items: generateOrderItems(1),
      totalAmount: 15000,
      status: 'entregado',
      paymentMethod: 'sinpe',
      origin: 'csv',
      createdAt: '2024-12-10T09:00:00Z',
      updatedAt: '2024-12-10T16:20:00Z',
      
      assignedMessengerId: '13', // Laura Vargas
      assignedMessenger: mockUsers[12],
      advisorId: advisors.find(a => a.companyId === '1')?.id,
      advisor: advisors.find(a => a.companyId === '1'),
      
      notes: 'Pedido pequeño pero importante',
      deliveryNotes: 'Entregado exitosamente',
      deliveryAddress: 'Condominio Los Laureles, Apto 12C',
      deliveryDate: '2024-12-10T16:20:00Z',
      
      companyId: '1',
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    },
  ];

  // Combine all orders
  orders.push(...pmcOrders, ...bfOrders, ...asOrders);

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const mockOrders = [...generateTodayOrders(), ...generateMockOrders()];

// ===== INVENTARIO MOCK DATA =====

// Mock Inventory Items
export const mockInventoryItems: InventoryItem[] = [
  // Para Machos CR
  {
    id: 'inv-1',
    productId: '1',
    product: mockProducts[0],
    companyId: '1',
    company: mockCompanies[0],
    currentStock: 45,
    minimumStock: 10,
    maximumStock: 100,
    reservedStock: 5,
    availableStock: 40,
    location: 'Almacén A - Estante 1',
    lastUpdated: '2024-12-01T10:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'inv-2',
    productId: '2',
    product: mockProducts[1],
    companyId: '1',
    company: mockCompanies[0],
    currentStock: 8,
    minimumStock: 15,
    maximumStock: 80,
    reservedStock: 2,
    availableStock: 6,
    location: 'Almacén A - Estante 2',
    lastUpdated: '2024-12-01T09:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'inv-3',
    productId: '3',
    product: mockProducts[2],
    companyId: '1',
    company: mockCompanies[0],
    currentStock: 0,
    minimumStock: 5,
    maximumStock: 50,
    reservedStock: 0,
    availableStock: 0,
    location: 'Almacén A - Estante 3',
    lastUpdated: '2024-11-30T16:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'inv-4',
    productId: '4',
    product: mockProducts[3],
    companyId: '1',
    company: mockCompanies[0],
    currentStock: 120,
    minimumStock: 20,
    maximumStock: 100,
    reservedStock: 8,
    availableStock: 112,
    location: 'Almacén A - Estante 4',
    lastUpdated: '2024-12-01T08:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  // BeautyFan
  {
    id: 'inv-5',
    productId: '9',
    product: mockProducts[8],
    companyId: '2',
    company: mockCompanies[1],
    currentStock: 25,
    minimumStock: 10,
    maximumStock: 60,
    reservedStock: 3,
    availableStock: 22,
    location: 'Almacén B - Estante 1',
    lastUpdated: '2024-12-01T11:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'inv-6',
    productId: '10',
    product: mockProducts[9],
    companyId: '2',
    company: mockCompanies[1],
    currentStock: 12,
    minimumStock: 8,
    maximumStock: 40,
    reservedStock: 1,
    availableStock: 11,
    location: 'Almacén B - Estante 2',
    lastUpdated: '2024-12-01T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  // AllStars
  {
    id: 'inv-7',
    productId: '11',
    product: mockProducts[10],
    companyId: '3',
    company: mockCompanies[2],
    currentStock: 30,
    minimumStock: 12,
    maximumStock: 70,
    reservedStock: 4,
    availableStock: 26,
    location: 'Almacén C - Estante 1',
    lastUpdated: '2024-12-01T09:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'inv-8',
    productId: '12',
    product: mockProducts[11],
    companyId: '3',
    company: mockCompanies[2],
    currentStock: 6,
    minimumStock: 10,
    maximumStock: 50,
    reservedStock: 2,
    availableStock: 4,
    location: 'Almacén C - Estante 2',
    lastUpdated: '2024-12-01T08:45:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
];

// Mock Inventory Transactions
export const mockInventoryTransactions: InventoryTransaction[] = [
  {
    id: 'trans-1',
    inventoryItemId: 'inv-1',
    inventoryItem: mockInventoryItems[0],
    actionType: 'entrada',
    quantity: 20,
    previousStock: 25,
    newStock: 45,
    reason: 'Compra de stock',
    userId: '1',
    user: mockUsers[0],
    createdAt: '2024-12-01T10:00:00Z',
    notes: 'Llegada de nueva mercancía',
  },
  {
    id: 'trans-2',
    inventoryItemId: 'inv-2',
    inventoryItem: mockInventoryItems[1],
    actionType: 'pedido_montado',
    quantity: -3,
    previousStock: 11,
    newStock: 8,
    reason: 'Pedido PMC-TODAY-001 montado a ruta',
    referenceId: 'PMC-TODAY-001',
    referenceType: 'order',
    userId: '1',
    user: mockUsers[0],
    createdAt: '2024-12-01T09:30:00Z',
    notes: 'Descuento automático por pedido montado',
  },
  {
    id: 'trans-3',
    inventoryItemId: 'inv-3',
    inventoryItem: mockInventoryItems[2],
    actionType: 'salida',
    quantity: -5,
    previousStock: 5,
    newStock: 0,
    reason: 'Venta directa',
    userId: '2',
    user: mockUsers[1],
    createdAt: '2024-11-30T16:00:00Z',
    notes: 'Últimas unidades vendidas',
  },
  {
    id: 'trans-4',
    inventoryItemId: 'inv-4',
    inventoryItem: mockInventoryItems[3],
    actionType: 'ajuste',
    quantity: 10,
    previousStock: 110,
    newStock: 120,
    reason: 'Ajuste por inventario físico',
    userId: '1',
    user: mockUsers[0],
    createdAt: '2024-12-01T08:00:00Z',
    notes: 'Productos encontrados en inventario físico',
  },
  {
    id: 'trans-5',
    inventoryItemId: 'inv-5',
    inventoryItem: mockInventoryItems[4],
    actionType: 'pedido_devuelto',
    quantity: 2,
    previousStock: 23,
    newStock: 25,
    reason: 'Pedido BF-TODAY-003 devuelto',
    referenceId: 'BF-TODAY-003',
    referenceType: 'order',
    userId: '1',
    user: mockUsers[0],
    createdAt: '2024-12-01T11:00:00Z',
    notes: 'Devolución automática por pedido no entregado',
  },
];

// Mock Inventory Alerts
export const mockInventoryAlerts: InventoryAlert[] = [
  {
    id: 'alert-1',
    inventoryItemId: 'inv-2',
    inventoryItem: mockInventoryItems[1],
    alertType: 'low_stock',
    severity: 'medium',
    message: 'Stock bajo: Solo quedan 8 unidades (mínimo: 15)',
    isRead: false,
    createdAt: '2024-12-01T09:30:00Z',
  },
  {
    id: 'alert-2',
    inventoryItemId: 'inv-3',
    inventoryItem: mockInventoryItems[2],
    alertType: 'out_of_stock',
    severity: 'critical',
    message: 'Producto agotado: 0 unidades disponibles',
    isRead: false,
    createdAt: '2024-11-30T16:00:00Z',
  },
  {
    id: 'alert-3',
    inventoryItemId: 'inv-4',
    inventoryItem: mockInventoryItems[3],
    alertType: 'overstock',
    severity: 'low',
    message: 'Stock alto: 120 unidades (máximo: 100)',
    isRead: true,
    createdAt: '2024-12-01T08:00:00Z',
    resolvedAt: '2024-12-01T10:00:00Z',
    resolvedBy: '1',
  },
  {
    id: 'alert-4',
    inventoryItemId: 'inv-8',
    inventoryItem: mockInventoryItems[7],
    alertType: 'low_stock',
    severity: 'medium',
    message: 'Stock bajo: Solo quedan 6 unidades (mínimo: 10)',
    isRead: false,
    createdAt: '2024-12-01T08:45:00Z',
  },
];

// API Functions
export const mockApi = {
  // Auth
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    if (password !== 'password123') {
      throw new Error('Contraseña incorrecta');
    }
    return { user, token: 'mock-jwt-token' };
  },

  // Companies
  getCompanies: async (filters?: any): Promise<Company[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let filteredCompanies = [...mockCompanies];

    // Filter by company ID if specified (for advisors to only see their company)
    if (filters?.companyId) {
      filteredCompanies = filteredCompanies.filter(c => c.id === filters.companyId);
    }

    return filteredCompanies;
  },

  getCompany: async (id: string): Promise<Company> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const company = mockCompanies.find(c => c.id === id);
    if (!company) {
      throw new Error('Empresa no encontrada');
    }
    return company;
  },

  createCompany: async (companyData: Partial<Company>): Promise<Company> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newCompany: Company = {
      id: `company-${Date.now()}`,
      name: companyData.name || '',
      taxId: companyData.taxId || '',
      address: companyData.address || '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCompanies.push(newCompany);
    return newCompany;
  },

  updateCompany: async (id: string, companyData: Partial<Company>): Promise<Company> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const companyIndex = mockCompanies.findIndex(c => c.id === id);
    if (companyIndex === -1) {
      throw new Error('Empresa no encontrada');
    }
    
    mockCompanies[companyIndex] = {
      ...mockCompanies[companyIndex],
      ...companyData,
      updatedAt: new Date().toISOString(),
    };
    
    return mockCompanies[companyIndex];
  },

  deleteCompany: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const companyIndex = mockCompanies.findIndex(c => c.id === id);
    if (companyIndex === -1) {
      throw new Error('Empresa no encontrada');
    }
    mockCompanies.splice(companyIndex, 1);
  },

  getCompanyStats: async (companyId: string): Promise<CompanyStats> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate monthly stats for the company
    const monthlyStats: MonthlyStats[] = [
      { year: 2025, month: 1, monthName: 'ENERO', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 2, monthName: 'FEBRERO', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 3, monthName: 'MARZO', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 4, monthName: 'ABRIL', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 5, monthName: 'MAYO', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 6, monthName: 'JUNIO', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 7, monthName: 'JULIO', sales: 156886010, delivered: 55367348, deliveryRate: 35.29 },
      { year: 2025, month: 8, monthName: 'AGOSTO', sales: 153344019, delivered: 74571232, deliveryRate: 48.63 },
      { year: 2025, month: 9, monthName: 'SEPTIEMBRE', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 10, monthName: 'OCTUBRE', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 11, monthName: 'NOVIEMBRE', sales: 0, delivered: 0, deliveryRate: 0 },
      { year: 2025, month: 12, monthName: 'DICIEMBRE', sales: 0, delivered: 0, deliveryRate: 0 },
    ];

    const company = mockCompanies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    // Calculate stats based on actual orders for this company
    const companyOrders = mockOrders.filter(o => {
      if (companyId === '1') return o.id.startsWith('PMC');
      if (companyId === '2') return o.id.startsWith('BF');
      if (companyId === '3') return o.id.startsWith('AS');
      return false;
    });

    const totalOrders = companyOrders.length;
    const deliveredOrders = companyOrders.filter(o => o.status === 'entregado').length;
    const returnedOrders = companyOrders.filter(o => o.status === 'devolucion').length;
    const rescheduledOrders = companyOrders.filter(o => o.status === 'reagendado').length;
    const pendingOrders = companyOrders.filter(o => ['pendiente', 'confirmado', 'en_ruta'].includes(o.status)).length;
    
    const cashOrders = companyOrders.filter(o => o.paymentMethod === 'efectivo' && o.status === 'entregado');
    const sinpeOrders = companyOrders.filter(o => o.paymentMethod === 'sinpe' && o.status === 'entregado');
    
    const totalCash = cashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalSinpe = sinpeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    return {
      companyId,
      company,
      monthlyStats,
      totalOrders,
      deliveredOrders,
      returnedOrders,
      rescheduledOrders,
      pendingOrders,
      totalCash,
      totalSinpe,
      deliveryRate,
    };
  },

  // Users
  getUsers: async (filters?: any): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let filteredUsers = [...mockUsers];

    // Filter by company if specified (for advisors to only see users from their company)
    if (filters?.companyId) {
      filteredUsers = filteredUsers.filter(u => u.companyId === filters.companyId);
    }

    return filteredUsers;
  },

  // Orders
  getOrders: async (filters?: any): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let filteredOrders = [...mockOrders];

    // Filter by company if user is an advisor (only show orders from their company)
    if (filters?.userCompanyId) {
      const companyPrefix = filters.userCompanyId === '1' ? 'PMC' : 
                           filters.userCompanyId === '2' ? 'BF' : 
                           filters.userCompanyId === '3' ? 'AS' : null;
      if (companyPrefix) {
        filteredOrders = filteredOrders.filter(o => o.id.startsWith(companyPrefix));
      }
    }

    if (filters?.status) {
      filteredOrders = filteredOrders.filter(o => o.status === filters.status);
    }
    if (filters?.assignedMessengerId) {
      filteredOrders = filteredOrders.filter(o => o.assignedMessengerId === filters.assignedMessengerId);
    }
    if (filters?.dateFrom) {
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters?.dateTo) {
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) <= new Date(filters.dateTo));
    }
    if (filters?.advisorId) {
      filteredOrders = filteredOrders.filter(o => o.advisorId === filters.advisorId);
    }
    if (filters?.deliveryMethod) {
      filteredOrders = filteredOrders.filter(o => o.deliveryMethod === filters.deliveryMethod);
    }
    
    // Special filter for today's orders
    if (filters?.today) {
      const today = new Date().toISOString().split('T')[0];
      filteredOrders = filteredOrders.filter(o => o.createdAt.startsWith(today));
    }

    return filteredOrders;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, notes?: string): Promise<Order> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (notes) order.deliveryNotes = notes;
    if (status === 'entregado') order.deliveryDate = new Date().toISOString();
    return order;
  },

  // Stats
  getStats: async (filters?: any): Promise<Stats> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let orders = mockOrders;
    
    // Filter by company if user is an advisor (only show stats from their company)
    if (filters?.userCompanyId) {
      const companyPrefix = filters.userCompanyId === '1' ? 'PMC' : 
                           filters.userCompanyId === '2' ? 'BF' : 
                           filters.userCompanyId === '3' ? 'AS' : null;
      if (companyPrefix) {
        orders = orders.filter(o => o.id.startsWith(companyPrefix));
      }
    }
    
    if (filters?.assignedMessengerId) {
      orders = orders.filter(o => o.assignedMessengerId === filters.assignedMessengerId);
    }
    if (filters?.advisorId) {
      orders = orders.filter(o => o.advisorId === filters.advisorId);
    }
    if (filters?.dateFrom) {
      orders = orders.filter(o => new Date(o.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters?.dateTo) {
      orders = orders.filter(o => new Date(o.createdAt) <= new Date(filters.dateTo));
    }

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'entregado').length;
    const returnedOrders = orders.filter(o => o.status === 'devolucion').length;
    const rescheduledOrders = orders.filter(o => o.status === 'reagendado').length;
    const pendingOrders = orders.filter(o => ['pendiente', 'confirmado', 'en_ruta'].includes(o.status)).length;
    
    const cashOrders = orders.filter(o => o.paymentMethod === 'efectivo' && o.status === 'entregado');
    const sinpeOrders = orders.filter(o => o.paymentMethod === 'sinpe' && o.status === 'entregado');
    
    const totalCash = cashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalSinpe = sinpeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    return {
      totalOrders,
      deliveredOrders,
      returnedOrders,
      rescheduledOrders,
      pendingOrders,
      totalCash,
      totalSinpe,
      deliveryRate,
    };
  },

  getMessengerStats: async (messengerId: string): Promise<MessengerStats> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const today = new Date().toISOString().split('T')[0];
    const messengerOrders = mockOrders.filter(o => o.assignedMessengerId === messengerId);
    const todayOrders = messengerOrders.filter(o => o.createdAt.startsWith(today));

    const baseStats = await mockApi.getStats({ assignedMessengerId: messengerId });
    
    return {
      ...baseStats,
      assignedToday: todayOrders.length,
      completedToday: todayOrders.filter(o => o.status === 'entregado').length,
      pendingToday: todayOrders.filter(o => ['confirmado', 'en_ruta'].includes(o.status)).length,
      inRouteToday: todayOrders.filter(o => o.status === 'en_ruta').length,
    };
  },

  // Create new order
  createOrder: async (orderData: any): Promise<Order> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newOrder: Order = {
      id: `PMC-${(mockOrders.length + 1).toString().padStart(6, '0')}`, // Default to Para Machos CR
      customerName: orderData.customerName || 'Cliente Nuevo',
      customerPhone: orderData.customerPhone || '50600000000',
      customerAddress: orderData.customerAddress || 'Dirección por definir',
      customerProvince: orderData.customerProvince || 'San José',
      customerCanton: orderData.customerCanton || 'CENTRAL',
      customerDistrict: orderData.customerDistrict || 'CARMEN',
      customerLocationLink: orderData.customerLocationLink,
      items: [],
      totalAmount: parseFloat(orderData.totalAmount) || 0,
      status: 'pendiente',
      paymentMethod: orderData.paymentMethod || 'efectivo',
      origin: 'csv',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryAddress: orderData.deliveryAddress || orderData.customerAddress || '',
      notes: orderData.notes,
      companyId: '1', // Default to Para Machos CR
      company: mockCompanies[0],
      routeSchedule: 'DIA',
    };
    
    mockOrders.unshift(newOrder);
    return newOrder;
  },

  // Process CSV upload for orders
  processCSVUpload: async (csvData: string, companyId: string): Promise<{ success: number; errors: string[] }> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);
    
    let successCount = 0;
    const errors: string[] = [];
    
    // Debug: Log what we're processing
    console.log('CSV Headers found:', headers);
    console.log('CSV Data lines:', dataLines.length);
    
    // Validate headers - more flexible validation
    const requiredHeaders = [
      'FECHA', 'ID', 'NOMBRE', 'PROVINCIA', 'CANTON', 'DISTRITO', 
      'DIRECCION', 'TELEFONO', 'VALOR', 'PRODUCTOS', 'LINK UBICACION', 
      'NOTA ASESOR', 'JORNADA DE RUTA'
    ];
    
    // Check for missing headers with better error reporting
    const missingHeaders = requiredHeaders.filter(requiredHeader => {
      const found = headers.some(header => 
        header.toUpperCase().trim() === requiredHeader.toUpperCase().trim()
      );
      console.log(`Checking header "${requiredHeader}": ${found ? 'FOUND' : 'MISSING'}`);
      return !found;
    });
    
    if (missingHeaders.length > 0) {
      errors.push(`Headers faltantes: ${missingHeaders.join(', ')}`);
      errors.push(`Headers encontrados: ${headers.join(', ')}`);
      errors.push(`Total headers encontrados: ${headers.length}`);
      errors.push(`Total headers requeridos: ${requiredHeaders.length}`);
      return { success: 0, errors };
    }
    
    // Get company info
    const company = mockCompanies.find(c => c.id === companyId);
    if (!company) {
      errors.push('Empresa no encontrada');
      return { success: 0, errors };
    }
    
    // Get company prefix for order IDs
    const companyPrefix = companyId === '1' ? 'PMC' : companyId === '2' ? 'BF' : 'AS';
    
    // Process each line
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;
      
      try {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        // Parse CSV values
        const [
          fecha,
          idCliente,
          nombre,
          provincia,
          canton,
          distrito,
          direccion,
          telefono,
          valor,
          productos,
          linkUbicacion,
          notaAsesor,
          jornadaRuta
        ] = values;
        
        // Validate required fields
        if (!nombre || !direccion || !telefono || !valor) {
          errors.push(`Línea ${i + 2}: Campos requeridos faltantes (nombre, dirección, teléfono, valor)`);
          continue;
        }
        
        // Parse date
        let orderDate: Date;
        try {
          if (fecha.includes('/')) {
            // Format: DD/MM/YYYY
            const [day, month, year] = fecha.split('/');
            orderDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            // Format: YYYY-MM-DD
            orderDate = new Date(fecha);
          }
        } catch (e) {
          orderDate = new Date(); // Use current date if parsing fails
        }
        
        // Create order
        const newOrder: Order = {
          id: `${companyPrefix}-${(mockOrders.length + 1).toString().padStart(6, '0')}`,
          customerName: nombre,
          customerPhone: telefono.replace(/^506/, '506'),
          customerAddress: direccion,
          customerProvince: provincia || 'San José',
          customerCanton: canton || 'CENTRAL',
          customerDistrict: distrito || 'CARMEN',
          customerLocationLink: linkUbicacion || undefined,
          items: [], // Will be populated based on products
          totalAmount: parseFloat(valor) || 0,
          status: 'pendiente',
          paymentMethod: 'efectivo' as PaymentMethod, // Default to cash
          origin: 'csv' as OrderOrigin,
          createdAt: orderDate.toISOString(),
          updatedAt: orderDate.toISOString(),
          notes: notaAsesor || undefined,
          deliveryAddress: direccion,
          companyId: companyId,
          company: company,
          routeSchedule: jornadaRuta || 'DIA',
        };
        
        // Add to orders
        mockOrders.unshift(newOrder);
        successCount++;
        
      } catch (error) {
        errors.push(`Línea ${i + 2}: Error al procesar - ${error}`);
      }
    }
    
    return { success: successCount, errors };
  },

  // ===== INVENTARIO API FUNCTIONS =====

  // Inventory Items
  getInventoryItems: async (filters?: InventoryFilters): Promise<InventoryItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let filteredItems = [...mockInventoryItems];

    if (filters?.companyId) {
      filteredItems = filteredItems.filter(item => item.companyId === filters.companyId);
    }
    if (filters?.productId) {
      filteredItems = filteredItems.filter(item => item.productId === filters.productId);
    }
    if (filters?.category) {
      filteredItems = filteredItems.filter(item => item.product.category === filters.category);
    }
    if (filters?.location) {
      filteredItems = filteredItems.filter(item => 
        item.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    if (filters?.stockStatus) {
      filteredItems = filteredItems.filter(item => {
        const status = getStockStatus(item);
        return status === filters.stockStatus;
      });
    }

    return filteredItems;
  },

  getInventoryItem: async (id: string): Promise<InventoryItem> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const item = mockInventoryItems.find(item => item.id === id);
    if (!item) {
      throw new Error('Item de inventario no encontrado');
    }
    return item;
  },

  createInventoryItem: async (itemData: Partial<InventoryItem>): Promise<InventoryItem> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      productId: itemData.productId || '',
      product: itemData.product || mockProducts[0],
      companyId: itemData.companyId || '',
      company: itemData.company || mockCompanies[0],
      currentStock: itemData.currentStock || 0,
      minimumStock: itemData.minimumStock || 0,
      maximumStock: itemData.maximumStock || 100,
      reservedStock: 0,
      availableStock: itemData.currentStock || 0,
      location: itemData.location,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    mockInventoryItems.push(newItem);
    return newItem;
  },

  updateInventoryItem: async (id: string, itemData: Partial<InventoryItem>): Promise<InventoryItem> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const itemIndex = mockInventoryItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new Error('Item de inventario no encontrado');
    }
    
    const updatedItem = {
      ...mockInventoryItems[itemIndex],
      ...itemData,
      lastUpdated: new Date().toISOString(),
    };
    
    // Recalcular availableStock
    updatedItem.availableStock = updatedItem.currentStock - updatedItem.reservedStock;
    
    mockInventoryItems[itemIndex] = updatedItem;
    return updatedItem;
  },

  // Inventory Transactions
  getInventoryTransactions: async (filters?: InventoryFilters): Promise<InventoryTransaction[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let filteredTransactions = [...mockInventoryTransactions];

    if (filters?.companyId) {
      filteredTransactions = filteredTransactions.filter(trans => 
        trans.inventoryItem.companyId === filters.companyId
      );
    }
    if (filters?.productId) {
      filteredTransactions = filteredTransactions.filter(trans => 
        trans.inventoryItem.productId === filters.productId
      );
    }
    if (filters?.actionType) {
      filteredTransactions = filteredTransactions.filter(trans => 
        trans.actionType === filters.actionType
      );
    }
    if (filters?.dateFrom) {
      filteredTransactions = filteredTransactions.filter(trans => 
        new Date(trans.createdAt) >= new Date(filters.dateFrom!)
      );
    }
    if (filters?.dateTo) {
      filteredTransactions = filteredTransactions.filter(trans => 
        new Date(trans.createdAt) <= new Date(filters.dateTo!)
      );
    }

    return filteredTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  createInventoryTransaction: async (transactionData: Partial<InventoryTransaction>): Promise<InventoryTransaction> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const inventoryItem = mockInventoryItems.find(item => item.id === transactionData.inventoryItemId);
    if (!inventoryItem) {
      throw new Error('Item de inventario no encontrado');
    }

    const previousStock = inventoryItem.currentStock;
    const quantity = transactionData.quantity || 0;
    const newStock = previousStock + quantity;

    // Actualizar el stock del item
    inventoryItem.currentStock = newStock;
    inventoryItem.availableStock = newStock - inventoryItem.reservedStock;
    inventoryItem.lastUpdated = new Date().toISOString();

    const newTransaction: InventoryTransaction = {
      id: `trans-${Date.now()}`,
      inventoryItemId: transactionData.inventoryItemId!,
      inventoryItem,
      actionType: transactionData.actionType!,
      quantity,
      previousStock,
      newStock,
      reason: transactionData.reason,
      referenceId: transactionData.referenceId,
      referenceType: transactionData.referenceType,
      userId: transactionData.userId!,
      user: transactionData.user!,
      createdAt: new Date().toISOString(),
      notes: transactionData.notes,
    };

    mockInventoryTransactions.unshift(newTransaction);
    return newTransaction;
  },

  // Inventory Adjustments
  createInventoryAdjustment: async (adjustmentData: Partial<InventoryAdjustment>): Promise<InventoryAdjustment> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const inventoryItem = mockInventoryItems.find(item => item.id === adjustmentData.inventoryItemId);
    if (!inventoryItem) {
      throw new Error('Item de inventario no encontrado');
    }

    const previousStock = inventoryItem.currentStock;
    const quantityDifference = adjustmentData.quantityDifference || 0;
    const newStock = previousStock + quantityDifference;

    // Actualizar el stock del item
    inventoryItem.currentStock = newStock;
    inventoryItem.availableStock = newStock - inventoryItem.reservedStock;
    inventoryItem.lastUpdated = new Date().toISOString();

    const newAdjustment: InventoryAdjustment = {
      id: `adj-${Date.now()}`,
      inventoryItemId: adjustmentData.inventoryItemId!,
      inventoryItem,
      adjustmentType: adjustmentData.adjustmentType!,
      quantityDifference,
      previousStock,
      newStock,
      reason: adjustmentData.reason!,
      userId: adjustmentData.userId!,
      user: adjustmentData.user!,
      createdAt: new Date().toISOString(),
      notes: adjustmentData.notes,
    };

    // Crear transacción asociada
    await mockApi.createInventoryTransaction({
      inventoryItemId: adjustmentData.inventoryItemId!,
      actionType: 'ajuste',
      quantity: quantityDifference,
      reason: adjustmentData.reason!,
      userId: adjustmentData.userId!,
      user: adjustmentData.user!,
      notes: `Ajuste ${adjustmentData.adjustmentType}: ${adjustmentData.reason}`,
    });

    return newAdjustment;
  },

  // Inventory Alerts
  getInventoryAlerts: async (companyId?: string): Promise<InventoryAlert[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    let filteredAlerts = [...mockInventoryAlerts];

    if (companyId) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.inventoryItem.companyId === companyId
      );
    }

    return filteredAlerts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  markAlertAsRead: async (alertId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const alert = mockInventoryAlerts.find(alert => alert.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  },

  // Inventory Stats
  getInventoryStats: async (companyId?: string): Promise<InventoryStats> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let items = mockInventoryItems;
    if (companyId) {
      items = items.filter(item => item.companyId === companyId);
    }

    const totalProducts = items.length;
    const totalStockValue = items.reduce((sum, item) => 
      sum + (item.currentStock * item.product.price), 0
    );
    
    const lowStockItems = items.filter(item => 
      item.currentStock <= item.minimumStock && item.currentStock > 0
    ).length;
    
    const outOfStockItems = items.filter(item => item.currentStock === 0).length;
    
    const overstockItems = items.filter(item => 
      item.currentStock > item.maximumStock
    ).length;
    
    const totalTransactions = mockInventoryTransactions.length;
    const today = new Date().toISOString().split('T')[0];
    const transactionsToday = mockInventoryTransactions.filter(trans => 
      trans.createdAt.startsWith(today)
    ).length;

    return {
      totalProducts,
      totalStockValue,
      lowStockItems,
      outOfStockItems,
      overstockItems,
      totalTransactions,
      transactionsToday,
      companyId,
    };
  },

  // Automatic inventory management for orders
  processOrderInventory: async (orderId: string, action: 'mount' | 'return' | 'deliver'): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    // Procesar cada item del pedido
    for (const orderItem of order.items) {
      const inventoryItem = mockInventoryItems.find(item => 
        item.productId === orderItem.product.id && item.companyId === order.companyId
      );
      
      if (!inventoryItem) continue;

      let actionType: InventoryActionType;
      let quantity: number;
      let reason: string;

      switch (action) {
        case 'mount':
          actionType = 'pedido_montado';
          quantity = -orderItem.quantity;
          reason = `Pedido ${orderId} montado a ruta`;
          break;
        case 'return':
          actionType = 'pedido_devuelto';
          quantity = orderItem.quantity;
          reason = `Pedido ${orderId} devuelto`;
          break;
        case 'deliver':
          actionType = 'pedido_entregado';
          quantity = 0; // No cambia stock, solo confirma
          reason = `Pedido ${orderId} entregado`;
          break;
        default:
          continue;
      }

      if (action !== 'deliver') {
        await mockApi.createInventoryTransaction({
          inventoryItemId: inventoryItem.id,
          actionType,
          quantity,
          reason,
          referenceId: orderId,
          referenceType: 'order',
          userId: '1', // Admin user
          user: mockUsers[0],
          notes: `Procesamiento automático por ${action}`,
        });
      }
    }
  },

  // Red Logística API
  getRedLogisticOrders: async (filters: RedLogisticFilters = {}): Promise<RedLogisticOrder[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = [...mockRedLogisticOrders];
    
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    
    if (filters.deliveryMethod) {
      filtered = filtered.filter(order => order.deliveryMethod === filters.deliveryMethod);
    }
    
    if (filters.companyId) {
      filtered = filtered.filter(order => order.companyId === filters.companyId);
    }
    
    if (filters.trackingNumber) {
      filtered = filtered.filter(order => 
        order.trackingNumber.toLowerCase().includes(filters.trackingNumber!.toLowerCase())
      );
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(order => order.createdAt >= filters.dateFrom!);
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(order => order.createdAt <= filters.dateTo!);
    }
    
    return filtered;
  },

  getRedLogisticOrder: async (id: string): Promise<RedLogisticOrder> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const order = mockRedLogisticOrders.find(o => o.id === id);
    if (!order) {
      throw new Error('Pedido de Red Logística no encontrado');
    }
    
    return order;
  },

  createRedLogisticOrder: async (orderData: Partial<RedLogisticOrder>): Promise<RedLogisticOrder> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newOrder: RedLogisticOrder = {
      id: `rl-${Date.now()}`,
      orderId: orderData.orderId!,
      order: orderData.order!,
      trackingNumber: orderData.trackingNumber!,
      status: orderData.status || 'pendiente_envio',
      deliveryMethod: orderData.deliveryMethod || 'red_logistic',
      pickupAddress: orderData.pickupAddress!,
      deliveryAddress: orderData.deliveryAddress!,
      estimatedDelivery: orderData.estimatedDelivery!,
      actualDelivery: orderData.actualDelivery,
      weight: orderData.weight!,
      dimensions: orderData.dimensions!,
      declaredValue: orderData.declaredValue!,
      shippingCost: orderData.shippingCost!,
      insuranceCost: orderData.insuranceCost,
      totalCost: orderData.totalCost!,
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: orderData.createdBy!,
      createdByUser: orderData.createdByUser!,
      companyId: orderData.companyId!,
      company: orderData.company!,
    };
    
    mockRedLogisticOrders.push(newOrder);
    return newOrder;
  },

  updateRedLogisticOrderStatus: async (id: string, status: RedLogisticStatus): Promise<RedLogisticOrder> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const orderIndex = mockRedLogisticOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      throw new Error('Pedido de Red Logística no encontrado');
    }
    
    const order = mockRedLogisticOrders[orderIndex];
    order.status = status;
    order.updatedAt = new Date().toISOString();
    
    if (status === 'entregado') {
      order.actualDelivery = new Date().toISOString();
    }
    
    // Crear tracking entry
    const trackingEntry: RedLogisticTracking = {
      id: `track-${Date.now()}`,
      redLogisticOrderId: id,
      redLogisticOrder: order,
      status,
      location: status === 'entregado' ? order.deliveryAddress : 'Centro de Distribución',
      description: getStatusDescription(status),
      timestamp: new Date().toISOString(),
    };
    
    mockRedLogisticTracking.push(trackingEntry);
    
    return order;
  },

  getRedLogisticTracking: async (redLogisticOrderId: string): Promise<RedLogisticTracking[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return mockRedLogisticTracking
      .filter(tracking => tracking.redLogisticOrderId === redLogisticOrderId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  getRedLogisticStats: async (companyId?: string): Promise<RedLogisticStats> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let orders = mockRedLogisticOrders;
    if (companyId) {
      orders = orders.filter(order => order.companyId === companyId);
    }
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pendiente_envio').length;
    const inTransitOrders = orders.filter(o => o.status === 'en_transito').length;
    const deliveredOrders = orders.filter(o => o.status === 'entregado').length;
    const returnedOrders = orders.filter(o => o.status === 'devuelto').length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalCost, 0);
    
    const deliveredOrdersWithTime = orders.filter(o => o.status === 'entregado' && o.actualDelivery);
    const averageDeliveryTime = deliveredOrdersWithTime.length > 0 
      ? deliveredOrdersWithTime.reduce((sum, order) => {
          const created = new Date(order.createdAt).getTime();
          const delivered = new Date(order.actualDelivery!).getTime();
          return sum + (delivered - created) / (1000 * 60 * 60 * 24); // days
        }, 0) / deliveredOrdersWithTime.length
      : 0;
    
    const successRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
    
    return {
      totalOrders,
      pendingOrders,
      inTransitOrders,
      deliveredOrders,
      returnedOrders,
      totalRevenue,
      averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
    };
  },

  // Integración con inventario para Red Logística
  processRedLogisticInventory: async (redLogisticOrderId: string, action: 'ship' | 'deliver' | 'return'): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const redLogisticOrder = mockRedLogisticOrders.find(o => o.id === redLogisticOrderId);
    if (!redLogisticOrder) {
      throw new Error('Pedido de Red Logística no encontrado');
    }

    const order = redLogisticOrder.order;

    for (const orderItem of order.items) {
      const inventoryItem = mockInventoryItems.find(item =>
        item.productId === orderItem.product.id && item.companyId === order.companyId
      );

      if (!inventoryItem) continue;

      let actionType: InventoryActionType;
      let quantity: number;
      let reason: string;

      switch (action) {
        case 'ship':
          actionType = 'red_logistic_enviado';
          quantity = -orderItem.quantity;
          reason = `Pedido ${order.id} enviado por Red Logística`;
          break;
        case 'deliver':
          actionType = 'red_logistic_entregado';
          quantity = 0; // No cambia stock, solo registra
          reason = `Pedido ${order.id} entregado por Red Logística`;
          break;
        case 'return':
          actionType = 'red_logistic_devuelto';
          quantity = orderItem.quantity;
          reason = `Pedido ${order.id} devuelto por Red Logística`;
          break;
        default:
          continue;
      }

      if (action !== 'deliver') {
        await mockApi.createInventoryTransaction({
          inventoryItemId: inventoryItem.id,
          actionType,
          quantity,
          reason,
          referenceId: redLogisticOrderId,
          referenceType: 'red_logistic',
          userId: redLogisticOrder.createdBy,
          user: redLogisticOrder.createdByUser,
          notes: `Procesamiento automático Red Logística por ${action}`,
        });
      }
    }
  },

  // Mock data for route history and expenses
  mockDailyRoutes: [
    {
      id: 'dr-001',
      messengerId: '1',
      messenger: mockUsers[0], // Juan Pérez
      routeDate: '2024-12-12',
      
      totalOrders: 8,
      deliveredOrders: 6,
      returnedOrders: 1,
      pendingOrders: 1,
      
      totalCollected: 125000,
      totalExpenses: 15000,
      netAmount: 110000,
      
      orders: mockOrders.filter(o => o.assignedMessengerId === '1' && o.createdAt.startsWith('2024-12-12')),
      expenses: [
        {
          id: 'exp-001',
          routeId: 'dr-001',
          messengerId: '1',
          messenger: mockUsers[0],
          amount: 8000,
          description: 'Combustible para la ruta',
          category: 'combustible' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300'],
          createdAt: '2024-12-12T08:30:00Z',
          updatedAt: '2024-12-12T08:30:00Z',
        },
        {
          id: 'exp-002',
          routeId: 'dr-001',
          messengerId: '1',
          messenger: mockUsers[0],
          amount: 3000,
          description: 'Almuerzo',
          category: 'alimentacion' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300'],
          createdAt: '2024-12-12T12:00:00Z',
          updatedAt: '2024-12-12T12:00:00Z',
        },
        {
          id: 'exp-003',
          routeId: 'dr-001',
          messengerId: '1',
          messenger: mockUsers[0],
          amount: 4000,
          description: 'Peaje autopista',
          category: 'peaje' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300'],
          createdAt: '2024-12-12T14:15:00Z',
          updatedAt: '2024-12-12T14:15:00Z',
        },
      ] as RouteExpense[],
      
      createdAt: '2024-12-12T08:00:00Z',
      updatedAt: '2024-12-12T18:30:00Z',
      notes: 'Ruta exitosa, un pedido devuelto por cliente no disponible',
      
      companyId: '1',
      company: mockCompanies[0],
    },
    {
      id: 'dr-002',
      messengerId: '1',
      messenger: mockUsers[0], // Juan Pérez
      routeDate: '2024-12-11',
      
      totalOrders: 6,
      deliveredOrders: 6,
      returnedOrders: 0,
      pendingOrders: 0,
      
      totalCollected: 98000,
      totalExpenses: 12000,
      netAmount: 86000,
      
      orders: mockOrders.filter(o => o.assignedMessengerId === '1' && o.createdAt.startsWith('2024-12-11')),
      expenses: [
        {
          id: 'exp-004',
          routeId: 'dr-002',
          messengerId: '1',
          messenger: mockUsers[0],
          amount: 7000,
          description: 'Combustible',
          category: 'combustible' as const,
          date: '2024-12-11',
          images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300'],
          createdAt: '2024-12-11T08:00:00Z',
          updatedAt: '2024-12-11T08:00:00Z',
        },
        {
          id: 'exp-005',
          routeId: 'dr-002',
          messengerId: '1',
          messenger: mockUsers[0],
          amount: 5000,
          description: 'Mantenimiento menor del vehículo',
          category: 'mantenimiento' as const,
          date: '2024-12-11',
          images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08c3?w=300'],
          createdAt: '2024-12-11T16:00:00Z',
          updatedAt: '2024-12-11T16:00:00Z',
        },
      ] as RouteExpense[],
      
      createdAt: '2024-12-11T08:00:00Z',
      updatedAt: '2024-12-11T18:00:00Z',
      notes: 'Ruta perfecta, todos los pedidos entregados',
      
      companyId: '1',
      company: mockCompanies[0],
    },
    {
      id: 'dr-003',
      messengerId: '2',
      messenger: mockUsers[1], // Luis González
      routeDate: '2024-12-12',
      
      totalOrders: 5,
      deliveredOrders: 4,
      returnedOrders: 0,
      pendingOrders: 1,
      
      totalCollected: 89000,
      totalExpenses: 10000,
      netAmount: 79000,
      
      orders: mockOrders.filter(o => o.assignedMessengerId === '2' && o.createdAt.startsWith('2024-12-12')),
      expenses: [
        {
          id: 'exp-006',
          routeId: 'dr-003',
          messengerId: '2',
          messenger: mockUsers[1],
          amount: 6000,
          description: 'Combustible',
          category: 'combustible' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300'],
          createdAt: '2024-12-12T09:00:00Z',
          updatedAt: '2024-12-12T09:00:00Z',
        },
        {
          id: 'exp-007',
          routeId: 'dr-003',
          messengerId: '2',
          messenger: mockUsers[1],
          amount: 4000,
          description: 'Desayuno y almuerzo',
          category: 'alimentacion' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300'],
          createdAt: '2024-12-12T11:30:00Z',
          updatedAt: '2024-12-12T11:30:00Z',
        },
      ] as RouteExpense[],
      
      createdAt: '2024-12-12T08:30:00Z',
      updatedAt: '2024-12-12T17:45:00Z',
      notes: 'Ruta en proceso, un pedido pendiente por reagendar',
      
      companyId: '1',
      company: mockCompanies[0],
    },
    // Rutas adicionales para nuevos mensajeros
    {
      id: 'dr-004',
      messengerId: '10',
      messenger: mockUsers[9], // Carlos Rodríguez
      routeDate: '2024-12-12',
      
      totalOrders: 7,
      deliveredOrders: 6,
      returnedOrders: 1,
      pendingOrders: 0,
      
      totalCollected: 145000,
      totalExpenses: 18000,
      netAmount: 127000,
      
      orders: mockOrders.filter(o => o.assignedMessengerId === '10' && o.createdAt.startsWith('2024-12-12')),
      expenses: [
        {
          id: 'exp-008',
          routeId: 'dr-004',
          messengerId: '10',
          messenger: mockUsers[9],
          amount: 10000,
          description: 'Combustible para ruta larga',
          category: 'combustible' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300'],
          createdAt: '2024-12-12T07:30:00Z',
          updatedAt: '2024-12-12T07:30:00Z',
        },
        {
          id: 'exp-009',
          routeId: 'dr-004',
          messengerId: '10',
          messenger: mockUsers[9],
          amount: 5000,
          description: 'Almuerzo y refrigerio',
          category: 'alimentacion' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300'],
          createdAt: '2024-12-12T12:00:00Z',
          updatedAt: '2024-12-12T12:00:00Z',
        },
        {
          id: 'exp-010',
          routeId: 'dr-004',
          messengerId: '10',
          messenger: mockUsers[9],
          amount: 3000,
          description: 'Peaje y parqueo',
          category: 'peaje' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300'],
          createdAt: '2024-12-12T15:30:00Z',
          updatedAt: '2024-12-12T15:30:00Z',
        },
      ] as RouteExpense[],
      
      createdAt: '2024-12-12T07:00:00Z',
      updatedAt: '2024-12-12T19:00:00Z',
      notes: 'Ruta exitosa con un pedido devuelto por dirección incorrecta',
      
      companyId: '1',
      company: mockCompanies[0],
    },
    {
      id: 'dr-005',
      messengerId: '11',
      messenger: mockUsers[10], // Sofía Herrera
      routeDate: '2024-12-12',
      
      totalOrders: 5,
      deliveredOrders: 5,
      returnedOrders: 0,
      pendingOrders: 0,
      
      totalCollected: 95000,
      totalExpenses: 12000,
      netAmount: 83000,
      
      orders: mockOrders.filter(o => o.assignedMessengerId === '11' && o.createdAt.startsWith('2024-12-12')),
      expenses: [
        {
          id: 'exp-011',
          routeId: 'dr-005',
          messengerId: '11',
          messenger: mockUsers[10],
          amount: 8000,
          description: 'Combustible',
          category: 'combustible' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300'],
          createdAt: '2024-12-12T08:00:00Z',
          updatedAt: '2024-12-12T08:00:00Z',
        },
        {
          id: 'exp-012',
          routeId: 'dr-005',
          messengerId: '11',
          messenger: mockUsers[10],
          amount: 4000,
          description: 'Desayuno y almuerzo',
          category: 'alimentacion' as const,
          date: '2024-12-12',
          images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300'],
          createdAt: '2024-12-12T11:00:00Z',
          updatedAt: '2024-12-12T11:00:00Z',
        },
      ] as RouteExpense[],
      
      createdAt: '2024-12-12T08:00:00Z',
      updatedAt: '2024-12-12T18:00:00Z',
      notes: 'Ruta perfecta, todos los pedidos entregados exitosamente',
      
      companyId: '2',
      company: mockCompanies[1],
    },
    {
      id: 'dr-006',
      messengerId: '12',
      messenger: mockUsers[11], // Miguel Torres
      routeDate: '2024-12-11',
      
      totalOrders: 6,
      deliveredOrders: 5,
      returnedOrders: 0,
      pendingOrders: 1,
      
      totalCollected: 110000,
      totalExpenses: 15000,
      netAmount: 95000,
      
      orders: mockOrders.filter(o => o.assignedMessengerId === '12' && o.createdAt.startsWith('2024-12-11')),
      expenses: [
        {
          id: 'exp-013',
          routeId: 'dr-006',
          messengerId: '12',
          messenger: mockUsers[11],
          amount: 9000,
          description: 'Combustible',
          category: 'combustible' as const,
          date: '2024-12-11',
          images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300'],
          createdAt: '2024-12-11T08:30:00Z',
          updatedAt: '2024-12-11T08:30:00Z',
        },
        {
          id: 'exp-014',
          routeId: 'dr-006',
          messengerId: '12',
          messenger: mockUsers[11],
          amount: 6000,
          description: 'Mantenimiento de frenos',
          category: 'mantenimiento' as const,
          date: '2024-12-11',
          images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08c3?w=300'],
          createdAt: '2024-12-11T16:00:00Z',
          updatedAt: '2024-12-11T16:00:00Z',
        },
      ] as RouteExpense[],
      
      createdAt: '2024-12-11T08:30:00Z',
      updatedAt: '2024-12-11T18:30:00Z',
      notes: 'Ruta con un pedido pendiente por reagendar',
      
      companyId: '3',
      company: mockCompanies[2],
    },
    {
      id: 'dr-007',
      messengerId: '13',
      messenger: mockUsers[12], // Laura Vargas
      routeDate: '2024-12-10',
      
      totalOrders: 4,
      deliveredOrders: 4,
      returnedOrders: 0,
      pendingOrders: 0,
      
      totalCollected: 78000,
      totalExpenses: 9000,
      netAmount: 69000,
      
      orders: mockOrders.filter(o => o.assignedMessengerId === '13' && o.createdAt.startsWith('2024-12-10')),
      expenses: [
        {
          id: 'exp-015',
          routeId: 'dr-007',
          messengerId: '13',
          messenger: mockUsers[12],
          amount: 6000,
          description: 'Combustible',
          category: 'combustible' as const,
          date: '2024-12-10',
          images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300'],
          createdAt: '2024-12-10T09:00:00Z',
          updatedAt: '2024-12-10T09:00:00Z',
        },
        {
          id: 'exp-016',
          routeId: 'dr-007',
          messengerId: '13',
          messenger: mockUsers[12],
          amount: 3000,
          description: 'Almuerzo',
          category: 'alimentacion' as const,
          date: '2024-12-10',
          images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300'],
          createdAt: '2024-12-10T12:30:00Z',
          updatedAt: '2024-12-10T12:30:00Z',
        },
      ] as RouteExpense[],
      
      createdAt: '2024-12-10T09:00:00Z',
      updatedAt: '2024-12-10T17:00:00Z',
      notes: 'Ruta corta pero eficiente, todos los pedidos entregados',
      
      companyId: '1',
      company: mockCompanies[0],
    },
  ],

  // Route Liquidation API functions
  getRouteLiquidations: async (filters?: RouteLiquidationFilters): Promise<RouteLiquidation[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let filteredLiquidations = [...mockRouteLiquidations];

    if (filters?.messengerId) {
      filteredLiquidations = filteredLiquidations.filter(l => l.messengerId === filters.messengerId);
    }
    if (filters?.status) {
      filteredLiquidations = filteredLiquidations.filter(l => l.status === filters.status);
    }
    if (filters?.companyId) {
      filteredLiquidations = filteredLiquidations.filter(l => l.companyId === filters.companyId);
    }
    if (filters?.dateFrom) {
      filteredLiquidations = filteredLiquidations.filter(l => l.routeDate >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filteredLiquidations = filteredLiquidations.filter(l => l.routeDate <= filters.dateTo!);
    }

    return filteredLiquidations;
  },

  getRouteLiquidation: async (id: string): Promise<RouteLiquidation> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const liquidation = mockRouteLiquidations.find(l => l.id === id);
    if (!liquidation) {
      throw new Error('Liquidación de ruta no encontrada');
    }
    return liquidation;
  },

  createRouteLiquidation: async (data: Partial<RouteLiquidation>): Promise<RouteLiquidation> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newLiquidation: RouteLiquidation = {
      id: `rl-${Date.now()}`,
      messengerId: data.messengerId!,
      messenger: data.messenger!,
      routeDate: data.routeDate!,
      status: 'pendiente',
      
      totalCollected: data.totalCollected || 0,
      totalSpent: data.totalSpent || 0,
      totalToDeliver: data.totalToDeliver || 0,
      
      totalOrders: data.totalOrders || 0,
      deliveredOrders: data.deliveredOrders || 0,
      returnedOrders: data.returnedOrders || 0,
      pendingOrders: data.pendingOrders || 0,
      
      orders: data.orders || [],
      cashOrders: data.cashOrders || [],
      sinpeOrders: data.sinpeOrders || [],
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      notes: data.notes,
      
      companyId: data.companyId!,
      company: data.company!,
    };

    mockRouteLiquidations.push(newLiquidation);
    return newLiquidation;
  },

  finalizeRoute: async (liquidationId: string, notes?: string): Promise<RouteLiquidation> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const liquidation = mockRouteLiquidations.find(l => l.id === liquidationId);
    if (!liquidation) {
      throw new Error('Liquidación de ruta no encontrada');
    }

    // Verificar que todos los pedidos tengan un estado final
    const pendingOrders = liquidation.orders.filter((o: Order) => 
      !['entregado', 'devolucion', 'reagendado'].includes(o.status)
    );

    if (pendingOrders.length > 0) {
      throw new Error('No se puede finalizar la ruta. Hay pedidos sin estado final.');
    }

    liquidation.status = 'finalizada';
    liquidation.finalizedAt = new Date().toISOString();
    liquidation.updatedAt = new Date().toISOString();
    if (notes) liquidation.notes = notes;

    return liquidation;
  },

  liquidateRoute: async (liquidationId: string, adminNotes?: string): Promise<RouteLiquidation> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const liquidation = mockRouteLiquidations.find(l => l.id === liquidationId);
    if (!liquidation) {
      throw new Error('Liquidación de ruta no encontrada');
    }

    if (liquidation.status !== 'finalizada') {
      throw new Error('Solo se pueden liquidar rutas finalizadas');
    }

    liquidation.status = 'liquidada';
    liquidation.liquidatedAt = new Date().toISOString();
    liquidation.liquidatedBy = '1'; // Admin user
    liquidation.liquidatedByUser = mockUsers[0];
    liquidation.updatedAt = new Date().toISOString();
    if (adminNotes) liquidation.adminNotes = adminNotes;

    return liquidation;
  },

  getRouteLiquidationStats: async (): Promise<RouteLiquidationStats> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const today = new Date().toISOString().split('T')[0];
    const todayLiquidations = mockRouteLiquidations.filter(l => l.routeDate === today);
    
    const totalRoutes = mockRouteLiquidations.length;
    const pendingLiquidation = mockRouteLiquidations.filter(l => l.status === 'finalizada').length;
    const finalizedToday = todayLiquidations.filter(l => l.status === 'finalizada').length;
    const liquidatedToday = todayLiquidations.filter(l => l.status === 'liquidada').length;
    
    const totalCollectedToday = todayLiquidations.reduce((sum, l) => sum + l.totalCollected, 0);
    const totalSpentToday = todayLiquidations.reduce((sum, l) => sum + l.totalSpent, 0);
    const totalToDeliverToday = todayLiquidations.reduce((sum, l) => sum + l.totalToDeliver, 0);
    
    // Agrupar por mensajero
    const byMessenger = mockRouteLiquidations.reduce((acc: any[], liquidation) => {
      const existing = acc.find(item => item.messengerId === liquidation.messengerId);
      if (existing) {
        existing.routesCount++;
        existing.totalCollected += liquidation.totalCollected;
        existing.totalSpent += liquidation.totalSpent;
      } else {
        acc.push({
          messengerId: liquidation.messengerId,
          messenger: liquidation.messenger,
          routesCount: 1,
          totalCollected: liquidation.totalCollected,
          totalSpent: liquidation.totalSpent,
        });
      }
      return acc;
    }, []);

    return {
      totalRoutes,
      pendingLiquidation,
      finalizedToday,
      liquidatedToday,
      totalCollectedToday,
      totalSpentToday,
      totalToDeliverToday,
      byMessenger,
    };
  },

  // Route History API functions
  getDailyRoutes: async (filters?: RouteHistoryFilters): Promise<DailyRoute[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let filteredRoutes = [...mockApi.mockDailyRoutes];

    if (filters?.messengerId) {
      filteredRoutes = filteredRoutes.filter(r => r.messengerId === filters.messengerId);
    }
    if (filters?.companyId) {
      filteredRoutes = filteredRoutes.filter(r => r.companyId === filters.companyId);
    }
    if (filters?.dateFrom) {
      filteredRoutes = filteredRoutes.filter(r => r.routeDate >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filteredRoutes = filteredRoutes.filter(r => r.routeDate <= filters.dateTo!);
    }

    return filteredRoutes;
  },

  getDailyRoute: async (id: string): Promise<DailyRoute> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const route = mockApi.mockDailyRoutes.find(r => r.id === id);
    if (!route) {
      throw new Error('Ruta no encontrada');
    }
    return route;
  },

  createRouteExpense: async (data: Partial<RouteExpense>): Promise<RouteExpense> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newExpense: RouteExpense = {
      id: `exp-${Date.now()}`,
      routeId: data.routeId!,
      messengerId: data.messengerId!,
      messenger: data.messenger!,
      amount: data.amount!,
      description: data.description!,
      category: data.category!,
      date: data.date!,
      images: data.images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Añadir el gasto a la ruta correspondiente
    const route = mockApi.mockDailyRoutes.find(r => r.id === data.routeId);
    if (route) {
      route.expenses.push(newExpense as RouteExpense);
      route.totalExpenses += newExpense.amount;
      route.netAmount = route.totalCollected - route.totalExpenses;
      route.updatedAt = new Date().toISOString();
    }

    return newExpense as RouteExpense;
  },

  updateRouteExpense: async (id: string, data: Partial<RouteExpense>): Promise<RouteExpense> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const route = mockApi.mockDailyRoutes.find(r => r.expenses.some(e => e.id === id));
    if (!route) {
      throw new Error('Gasto no encontrado');
    }

    const expense = route.expenses.find(e => e.id === id);
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    const oldAmount = expense.amount;
    
    // Actualizar el gasto
    Object.assign(expense, data, {
      updatedAt: new Date().toISOString(),
    });

    // Actualizar totales de la ruta
    route.totalExpenses = route.totalExpenses - oldAmount + expense.amount;
    route.netAmount = route.totalCollected - route.totalExpenses;
    route.updatedAt = new Date().toISOString();

    return expense;
  },

  deleteRouteExpense: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const route = mockApi.mockDailyRoutes.find(r => r.expenses.some(e => e.id === id));
    if (!route) {
      throw new Error('Gasto no encontrado');
    }

    const expense = route.expenses.find(e => e.id === id);
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // Remover el gasto
    route.expenses = route.expenses.filter(e => e.id !== id);
    route.totalExpenses -= expense.amount;
    route.netAmount = route.totalCollected - route.totalExpenses;
    route.updatedAt = new Date().toISOString();
  },

  getRouteHistoryStats: async (messengerId?: string): Promise<RouteHistoryStats> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let routes = mockApi.mockDailyRoutes;
    if (messengerId) {
      routes = routes.filter(r => r.messengerId === messengerId);
    }

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const thisWeekRoutes = routes.filter(r => new Date(r.routeDate) >= weekAgo);
    const thisMonthRoutes = routes.filter(r => new Date(r.routeDate) >= monthAgo);

    const totalRoutes = routes.length;
    const totalDelivered = routes.reduce((sum, r) => sum + r.deliveredOrders, 0);
    const totalCollected = routes.reduce((sum, r) => sum + r.totalCollected, 0);
    const totalExpenses = routes.reduce((sum, r) => sum + r.totalExpenses, 0);
    const netAmount = totalCollected - totalExpenses;

    // Agrupar gastos por categoría
    const expensesByCategory = routes.reduce((acc: any[], route) => {
      route.expenses.forEach(expense => {
        const existing = acc.find(item => item.category === expense.category);
        if (existing) {
          existing.amount += expense.amount;
          existing.count++;
        } else {
          acc.push({
            category: expense.category,
            amount: expense.amount,
            count: 1,
          });
        }
      });
      return acc;
    }, []);

    return {
      totalRoutes,
      totalDelivered,
      totalCollected,
      totalExpenses,
      netAmount,
      thisWeek: {
        routes: thisWeekRoutes.length,
        delivered: thisWeekRoutes.reduce((sum, r) => sum + r.deliveredOrders, 0),
        collected: thisWeekRoutes.reduce((sum, r) => sum + r.totalCollected, 0),
        expenses: thisWeekRoutes.reduce((sum, r) => sum + r.totalExpenses, 0),
      },
      thisMonth: {
        routes: thisMonthRoutes.length,
        delivered: thisMonthRoutes.reduce((sum, r) => sum + r.deliveredOrders, 0),
        collected: thisMonthRoutes.reduce((sum, r) => sum + r.totalCollected, 0),
        expenses: thisMonthRoutes.reduce((sum, r) => sum + r.totalExpenses, 0),
      },
      expensesByCategory,
    };
  },

  // Route Management API functions
  getOrdersForRouteCreation: async (routeDate: string, companyId?: string): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Crear pedidos del día de hoy si no existen
    const today = new Date().toISOString().split('T')[0];
    if (routeDate === today) {
      // Añadir pedidos del día de hoy
      const todayOrders = [
        {
          id: 'TODAY-001',
          customerName: 'María González',
          customerPhone: '50688881111',
          customerAddress: 'Residencial Los Laureles, Casa 15',
          customerProvince: 'San José',
          customerCanton: 'SANTA ANA',
          customerDistrict: 'SANTA ANA',
          customerLocationLink: 'https://maps.app.goo.gl/example_today1',
          
          items: generateOrderItems(2),
          totalAmount: 35000,
          status: 'confirmado' as OrderStatus,
          paymentMethod: 'efectivo' as PaymentMethod,
          origin: 'csv' as OrderOrigin,
          createdAt: today + 'T08:00:00Z',
          updatedAt: today + 'T08:00:00Z',
          
          advisorId: '2',
          advisor: mockUsers[1],
          
          notes: 'Cliente solicita entrega en la mañana',
          deliveryAddress: 'Residencial Los Laureles, Casa 15',
          
          companyId: '1',
          company: mockCompanies[0],
          routeSchedule: 'DIA',
        },
        {
          id: 'TODAY-002',
          customerName: 'Carlos Rodríguez',
          customerPhone: '50688882222',
          customerAddress: 'Condominio Vista Hermosa, Apto 8B',
          customerProvince: 'Alajuela',
          customerCanton: 'ALAJUELA',
          customerDistrict: 'ALAJUELA',
          customerLocationLink: 'https://maps.app.goo.gl/example_today2',
          
          items: generateOrderItems(3),
          totalAmount: 42000,
          status: 'confirmado' as OrderStatus,
          paymentMethod: 'sinpe' as PaymentMethod,
          origin: 'csv' as OrderOrigin,
          createdAt: today + 'T09:30:00Z',
          updatedAt: today + 'T09:30:00Z',
          
          advisorId: '2',
          advisor: mockUsers[1],
          
          notes: 'Cliente confirmó pago por SINPE',
          deliveryAddress: 'Condominio Vista Hermosa, Apto 8B',
          
          companyId: '1',
          company: mockCompanies[0],
          routeSchedule: 'DIA',
        },
        {
          id: 'TODAY-003',
          customerName: 'Ana Martínez',
          customerPhone: '50688883333',
          customerAddress: 'Urbanización El Prado, Casa 22',
          customerProvince: 'Cartago',
          customerCanton: 'CARTAGO',
          customerDistrict: 'ORIENTAL',
          customerLocationLink: 'https://maps.app.goo.gl/example_today3',
          
          items: generateOrderItems(1),
          totalAmount: 18000,
          status: 'confirmado' as OrderStatus,
          paymentMethod: 'efectivo' as PaymentMethod,
          origin: 'csv' as OrderOrigin,
          createdAt: today + 'T10:15:00Z',
          updatedAt: today + 'T10:15:00Z',
          
          advisorId: '15',
          advisor: mockUsers[14],
          
          notes: 'Pedido urgente para esta tarde',
          deliveryAddress: 'Urbanización El Prado, Casa 22',
          
          companyId: '2',
          company: mockCompanies[1],
          routeSchedule: 'DIA',
        },
        {
          id: 'TODAY-004',
          customerName: 'Roberto Silva',
          customerPhone: '50688884444',
          customerAddress: 'Residencial Los Robles, Casa 45',
          customerProvince: 'Heredia',
          customerCanton: 'HEREDIA',
          customerDistrict: 'HEREDIA',
          customerLocationLink: 'https://maps.app.goo.gl/example_today4',
          
          items: generateOrderItems(4),
          totalAmount: 55000,
          status: 'confirmado' as OrderStatus,
          paymentMethod: 'efectivo' as PaymentMethod,
          origin: 'csv' as OrderOrigin,
          createdAt: today + 'T11:00:00Z',
          updatedAt: today + 'T11:00:00Z',
          
          advisorId: '16',
          advisor: mockUsers[15],
          
          notes: 'Cliente prefiere entrega en la tarde',
          deliveryAddress: 'Residencial Los Robles, Casa 45',
          
          companyId: '3',
          company: mockCompanies[2],
          routeSchedule: 'DIA',
        },
        {
          id: 'TODAY-005',
          customerName: 'Laura Herrera',
          customerPhone: '50688885555',
          customerAddress: 'Condominio Las Palmas, Apto 12C',
          customerProvince: 'San José',
          customerCanton: 'CURRIDABAT',
          customerDistrict: 'CURRIDABAT',
          customerLocationLink: 'https://maps.app.goo.gl/example_today5',
          
          items: generateOrderItems(2),
          totalAmount: 28000,
          status: 'confirmado' as OrderStatus,
          paymentMethod: 'sinpe' as PaymentMethod,
          origin: 'csv' as OrderOrigin,
          createdAt: today + 'T12:30:00Z',
          updatedAt: today + 'T12:30:00Z',
          
          advisorId: '2',
          advisor: mockUsers[1],
          
          notes: 'Entregar en la recepción del condominio',
          deliveryAddress: 'Condominio Las Palmas, Apto 12C',
          
          companyId: '1',
          company: mockCompanies[0],
          routeSchedule: 'DIA',
        },
        {
          id: 'TODAY-006',
          customerName: 'Miguel Torres',
          customerPhone: '50688886666',
          customerAddress: 'Residencial El Bosque, Casa 78',
          customerProvince: 'San José',
          customerCanton: 'ESCAZU',
          customerDistrict: 'ESCAZU',
          customerLocationLink: 'https://maps.app.goo.gl/example_today6',
          
          items: generateOrderItems(3),
          totalAmount: 45000,
          status: 'confirmado' as OrderStatus,
          paymentMethod: 'efectivo' as PaymentMethod,
          origin: 'csv' as OrderOrigin,
          createdAt: today + 'T13:45:00Z',
          updatedAt: today + 'T13:45:00Z',
          
          advisorId: '15',
          advisor: mockUsers[14],
          
          notes: 'Cliente no disponible hasta las 3 PM',
          deliveryAddress: 'Residencial El Bosque, Casa 78',
          
          companyId: '2',
          company: mockCompanies[1],
          routeSchedule: 'DIA',
        },
        {
          id: 'TODAY-007',
          customerName: 'Patricia López',
          customerPhone: '50688887777',
          customerAddress: 'Urbanización Los Pinos, Casa 23',
          customerProvince: 'Alajuela',
          customerCanton: 'ALAJUELA',
          customerDistrict: 'ALAJUELA',
          customerLocationLink: 'https://maps.app.goo.gl/example_today7',
          
          items: generateOrderItems(1),
          totalAmount: 15000,
          status: 'reagendado' as OrderStatus,
          paymentMethod: 'efectivo' as PaymentMethod,
          origin: 'csv' as OrderOrigin,
          createdAt: today + 'T14:20:00Z',
          updatedAt: today + 'T14:20:00Z',
          
          advisorId: '16',
          advisor: mockUsers[15],
          
          notes: 'Cliente solicitó reagendar para mañana',
          deliveryAddress: 'Urbanización Los Pinos, Casa 23',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          
          companyId: '3',
          company: mockCompanies[2],
          routeSchedule: 'DIA',
        },
        {
          id: 'TODAY-008',
          customerName: 'Diego Vargas',
          customerPhone: '50688888888',
          customerAddress: 'Condominio Vista Verde, Apto 5B',
          customerProvince: 'San José',
          customerCanton: 'TIBAS',
          customerDistrict: 'TIBAS',
          customerLocationLink: 'https://maps.app.goo.gl/example_today8',
          
          items: generateOrderItems(2),
          totalAmount: 32000,
          status: 'confirmado' as OrderStatus,
          paymentMethod: 'sinpe' as PaymentMethod,
          origin: 'csv' as OrderOrigin,
          createdAt: today + 'T15:10:00Z',
          updatedAt: today + 'T15:10:00Z',
          
          advisorId: '2',
          advisor: mockUsers[1],
          
          notes: 'Pedido de último minuto',
          deliveryAddress: 'Condominio Vista Verde, Apto 5B',
          
          companyId: '1',
          company: mockCompanies[0],
          routeSchedule: 'DIA',
        }
      ];
      
      // Añadir estos pedidos al array de pedidos mock
      mockOrders.unshift(...todayOrders);
    }
    
    // Obtener pedidos con fecha igual a la fecha de ruta
    const filteredOrders = mockOrders.filter(order => {
      const orderDate = order.createdAt.split('T')[0];
      const isToday = orderDate === routeDate;
      const isRescheduled = order.status === 'reagendado' && order.scheduledDate && 
        order.scheduledDate.split('T')[0] === routeDate;
      
      return (isToday || isRescheduled) && (!companyId || order.companyId === companyId);
    });

    return filteredOrders;
  },

  groupOrdersByZone: async (orders: Order[]): Promise<ZoneGroup[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Obtener todos los mensajeros disponibles
    const allMessengers = mockUsers.filter(user => user.role === 'mensajero' && user.isActive);
    
    // Calcular cuántos grupos de 30 pedidos necesitamos
    const totalOrders = orders.length;
    const ordersPerMessenger = 30;
    const totalGroups = Math.ceil(totalOrders / ordersPerMessenger);
    
    // Crear grupos de 30 pedidos cada uno
    const zoneGroups: ZoneGroup[] = [];
    
    for (let i = 0; i < totalGroups; i++) {
      const startIndex = i * ordersPerMessenger;
      const endIndex = Math.min(startIndex + ordersPerMessenger, totalOrders);
      const groupOrders = orders.slice(startIndex, endIndex);
      
      if (groupOrders.length === 0) break;
      
      // Asignar mensajero de forma rotativa
      const messenger = allMessengers[i % allMessengers.length];
      
      // Determinar la ruta principal del grupo basada en los pedidos
      const routeCounts: { [key: string]: number } = {};
      groupOrders.forEach(order => {
        const canton = order.customerCanton || 'SIN ZONA';
        const routeInfo = getRouteForCanton(canton);
        const routeKey = routeInfo ? routeInfo.route : 'SIN RUTA';
        routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
      });
      
      // La ruta principal es la que tiene más pedidos en este grupo
      const mainRoute = Object.keys(routeCounts).reduce((a, b) => 
        routeCounts[a] > routeCounts[b] ? a : b
      );
      
      const totalAmount = groupOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      zoneGroups.push({
        zone: `Grupo ${i + 1} - Ruta ${mainRoute}`,
        orders: groupOrders,
        totalAmount,
        totalOrders: groupOrders.length,
        assignedMessengerId: messenger.id,
        assignedMessenger: messenger,
      });
    }

    return zoneGroups.sort((a, b) => b.totalOrders - a.totalOrders);
  },

  assignOrdersToMessengers: async (routeDate: string, companyId?: string): Promise<{
    assignments: RouteAssignment[];
    unassignedOrders: UnassignedOrder[];
  }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const orders = await mockApi.getOrdersForRouteCreation(routeDate, companyId);
    const zoneGroups = await mockApi.groupOrdersByZone(orders);
    
    const assignments: RouteAssignment[] = [];
    const unassignedOrders: UnassignedOrder[] = [];
    
    // Verificar que cada grupo tenga exactamente 30 pedidos (excepto el último)
    zoneGroups.forEach((group, index) => {
      if (group.assignedMessenger) {
        // Asignar todos los pedidos del grupo al mensajero asignado
        group.orders.forEach(order => {
          order.assignedMessengerId = group.assignedMessenger!.id;
          order.assignedMessenger = group.assignedMessenger!;
        });
        
        assignments.push({
          id: `route-${routeDate}-${group.assignedMessenger.id}-${index + 1}`,
          routeDate,
          messengerId: group.assignedMessenger.id,
          messenger: group.assignedMessenger,
          orders: group.orders,
          totalOrders: group.orders.length,
          assignedOrders: group.orders.length,
          unassignedOrders: 0,
          status: 'assigned',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          companyId: group.orders[0]?.companyId || '1',
          company: group.orders[0]?.company || mockCompanies[0],
        });
      } else {
        // No hay mensajeros disponibles para esta ruta
        group.orders.forEach(order => {
          unassignedOrders.push({
            order,
            reason: 'no_messenger_available',
          });
        });
      }
    });
    
    return { assignments, unassignedOrders };
  },

  changeOrderAssignment: async (orderId: string, newMessengerId: string): Promise<Order> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }
    
    const newMessenger = mockUsers.find(u => u.id === newMessengerId);
    if (!newMessenger) {
      throw new Error('Mensajero no encontrado');
    }
    
    order.assignedMessengerId = newMessengerId;
    order.assignedMessenger = newMessenger;
    order.updatedAt = new Date().toISOString();
    
    return order;
  },

  getRouteMessengerStats: async (filters: RouteManagementFilters): Promise<RouteMessengerStats[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const messengers = mockUsers.filter(user => user.role === 'mensajero' && user.isActive);
    const stats: RouteMessengerStats[] = [];
    
    // Crear datos de ejemplo para el día de hoy si no hay filtros de fecha
    const today = new Date().toISOString().split('T')[0];
    const isToday = !filters.dateFrom && !filters.dateTo;
    
    messengers.forEach((messenger, index) => {
      // Filtrar pedidos por mensajero y fechas
      let messengerOrders = mockOrders.filter(order => 
        order.assignedMessengerId === messenger.id
      );
      
      if (filters.dateFrom) {
        messengerOrders = messengerOrders.filter(order => 
          order.createdAt >= filters.dateFrom!
        );
      }
      
      if (filters.dateTo) {
        messengerOrders = messengerOrders.filter(order => 
          order.createdAt <= filters.dateTo!
        );
      }
      
      if (filters.companyId) {
        messengerOrders = messengerOrders.filter(order => 
          order.companyId === filters.companyId
        );
      }
      
      // Si es el día de hoy y no hay pedidos, crear datos de ejemplo
      if (isToday && messengerOrders.length === 0) {
        // Simular exactamente 30 pedidos asignados para el día de hoy
        const mockTodayOrders = [];
        for (let i = 1; i <= 30; i++) {
          mockTodayOrders.push({
            id: `TODAY-${messenger.id}-${i.toString().padStart(3, '0')}`,
            totalAmount: 20000 + (index * 1000) + (i * 500),
            status: i <= 25 ? 'entregado' : (i <= 28 ? 'confirmado' : 'reagendado'),
            paymentMethod: i % 3 === 0 ? 'sinpe' : 'efectivo',
            createdAt: today + `T${(8 + Math.floor(i / 4)).toString().padStart(2, '0')}:${(i % 4 * 15).toString().padStart(2, '0')}:00Z`,
          });
        }
        
        messengerOrders = mockTodayOrders as any[];
      }
      
      // Calcular estadísticas
      const assignedOrders = messengerOrders.length;
      const deliveredOrders = messengerOrders.filter(o => o.status === 'entregado').length;
      const returnedOrders = messengerOrders.filter(o => o.status === 'devolucion').length;
      const rescheduledOrders = messengerOrders.filter(o => o.status === 'reagendado').length;
      const rescheduledTonightOrders = messengerOrders.filter(o => 
        o.status === 'reagendado' && o.scheduledDate && 
        new Date(o.scheduledDate).toDateString() === new Date().toDateString()
      ).length;
      
      // Métodos de pago
      const cashCollected = messengerOrders
        .filter(o => o.status === 'entregado' && o.paymentMethod === 'efectivo')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      
      const sinpeCollected = messengerOrders
        .filter(o => o.status === 'entregado' && o.paymentMethod === 'sinpe')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      
      const cardCollected = 0; // No hay pagos con tarjeta en los datos mock
      
      const totalCollected = cashCollected + sinpeCollected + cardCollected;
      
      // Cálculos
      const ordersToReturn = Math.max(0, assignedOrders - deliveredOrders + returnedOrders);
      const effectiveness = assignedOrders > 0 ? (deliveredOrders / assignedOrders) * 100 : 0;
      
      stats.push({
        messengerId: messenger.id,
        messenger,
        assignedOrders,
        deliveredOrders,
        returnedOrders,
        rescheduledOrders,
        rescheduledTonightOrders,
        changesCount: Math.floor(Math.random() * 3), // Simular cambios aleatorios
        cashCollected,
        sinpeCollected,
        cardCollected,
        totalCollected,
        ordersToReturn,
        effectiveness: Math.round(effectiveness * 100) / 100,
        dateFrom: filters.dateFrom || today,
        dateTo: filters.dateTo || today,
      });
    });
    
    return stats.sort((a, b) => b.effectiveness - a.effectiveness);
  },

  createRoute: async (data: RouteCreationData): Promise<RouteAssignment> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const messenger = mockUsers.find(u => u.id === data.messengerId);
    if (!messenger) {
      throw new Error('Mensajero no encontrado');
    }
    
    const orders = mockOrders.filter(order => data.orderIds.includes(order.id));
    
    // Asignar pedidos al mensajero
    orders.forEach(order => {
      order.assignedMessengerId = data.messengerId;
      order.assignedMessenger = messenger;
      order.updatedAt = new Date().toISOString();
    });
    
    const assignment: RouteAssignment = {
      id: `route-${data.routeDate}-${data.messengerId}-${Date.now()}`,
      routeDate: data.routeDate,
      messengerId: data.messengerId,
      messenger,
      orders,
      totalOrders: orders.length,
      assignedOrders: orders.length,
      unassignedOrders: 0,
      status: 'assigned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      companyId: orders[0]?.companyId || '1',
      company: orders[0]?.company || mockCompanies[0],
    };
    
    return assignment;
  },

  getRouteAssignments: async (filters: RouteManagementFilters): Promise<RouteAssignment[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simular asignaciones existentes basadas en pedidos asignados
    const assignments: RouteAssignment[] = [];
    const messengers = mockUsers.filter(user => user.role === 'mensajero' && user.isActive);
    const today = new Date().toISOString().split('T')[0];
    
    messengers.forEach((messenger, index) => {
      let messengerOrders = mockOrders.filter(order => 
        order.assignedMessengerId === messenger.id
      );
      
      if (filters.dateFrom) {
        messengerOrders = messengerOrders.filter(order => 
          order.createdAt >= filters.dateFrom!
        );
      }
      
      if (filters.dateTo) {
        messengerOrders = messengerOrders.filter(order => 
          order.createdAt <= filters.dateTo!
        );
      }
      
      if (filters.companyId) {
        messengerOrders = messengerOrders.filter(order => 
          order.companyId === filters.companyId
        );
      }
      
      // Si es el día de hoy y no hay pedidos, crear datos de ejemplo
      if (!filters.dateFrom && !filters.dateTo && messengerOrders.length === 0) {
        // Crear exactamente 30 pedidos de ejemplo para el día de hoy
        const mockOrders = [];
        for (let i = 1; i <= 30; i++) {
          mockOrders.push({
            id: `TODAY-${messenger.id}-${i.toString().padStart(3, '0')}`,
            customerName: `Cliente ${index * 30 + i}`,
            customerPhone: `5068888${(index * 30 + i).toString().padStart(4, '0')}`,
            customerAddress: `Dirección ${index * 30 + i}`,
            customerCanton: ['SAN JOSE', 'ALAJUELA', 'CARTAGO', 'HEREDIA'][index % 4],
            totalAmount: 20000 + (index * 1000) + (i * 500),
            status: i <= 25 ? 'entregado' : (i <= 28 ? 'confirmado' : 'reagendado'),
            paymentMethod: i % 3 === 0 ? 'sinpe' : 'efectivo',
            origin: 'csv' as OrderOrigin,
            createdAt: today + `T${(8 + Math.floor(i / 4)).toString().padStart(2, '0')}:${(i % 4 * 15).toString().padStart(2, '0')}:00Z`,
            companyId: '1',
            company: mockCompanies[0],
            assignedMessengerId: messenger.id,
            assignedMessenger: messenger,
          });
        }
        
        messengerOrders = mockOrders as any[];
      }
      
      if (messengerOrders.length > 0) {
        // Agrupar por fecha
        const ordersByDate = messengerOrders.reduce((groups: { [key: string]: Order[] }, order) => {
          const date = order.createdAt.split('T')[0];
          if (!groups[date]) groups[date] = [];
          groups[date].push(order);
          return groups;
        }, {});
        
        Object.entries(ordersByDate).forEach(([date, orders]) => {
          assignments.push({
            id: `route-${date}-${messenger.id}`,
            routeDate: date,
            messengerId: messenger.id,
            messenger,
            orders,
            totalOrders: orders.length,
            assignedOrders: orders.length,
            unassignedOrders: 0,
            status: 'assigned',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            companyId: orders[0]?.companyId || '1',
            company: orders[0]?.company || mockCompanies[0],
          });
        });
      }
    });
    
    return assignments;
  },

  // Route Information API functions
  getRouteInfo: async (canton: string): Promise<RouteInfo | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const routeInfo = getRouteForCanton(canton);
    if (!routeInfo) return null;
    
    const messengers = getMessengersForRoute(routeInfo.route);
    
    return {
      route: routeInfo.route,
      zones: routeInfo.zones,
      payment: routeInfo.payment,
      messengers,
    };
  },

  getAllRoutes: async (): Promise<RouteInfo[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const routes = getAllRoutes();
    const routeInfos: RouteInfo[] = [];
    
    routes.forEach(route => {
      const messengers = getMessengersForRoute(route);
      const routeData = Object.values(routeMapping).find(r => r.route === route);
      
      if (routeData) {
        routeInfos.push({
          route,
          zones: routeData.zones,
          payment: routeData.payment,
          messengers,
        });
      }
    });
    
    return routeInfos;
  },

  getRouteStats: async (filters: RouteManagementFilters): Promise<RouteStats[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const routes = getAllRoutes();
    const stats: RouteStats[] = [];
    
    routes.forEach(route => {
      // Obtener pedidos para esta ruta
      let routeOrders = mockOrders.filter(order => {
        const canton = order.customerCanton || '';
        const routeInfo = getRouteForCanton(canton);
        return routeInfo && routeInfo.route === route;
      });
      
      if (filters.dateFrom) {
        routeOrders = routeOrders.filter(order => 
          order.createdAt >= filters.dateFrom!
        );
      }
      
      if (filters.dateTo) {
        routeOrders = routeOrders.filter(order => 
          order.createdAt <= filters.dateTo!
        );
      }
      
      if (filters.companyId) {
        routeOrders = routeOrders.filter(order => 
          order.companyId === filters.companyId
        );
      }
      
      const messengers = getMessengersForRoute(route);
      const routeData = Object.values(routeMapping).find(r => r.route === route);
      
      stats.push({
        route,
        totalOrders: routeOrders.length,
        totalAmount: routeOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        assignedMessengers: messengers.length,
        averageOrderValue: routeOrders.length > 0 ? 
          routeOrders.reduce((sum, order) => sum + order.totalAmount, 0) / routeOrders.length : 0,
        paymentPerMessenger: routeData?.payment || 0,
      });
    });
    
    return stats.sort((a, b) => b.totalOrders - a.totalOrders);
  },

  getCantonsByRoute: async (route: string): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const cantons: string[] = [];
    Object.entries(routeMapping).forEach(([canton, routeInfo]) => {
      if (routeInfo.route === route) {
        cantons.push(canton);
      }
    });
    
    return cantons.sort();
  },
};

// Route mapping data from CSV
const routeMapping: { [key: string]: { route: string; zones: string[]; payment: number } } = {
  'ALAJUELA': { route: 'AL1', zones: ['HE1', 'SJ5', 'SJ4'], payment: 2500 },
  'CARTAGO': { route: 'CT1', zones: ['SJ2', 'SJ1', 'SJ4'], payment: 2500 },
  'HEREDIA': { route: 'H1', zones: ['AL1', 'SJ4'], payment: 2500 },
  'ALAJUELITA': { route: 'SJ3', zones: ['SJ1', 'SJ2', 'CT1'], payment: 2000 },
  'ASERRI': { route: 'SJ3', zones: ['SJ1', 'SJ2', 'CT1'], payment: 2000 },
  'CURRIDABAT': { route: 'SJ2', zones: ['CT1', 'SJ1', 'SJ4'], payment: 2000 },
  'DESAMPARADOS': { route: 'SJ3', zones: ['SJ1', 'SJ2', 'CT1'], payment: 2000 },
  'ESCAZU': { route: 'SJ5', zones: ['SJ1', 'AL1', 'HE1'], payment: 2000 },
  'GOICOECHEA': { route: 'SJ2', zones: ['CT1', 'SJ1', 'SJ4'], payment: 2000 },
  'MONTES DE OCA': { route: 'SJ2', zones: ['CT1', 'SJ1', 'SJ4'], payment: 2000 },
  'MORA': { route: 'SJ5', zones: ['SJ1', 'AL1', 'HE1'], payment: 2000 },
  'MORAVIA': { route: 'SJ2', zones: ['CT1', 'SJ1', 'SJ4'], payment: 2000 },
  'SAN JOSE': { route: 'SJ1', zones: ['SJ2', 'HE1'], payment: 2000 },
  'SANTA ANA': { route: 'SJ5', zones: ['SJ1', 'AL1', 'HE1'], payment: 2000 },
  'TIBAS': { route: 'SJ4', zones: ['HE1', 'SJ2'], payment: 2000 },
  'VAZQUEZ DE CORONADO': { route: 'SJ2', zones: ['CT1', 'SJ1', 'SJ4'], payment: 2000 },
};

// Function to get route information for a canton
function getRouteForCanton(canton: string): { route: string; zones: string[]; payment: number } | null {
  const normalizedCanton = canton.toUpperCase().trim();
  return routeMapping[normalizedCanton] || null;
}

// Function to get all available routes
function getAllRoutes(): string[] {
  const routes = new Set<string>();
  Object.values(routeMapping).forEach(routeInfo => {
    routes.add(routeInfo.route);
  });
  return Array.from(routes);
}

// Function to get messengers assigned to routes
function getMessengersForRoute(route: string): User[] {
  const messengers = mockUsers.filter(user => user.role === 'mensajero' && user.isActive);
  
  // Assign messengers to routes in a round-robin fashion
  const routeMessengers: { [key: string]: User[] } = {
    'AL1': [messengers[0], messengers[1]], // Juan Pérez, Luis González
    'CT1': [messengers[2], messengers[3]], // Carlos Rodríguez, Sofía Herrera
    'H1': [messengers[4]], // Miguel Torres
    'SJ1': [messengers[0], messengers[5]], // Juan Pérez, Laura Vargas
    'SJ2': [messengers[1], messengers[2]], // Luis González, Carlos Rodríguez
    'SJ3': [messengers[3], messengers[4]], // Sofía Herrera, Miguel Torres
    'SJ4': [messengers[5]], // Laura Vargas
    'SJ5': [messengers[0], messengers[1]], // Juan Pérez, Luis González
  };
  
  return routeMessengers[route] || [];
}

// Helper function for status descriptions
function getStatusDescription(status: RedLogisticStatus): string {
  const descriptions: Record<RedLogisticStatus, string> = {
    'pendiente_envio': 'Pedido pendiente de envío',
    'enviado': 'Pedido enviado desde centro de distribución',
    'en_transito': 'Pedido en tránsito hacia destino',
    'entregado': 'Pedido entregado exitosamente',
    'devuelto': 'Pedido devuelto al remitente',
    'cancelado': 'Pedido cancelado',
  };
  return descriptions[status];
}

// Mock Red Logística Data
export const mockRedLogisticOrders: RedLogisticOrder[] = [
  {
    id: 'rl-001',
    orderId: 'PMC-001',
    order: mockOrders[0],
    trackingNumber: 'RL-CR-2024-001',
    status: 'en_transito',
    deliveryMethod: 'red_logistic',
    pickupAddress: 'Avenida Central, Calle 5, San José Centro, Costa Rica',
    deliveryAddress: 'De la iglesia agonia 1km al este y 50 norte, ALAJUELA, ALAJUELA',
    estimatedDelivery: '2024-12-15T14:00:00Z',
    actualDelivery: undefined,
    weight: 2.5,
    dimensions: { length: 30, width: 20, height: 15 },
    declaredValue: 18905,
    shippingCost: 2500,
    insuranceCost: 500,
    totalCost: 3000,
    notes: 'Paquete frágil - manejar con cuidado',
    createdAt: '2024-12-10T08:00:00Z',
    updatedAt: '2024-12-12T10:30:00Z',
    createdBy: '1',
    createdByUser: mockUsers[0],
    companyId: '1',
    company: mockCompanies[0],
  },
  {
    id: 'rl-002',
    orderId: 'PMC-002',
    order: mockOrders[1],
    trackingNumber: 'RL-CR-2024-002',
    status: 'entregado',
    deliveryMethod: 'red_logistic',
    pickupAddress: 'Avenida Central, Calle 5, San José Centro, Costa Rica',
    deliveryAddress: 'DULCE NOMBRE, CARTAGO',
    estimatedDelivery: '2024-12-12T16:00:00Z',
    actualDelivery: '2024-12-12T15:30:00Z',
    weight: 1.8,
    dimensions: { length: 25, width: 18, height: 12 },
    declaredValue: 21900,
    shippingCost: 2200,
    insuranceCost: 400,
    totalCost: 2600,
    notes: 'Entrega exitosa',
    createdAt: '2024-12-08T09:00:00Z',
    updatedAt: '2024-12-12T15:30:00Z',
    createdBy: '1',
    createdByUser: mockUsers[0],
    companyId: '1',
    company: mockCompanies[0],
  },
  {
    id: 'rl-003',
    orderId: 'BF-001',
    order: mockOrders[2],
    trackingNumber: 'RL-CR-2024-003',
    status: 'pendiente_envio',
    deliveryMethod: 'red_logistic',
    pickupAddress: 'Plaza Mayor, Escazú, San José, Costa Rica',
    deliveryAddress: 'SANTA LUCIA, BARVA',
    estimatedDelivery: '2024-12-16T12:00:00Z',
    actualDelivery: undefined,
    weight: 3.2,
    dimensions: { length: 35, width: 25, height: 20 },
    declaredValue: 19900,
    shippingCost: 2800,
    insuranceCost: 600,
    totalCost: 3400,
    notes: 'Listo para envío',
    createdAt: '2024-12-13T11:00:00Z',
    updatedAt: '2024-12-13T11:00:00Z',
    createdBy: '2',
    createdByUser: mockUsers[1],
    companyId: '2',
    company: mockCompanies[1],
  },
];

export const mockRedLogisticTracking: RedLogisticTracking[] = [
  {
    id: 'track-001',
    redLogisticOrderId: 'rl-001',
    redLogisticOrder: mockRedLogisticOrders[0],
    status: 'enviado',
    location: 'Centro de Distribución San José',
    description: 'Paquete enviado desde centro de distribución',
    timestamp: '2024-12-10T08:30:00Z',
    notes: 'Salida programada',
  },
  {
    id: 'track-002',
    redLogisticOrderId: 'rl-001',
    redLogisticOrder: mockRedLogisticOrders[0],
    status: 'en_transito',
    location: 'En ruta hacia Alajuela',
    description: 'Paquete en tránsito hacia destino final',
    timestamp: '2024-12-12T10:30:00Z',
    notes: 'Estimado de entrega: 2-3 días hábiles',
  },
  {
    id: 'track-003',
    redLogisticOrderId: 'rl-002',
    redLogisticOrder: mockRedLogisticOrders[1],
    status: 'entregado',
    location: 'DULCE NOMBRE, CARTAGO',
    description: 'Paquete entregado exitosamente',
    timestamp: '2024-12-12T15:30:00Z',
    notes: 'Firmado por: María González',
  },
];

// Helper function to determine stock status
function getStockStatus(item: InventoryItem): 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' {
  if (item.currentStock === 0) return 'out_of_stock';
  if (item.currentStock <= item.minimumStock) return 'low_stock';
  if (item.currentStock > item.maximumStock) return 'overstock';
  return 'in_stock';
}

// Mock data for route liquidations
const mockRouteLiquidations: RouteLiquidation[] = [
  {
    id: 'rl-001',
    messengerId: '1',
    messenger: mockUsers[0], // Juan Pérez
    routeDate: '2024-12-12',
    status: 'finalizada',
    
    totalCollected: 125000,
    totalSpent: 15000,
    totalToDeliver: 110000,
    
    totalOrders: 8,
    deliveredOrders: 6,
    returnedOrders: 1,
    pendingOrders: 1,
    
    orders: mockOrders.filter(o => o.assignedMessengerId === '1' && o.createdAt.startsWith('2024-12-12')),
    cashOrders: mockOrders.filter(o => o.assignedMessengerId === '1' && o.paymentMethod === 'efectivo' && o.createdAt.startsWith('2024-12-12')),
    sinpeOrders: mockOrders.filter(o => o.assignedMessengerId === '1' && o.paymentMethod === 'sinpe' && o.createdAt.startsWith('2024-12-12')),
    
    createdAt: '2024-12-12T08:00:00Z',
    updatedAt: '2024-12-12T18:30:00Z',
    finalizedAt: '2024-12-12T18:30:00Z',
    
    notes: 'Ruta completada con éxito. Un pedido devuelto por cliente no disponible.',
    
    companyId: '1',
    company: mockCompanies[0],
  },
  {
    id: 'rl-002',
    messengerId: '2',
    messenger: mockUsers[1], // Luis González
    routeDate: '2024-12-12',
    status: 'pendiente',
    
    totalCollected: 89000,
    totalSpent: 12000,
    totalToDeliver: 77000,
    
    totalOrders: 5,
    deliveredOrders: 4,
    returnedOrders: 0,
    pendingOrders: 1,
    
    orders: mockOrders.filter(o => o.assignedMessengerId === '2' && o.createdAt.startsWith('2024-12-12')),
    cashOrders: mockOrders.filter(o => o.assignedMessengerId === '2' && o.paymentMethod === 'efectivo' && o.createdAt.startsWith('2024-12-12')),
    sinpeOrders: mockOrders.filter(o => o.assignedMessengerId === '2' && o.paymentMethod === 'sinpe' && o.createdAt.startsWith('2024-12-12')),
    
    createdAt: '2024-12-12T08:30:00Z',
    updatedAt: '2024-12-12T17:45:00Z',
    
    notes: 'Ruta en proceso. Un pedido pendiente por reagendar.',
    
    companyId: '1',
    company: mockCompanies[0],
  },
  {
    id: 'rl-003',
    messengerId: '3',
    messenger: mockUsers[2], // Ana Martínez
    routeDate: '2024-12-11',
    status: 'liquidada',
    
    totalCollected: 156000,
    totalSpent: 18000,
    totalToDeliver: 138000,
    
    totalOrders: 7,
    deliveredOrders: 7,
    returnedOrders: 0,
    pendingOrders: 0,
    
    orders: mockOrders.filter(o => o.assignedMessengerId === '3' && o.createdAt.startsWith('2024-12-11')),
    cashOrders: mockOrders.filter(o => o.assignedMessengerId === '3' && o.paymentMethod === 'efectivo' && o.createdAt.startsWith('2024-12-11')),
    sinpeOrders: mockOrders.filter(o => o.assignedMessengerId === '3' && o.paymentMethod === 'sinpe' && o.createdAt.startsWith('2024-12-11')),
    
    createdAt: '2024-12-11T08:00:00Z',
    updatedAt: '2024-12-11T19:00:00Z',
    finalizedAt: '2024-12-11T19:00:00Z',
    liquidatedAt: '2024-12-11T20:15:00Z',
    liquidatedBy: '1',
    liquidatedByUser: mockUsers[0], // Admin
    
    notes: 'Ruta completada exitosamente. Todos los pedidos entregados.',
    adminNotes: 'Liquidación aprobada. Efectivo recibido correctamente.',
    
    companyId: '2',
    company: mockCompanies[1],
  },
];