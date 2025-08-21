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
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ana Rodríguez',
    phone: '+506 8765-4321',
    email: 'ana.rodriguez@email.com',
    address: 'Calle 5, Casa 123, Barrio La Paz',
    province: 'San José',
    canton: 'Central',
    district: 'Carmen',
  },
  {
    id: '2',
    name: 'Roberto Morales',
    phone: '+506 8765-5432',
    email: 'roberto.morales@email.com',
    address: 'Avenida 10, Edificio Verde, Apto 4B',
    province: 'San José',
    canton: 'Escazú',
    district: 'Escazú',
  },
  {
    id: '3',
    name: 'Carmen Jiménez',
    phone: '+506 8765-6543',
    address: 'Residencial Los Álamos, Casa 45',
    province: 'Alajuela',
    canton: 'Central',
    district: 'Alajuela',
  },
  {
    id: '4',
    name: 'Diego Vargas',
    phone: '+506 8765-7654',
    email: 'diego.vargas@email.com',
    address: 'Del Banco Nacional 200m este, casa azul',
    province: 'Cartago',
    canton: 'Central',
    district: 'Oriental',
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
      unitPrice: product.price,
      totalPrice: product.price * quantity,
    });
  }
  return items;
};

// Generate mock orders
const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const statuses: OrderStatus[] = ['pendiente', 'confirmado', 'en_ruta', 'entregado', 'devolucion', 'reagendado'];
  const paymentMethods: PaymentMethod[] = ['contra_entrega', 'sinpe', 'tarjeta', 'transferencia'];
  const origins: OrderOrigin[] = ['shopify', 'manual', 'csv'];

  for (let i = 1; i <= 150; i++) {
    const items = generateOrderItems(Math.floor(Math.random() * 3) + 1);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const origin = origins[Math.floor(Math.random() * origins.length)];
    
    // Assign messenger for orders that are en_ruta or entregado
    let assignedMessengerId;
    if (status === 'en_ruta' || status === 'entregado' || status === 'devolucion') {
      const messengers = mockUsers.filter(u => u.role === 'mensajero');
      assignedMessengerId = messengers[Math.floor(Math.random() * messengers.length)].id;
    }

    const createdDate = new Date(2024, 0, Math.floor(Math.random() * 365));
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
      assignedMessenger: assignedMessengerId ? mockUsers.find(u => u.id === assignedMessengerId) : undefined,
      advisorId: mockUsers.find(u => u.role === 'asesor')?.id,
      advisor: mockUsers.find(u => u.role === 'asesor'),
      notes: Math.random() > 0.7 ? 'Cliente prefiere entrega en la tarde' : undefined,
      deliveryNotes: status === 'entregado' ? 'Entregado exitosamente' : undefined,
    };

    if (status === 'entregado') {
      order.deliveryDate = new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (status === 'reagendado') {
      order.scheduledDate = new Date(createdDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString();
    }

    orders.push(order);
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const mockOrders = generateMockOrders();

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

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'entregado').length;
    const returnedOrders = orders.filter(o => o.status === 'devolucion').length;
    const rescheduledOrders = orders.filter(o => o.status === 'reagendado').length;
    const pendingOrders = orders.filter(o => ['pendiente', 'confirmado', 'en_ruta'].includes(o.status)).length;
    
    const cashOrders = orders.filter(o => o.paymentMethod === 'contra_entrega' && o.status === 'entregado');
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
    };
  },
};