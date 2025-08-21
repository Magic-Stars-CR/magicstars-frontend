import { User, Order, Customer, Product, OrderItem, OrderStatus, PaymentMethod, OrderOrigin, Stats, MessengerStats } from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@magicstars.com',
    name: 'Carlos Administrador',
    role: 'admin',
    phone: '+506 8888-1111',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '2024-01-01T10:00:00Z',
    isActive: true,
  },
  {
    id: '2',
    email: 'maria.asesor@magicstars.com',
    name: 'María Fernández',
    role: 'asesor',
    phone: '+506 8888-2222',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b9e1?w=150',
    createdAt: '2024-01-15T10:00:00Z',
    isActive: true,
  },
  {
    id: '3',
    email: 'juan.mensajero@magicstars.com',
    name: 'Juan Pérez',
    role: 'mensajero',
    phone: '+506 8888-3333',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2024-01-20T10:00:00Z',
    isActive: true,
  },
  {
    id: '4',
    email: 'luis.mensajero@magicstars.com',
    name: 'Luis González',
    role: 'mensajero',
    phone: '+506 8888-4444',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2024-02-01T10:00:00Z',
    isActive: true,
  },
  {
    id: '5',
    email: 'ana.mensajero@magicstars.com',
    name: 'Ana Martínez',
    role: 'mensajero',
    phone: '+506 8888-5555',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    createdAt: '2024-02-15T10:00:00Z',
    isActive: true,
  },
  {
    id: '6',
    email: 'pedro.asesor@magicstars.com',
    name: 'Pedro Ramírez',
    role: 'asesor',
    phone: '+506 8888-6666',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2024-03-01T10:00:00Z',
    isActive: true,
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ana Rodríguez',
    phone: '+506 8765-4321',
    email: 'ana.rodriguez@email.com',
    address: 'Calle 5, Casa 123, Barrio La Paz, San José',
    province: 'San José',
    canton: 'Central',
    district: 'Carmen',
  },
  {
    id: '2',
    name: 'Roberto Morales',
    phone: '+506 8765-5432',
    email: 'roberto.morales@email.com',
    address: 'Avenida 10, Edificio Verde, Apto 4B, Escazú',
    province: 'San José',
    canton: 'Escazú',
    district: 'Escazú',
  },
  {
    id: '3',
    name: 'Carmen Jiménez',
    phone: '+506 8765-6543',
    address: 'Residencial Los Álamos, Casa 45, Alajuela',
    province: 'Alajuela',
    canton: 'Central',
    district: 'Alajuela',
  },
  {
    id: '4',
    name: 'Diego Vargas',
    phone: '+506 8765-7654',
    email: 'diego.vargas@email.com',
    address: 'Del Banco Nacional 200m este, casa azul, Cartago',
    province: 'Cartago',
    canton: 'Central',
    district: 'Oriental',
  },
  {
    id: '5',
    name: 'Laura Méndez',
    phone: '+506 8765-8765',
    email: 'laura.mendez@email.com',
    address: 'Condominio Las Flores, Torre A, Apto 12, Heredia',
    province: 'Heredia',
    canton: 'Central',
    district: 'Heredia',
  },
  {
    id: '6',
    name: 'Carlos Herrera',
    phone: '+506 8765-9876',
    email: 'carlos.herrera@email.com',
    address: 'Residencial El Bosque, Casa 78, Curridabat',
    province: 'San José',
    canton: 'Curridabat',
    district: 'Curridabat',
  },
  {
    id: '7',
    name: 'María López',
    phone: '+506 8765-1098',
    email: 'maria.lopez@email.com',
    address: 'Urbanización Los Pinos, Casa 23, Santa Ana',
    province: 'San José',
    canton: 'Santa Ana',
    district: 'Santa Ana',
  },
  {
    id: '8',
    name: 'Jorge Castro',
    phone: '+506 8765-2109',
    email: 'jorge.castro@email.com',
    address: 'Condominio Vista Verde, Apto 5B, Tibás',
    province: 'San José',
    canton: 'Tibás',
    district: 'Tibás',
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'MS-001',
    name: 'Crema Facial Anti-edad',
    category: 'Cuidado Facial',
    price: 25500,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
  },
  {
    id: '2',
    sku: 'MS-002',
    name: 'Sérum Vitamina C',
    category: 'Cuidado Facial',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bdf303?w=300',
  },
  {
    id: '3',
    sku: 'MS-003',
    name: 'Mascarilla Hidratante',
    category: 'Cuidado Facial',
    price: 12750,
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=300',
  },
  {
    id: '4',
    sku: 'MS-004',
    name: 'Protector Solar SPF 50',
    category: 'Protección Solar',
    price: 22300,
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300',
  },
  {
    id: '5',
    sku: 'MS-005',
    name: 'Kit Limpieza Facial',
    category: 'Kits',
    price: 45600,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
  },
  {
    id: '6',
    sku: 'MS-006',
    name: 'Aceite Facial Nutritivo',
    category: 'Cuidado Facial',
    price: 28900,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
  },
  {
    id: '7',
    sku: 'MS-007',
    name: 'Exfoliante Suave',
    category: 'Cuidado Facial',
    price: 15600,
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bdf303?w=300',
  },
  {
    id: '8',
    sku: 'MS-008',
    name: 'Tónico Facial',
    category: 'Cuidado Facial',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=300',
  },
];

