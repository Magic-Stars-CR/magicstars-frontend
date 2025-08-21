export type UserRole = 'admin' | 'asesor' | 'mensajero';

export type OrderStatus = 
  | 'pendiente'
  | 'confirmado' 
  | 'en_ruta'
  | 'entregado'
  | 'devolucion'
  | 'reagendado';

export type PaymentMethod = 'efectivo' | 'sinpe';

export type OrderOrigin = 'shopify' | 'manual' | 'csv';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address: string;
  province: string;
  canton: string;
  district: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image?: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  customer: Customer;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  origin: OrderOrigin;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  deliveryDate?: string;
  assignedMessengerId?: string;
  assignedMessenger?: User;
  advisorId?: string;
  advisor?: User;
  notes?: string;
  deliveryNotes?: string;
  trackingUrl?: string;
  deliveryAddress?: string;
}

export interface Stats {
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  rescheduledOrders: number;
  pendingOrders: number;
  totalCash: number;
  totalSinpe: number;
  deliveryRate: number;
}

export interface MessengerStats extends Stats {
  assignedToday: number;
  completedToday: number;
  pendingToday: number;
  inRouteToday: number;
}

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: OrderStatus;
  origin?: OrderOrigin;
  paymentMethod?: PaymentMethod;
  province?: string;
  canton?: string;
  district?: string;
  customerId?: string;
  productSku?: string;
  messengerId?: string;
}