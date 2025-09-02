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

export interface Company {
  id: string;
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  companyId?: string;        // Nueva relación con empresa
  company?: Company;         // Referencia a empresa
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
  companyId?: string;        // Nueva relación con empresa
  company?: Company;         // Referencia a empresa
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  companyId?: string;        // Nueva relación con empresa
  company?: Company;         // Referencia a empresa
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
  // Información del cliente (directa del CSV)
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerProvince: string;
  customerCanton: string;
  customerDistrict: string;
  customerLocationLink?: string;
  
  // Información del pedido
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  origin: OrderOrigin;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  deliveryDate?: string;
  
  // Asignaciones
  assignedMessengerId?: string;
  assignedMessenger?: User;
  advisorId?: string;
  advisor?: User;
  
  // Notas y tracking
  notes?: string;
  deliveryNotes?: string;
  trackingUrl?: string;
  deliveryAddress?: string;
  
  // Empresa y jornada
  companyId?: string;
  company?: Company;
  routeSchedule?: string; // JORNADA DE RUTA del CSV
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
  companyId?: string;        // Nueva relación con empresa
}

export interface CompanyStats extends Stats {
  companyId: string;
  company: Company;
  monthlyStats: MonthlyStats[];
}

export interface MonthlyStats {
  year: number;
  month: number;
  monthName: string;
  sales: number;
  delivered: number;
  deliveryRate: number;
}

export interface MessengerStats extends Stats {
  assignedToday: number;
  completedToday: number;
  pendingToday: number;
  inRouteToday: number;
  companyId?: string;        // Nueva relación con empresa
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
  companyId?: string;        // Nueva relación con empresa
}

export interface CSVUploadResult {
  success: number;
  errors: string[];
}

export interface CSVOrderData {
  fecha: string;
  idCliente: string;
  nombre: string;
  provincia: string;
  canton: string;
  distrito: string;
  direccion: string;
  telefono: string;
  valor: string;
  productos: string;
  linkUbicacion: string;
  notaAsesor: string;
  jornadaRuta: string;
}

// ===== INVENTARIO TYPES =====

export type InventoryActionType = 
  | 'entrada'           // Añadir inventario
  | 'salida'            // Descontar inventario
  | 'ajuste'            // Ajuste manual
  | 'pedido_montado'    // Descuento automático por pedido montado a ruta
  | 'pedido_devuelto'   // Devolución automática por pedido no entregado
  | 'pedido_entregado'  // Confirmación de entrega
  | 'inicial'           // Inventario inicial
  | 'perdida'           // Pérdida o daño
  | 'transferencia';    // Transferencia entre ubicaciones

export interface InventoryItem {
  id: string;
  productId: string;
  product: Product;
  companyId: string;
  company: Company;
  currentStock: number;           // Stock actual
  minimumStock: number;           // Stock mínimo
  maximumStock: number;           // Stock máximo
  reservedStock: number;          // Stock reservado para pedidos
  availableStock: number;         // Stock disponible (current - reserved)
  location?: string;              // Ubicación física
  lastUpdated: string;
  createdAt: string;
  isActive: boolean;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  actionType: InventoryActionType;
  quantity: number;               // Cantidad positiva o negativa
  previousStock: number;          // Stock antes del movimiento
  newStock: number;               // Stock después del movimiento
  reason?: string;                // Motivo del movimiento
  referenceId?: string;           // ID de referencia (pedido, ajuste, etc.)
  referenceType?: 'order' | 'adjustment' | 'transfer' | 'initial';
  userId: string;                 // Usuario que realizó la acción
  user: User;
  createdAt: string;
  notes?: string;
}

export interface InventoryAdjustment {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  adjustmentType: 'manual' | 'cycle_count' | 'damage' | 'loss' | 'found';
  quantityDifference: number;     // Diferencia (puede ser positiva o negativa)
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
  user: User;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface InventoryAlert {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon' | 'expired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  isRead: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  totalTransactions: number;
  transactionsToday: number;
  companyId?: string;
}

// Actualizar Product para incluir información de inventario
export interface ProductWithInventory extends Product {
  inventory?: InventoryItem;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

// Filtros para inventario
export interface InventoryFilters {
  companyId?: string;
  productId?: string;
  category?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  actionType?: InventoryActionType;
}