// Generate mock order items
const generateOrderItems = (count: number): OrderItem[] => {
  const items: OrderItem[] = [];
  for (let i = 0; i < count; i++) {
    const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
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
  const today = new Date();
  const todayOrders: Order[] = [];
  const messengers = mockUsers.filter(u => u.role === 'mensajero');
  const advisors = mockUsers.filter(u => u.role === 'asesor');
  
  // Today's orders with specific scenarios
  const todayScenarios = [
    {
      id: 'MS-TODAY-001',
      status: 'confirmado' as OrderStatus,
      customer: mockCustomers[0],
      totalAmount: 45600,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 8,
      minute: 30,
      notes: 'Cliente solicita entrega antes de las 10 AM',
      assignedMessengerId: undefined
    },
    {
      id: 'MS-TODAY-002',
      status: 'en_ruta' as OrderStatus,
      customer: mockCustomers[1],
      totalAmount: 18900,
      paymentMethod: 'sinpe' as PaymentMethod,
      hour: 9,
      minute: 15,
      notes: 'Entregar en recepción del edificio',
      assignedMessengerId: messengers[0].id
    },
    {
      id: 'MS-TODAY-003',
      status: 'en_ruta' as OrderStatus,
      customer: mockCustomers[2],
      totalAmount: 12750,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 9,
      minute: 45,
      notes: 'Cliente no disponible hasta las 2 PM',
      assignedMessengerId: messengers[1].id
    },
    {
      id: 'MS-TODAY-004',
      status: 'confirmado' as OrderStatus,
      customer: mockCustomers[3],
      totalAmount: 22300,
      paymentMethod: 'sinpe' as PaymentMethod,
      hour: 10,
      minute: 0,
      notes: 'Dirección difícil de encontrar, llamar antes de llegar',
      assignedMessengerId: undefined
    },
    {
      id: 'MS-TODAY-005',
      status: 'pendiente' as OrderStatus,
      customer: mockCustomers[4],
      totalAmount: 28900,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 10,
      minute: 30,
      notes: 'Nuevo pedido urgente',
      assignedMessengerId: undefined
    },
    {
      id: 'MS-TODAY-006',
      status: 'en_ruta' as OrderStatus,
      customer: mockCustomers[5],
      totalAmount: 15600,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 11,
      minute: 0,
      notes: 'Entregar en la puerta principal',
      assignedMessengerId: messengers[2].id
    },
    {
      id: 'MS-TODAY-007',
      status: 'confirmado' as OrderStatus,
      customer: mockCustomers[6],
      totalAmount: 18900,
      paymentMethod: 'sinpe' as PaymentMethod,
      hour: 11,
      minute: 30,
      notes: 'Cliente prefiere entrega en la tarde',
      assignedMessengerId: undefined
    },
    {
      id: 'MS-TODAY-008',
      status: 'pendiente' as OrderStatus,
      customer: mockCustomers[7],
      totalAmount: 45600,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 12,
      minute: 0,
      notes: 'Pedido de último minuto',
      assignedMessengerId: undefined
    },
    {
      id: 'MS-TODAY-009',
      status: 'en_ruta' as OrderStatus,
      customer: mockCustomers[0],
      totalAmount: 12750,
      paymentMethod: 'sinpe' as PaymentMethod,
      hour: 12,
      minute: 30,
      notes: 'Segunda entrega del día para este cliente',
      assignedMessengerId: messengers[0].id
    },
    {
      id: 'MS-TODAY-010',
      status: 'confirmado' as OrderStatus,
      customer: mockCustomers[1],
      totalAmount: 28900,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 13,
      minute: 0,
      notes: 'Cliente solicita entrega después de las 3 PM',
      assignedMessengerId: undefined
    },
    {
      id: 'MS-TODAY-011',
      status: 'reagendado' as OrderStatus,
      customer: mockCustomers[2],
      totalAmount: 18900,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 14,
      minute: 0,
      notes: 'Cliente solicitó reagendar para mañana',
      assignedMessengerId: messengers[1].id
    },
    {
      id: 'MS-TODAY-012',
      status: 'devolucion' as OrderStatus,
      customer: mockCustomers[3],
      totalAmount: 22300,
      paymentMethod: 'sinpe' as PaymentMethod,
      hour: 14,
      minute: 30,
      notes: 'Cliente no estaba en casa, devolver a oficina',
      assignedMessengerId: messengers[2].id
    },
    {
      id: 'MS-TODAY-013',
      status: 'entregado' as OrderStatus,
      customer: mockCustomers[4],
      totalAmount: 15600,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 15,
      minute: 0,
      notes: 'Entregado exitosamente',
      assignedMessengerId: messengers[0].id
    },
    {
      id: 'MS-TODAY-014',
      status: 'entregado' as OrderStatus,
      customer: mockCustomers[5],
      totalAmount: 45600,
      paymentMethod: 'sinpe' as PaymentMethod,
      hour: 15,
      minute: 30,
      notes: 'Entregado exitosamente',
      assignedMessengerId: messengers[1].id
    },
    {
      id: 'MS-TODAY-015',
      status: 'entregado' as OrderStatus,
      customer: mockCustomers[6],
      totalAmount: 18900,
      paymentMethod: 'efectivo' as PaymentMethod,
      hour: 16,
      minute: 0,
      notes: 'Entregado exitosamente',
      assignedMessengerId: messengers[2].id
    }
  ];

  todayScenarios.forEach((scenario, index) => {
    const createdDate = new Date(today);
    createdDate.setHours(scenario.hour, scenario.minute, 0, 0);
    
    const items = generateOrderItems(Math.floor(Math.random() * 3) + 1);
    
    let deliveryDate: string | undefined;
    let scheduledDate: string | undefined;
    
    if (scenario.status === 'entregado') {
      const deliveryDateObj = new Date(createdDate);
      deliveryDateObj.setHours(createdDate.getHours() + 2); // 2 hours after creation
      deliveryDate = deliveryDateObj.toISOString();
    }
    
    if (scenario.status === 'reagendado') {
      const scheduledDateObj = new Date(today);
      scheduledDateObj.setDate(today.getDate() + 1); // Tomorrow
      scheduledDateObj.setHours(10, 0, 0, 0); // 10 AM tomorrow
      scheduledDate = scheduledDateObj.toISOString();
    }

    const order: Order = {
      id: scenario.id,
      customerId: scenario.customer.id,
      customer: scenario.customer,
      items,
      totalAmount: scenario.totalAmount,
      status: scenario.status,
      paymentMethod: scenario.paymentMethod,
      origin: 'manual',
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
      assignedMessengerId: scenario.assignedMessengerId,
      assignedMessenger: scenario.assignedMessengerId ? mockUsers.find(u => u.id === scenario.assignedMessengerId) : undefined,
      advisorId: advisors[Math.floor(Math.random() * advisors.length)]?.id,
      advisor: advisors[Math.floor(Math.random() * advisors.length)],
      notes: scenario.notes,
      deliveryNotes: scenario.status === 'entregado' ? 'Entregado exitosamente' : undefined,
      deliveryAddress: scenario.customer.address,
      deliveryDate,
      scheduledDate,
    };

    todayOrders.push(order);
  });

  return todayOrders;
};

// Generate mock orders with realistic distribution
const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const statuses: OrderStatus[] = ['pendiente', 'confirmado', 'en_ruta', 'entregado', 'devolucion', 'reagendado'];
  const paymentMethods: PaymentMethod[] = ['efectivo', 'sinpe'];
  const origins: OrderOrigin[] = ['shopify', 'manual', 'csv'];
  
  // Realistic status distribution weights
  const statusWeights = {
    'pendiente': 0.05,      // 5% - new orders
    'confirmado': 0.15,     // 15% - confirmed but not assigned
    'en_ruta': 0.20,        // 20% - currently being delivered
    'entregado': 0.50,      // 50% - completed (majority)
    'devolucion': 0.05,     // 5% - returned
    'reagendado': 0.05      // 5% - rescheduled
  };

  const dates = generateRealisticDates();
  const messengers = mockUsers.filter(u => u.role === 'mensajero');
  const advisors = mockUsers.filter(u => u.role === 'asesor');

  for (let i = 1; i <= 300; i++) {
    const items = generateOrderItems(Math.floor(Math.random() * 3) + 1);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
    
    // Use weighted random selection for status
    const random = Math.random();
    let cumulativeWeight = 0;
    let status: OrderStatus = 'pendiente';
    
    for (const [statusKey, weight] of Object.entries(statusWeights)) {
      cumulativeWeight += weight;
      if (random <= cumulativeWeight) {
        status = statusKey as OrderStatus;
        break;
      }
    }
    
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const origin = origins[Math.floor(Math.random() * origins.length)];
    
    // Assign messenger based on status
    let assignedMessengerId: string | undefined;
    let assignedMessenger: User | undefined;
    
    if (['en_ruta', 'entregado', 'devolucion'].includes(status)) {
      assignedMessengerId = messengers[Math.floor(Math.random() * messengers.length)].id;
      assignedMessenger = mockUsers.find(u => u.id === assignedMessengerId);
    }

    // Select a random date from the last 90 days
    const randomDateIndex = Math.floor(Math.random() * dates.length);
    const createdDate = new Date(dates[randomDateIndex]);
    
    // Generate realistic delivery dates for completed orders
    let deliveryDate: string | undefined;
    let scheduledDate: string | undefined;
    
    if (status === 'entregado') {
      // Delivery date should be after creation date
      const deliveryDelay = Math.floor(Math.random() * 7) + 1; // 1-7 days
      const deliveryDateObj = new Date(createdDate);
      deliveryDateObj.setDate(deliveryDateObj.getDate() + deliveryDelay);
      deliveryDate = deliveryDateObj.toISOString();
    }
    
    if (status === 'reagendado') {
      // Scheduled date should be in the future
      const rescheduleDelay = Math.floor(Math.random() * 14) + 1; // 1-14 days
      const scheduledDateObj = new Date(createdDate);
      scheduledDateObj.setDate(scheduledDateObj.getDate() + rescheduleDelay);
      scheduledDate = scheduledDateObj.toISOString();
    }

    const order: Order = {
      id: `MS-${i.toString().padStart(6, '0')}`,
      customerId: customer.id,
      customer,
      items,
      totalAmount,
      status,
      paymentMethod,
      origin,
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
      assignedMessengerId,
      assignedMessenger,
      advisorId: advisors[Math.floor(Math.random() * advisors.length)]?.id,
      advisor: advisors[Math.floor(Math.random() * advisors.length)],
      notes: Math.random() > 0.8 ? 'Cliente prefiere entrega en la tarde' : undefined,
      deliveryNotes: status === 'entregado' ? 'Entregado exitosamente' : undefined,
      deliveryAddress: customer.address,
      deliveryDate,
      scheduledDate,
    };

    orders.push(order);
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const mockOrders = [...generateTodayOrders(), ...generateMockOrders()];

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

  // Users
  getUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers;
  },

  // Orders
  getOrders: async (filters?: any): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let filteredOrders = [...mockOrders];

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
      id: `MS-${(mockOrders.length + 1).toString().padStart(6, '0')}`,
      customerId: orderData.customerId || '1',
      customer: mockCustomers[0], // Default customer
      items: [],
      totalAmount: parseFloat(orderData.totalAmount) || 0,
      status: 'pendiente',
      paymentMethod: orderData.paymentMethod || 'efectivo',
      origin: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryAddress: orderData.deliveryAddress || '',
      notes: orderData.notes,
    };
    
    mockOrders.unshift(newOrder);
    return newOrder;
  },
};