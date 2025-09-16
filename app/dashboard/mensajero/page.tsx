'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { mockApi } from '@/lib/mock-api';
import { Order, MessengerStats, PedidoTest } from '@/lib/types';
import { getPedidos, getPedidosByDistrito, getPedidosByMensajero, updatePedido } from '@/lib/supabase-pedidos';
import { StatsCard } from '@/components/dashboard/stats-card';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  CheckCircle,
  RotateCcw,
  Truck,
  Clock,
  DollarSign,
  Smartphone,
  Navigation,
  Phone,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Eye,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  Edit3,
  MessageSquare,
  AlertTriangle,
  Building2,
  Route,
  CreditCard,
  FileText,
  Upload
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MensajeroDashboard() {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<MessengerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [orderComment, setOrderComment] = useState('');
  const [orderNovelty, setOrderNovelty] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Cargando pedidos de Supabase para mensajero:', user?.name);
      
      // Cargar pedidos de Supabase filtrados por mensajero
      const pedidosSupabase = await getPedidosByMensajero(user?.name || '');
      console.log('Pedidos cargados para', user?.name, ':', pedidosSupabase.length);
      
      // Convertir pedidos de Supabase al formato de la aplicación
      const ordersConverted: Order[] = pedidosSupabase.map((pedido, index) => ({
        id: pedido.id_pedido,
        customerName: `Cliente ${pedido.id_pedido}`, // Usar ID del pedido como identificador
        customerPhone: '0000-0000', // Teléfono genérico
        customerAddress: pedido.distrito, // Usar distrito como dirección
        customerProvince: 'San José', // Provincia genérica
        customerCanton: 'Central', // Cantón genérico
        customerDistrict: pedido.distrito,
        customerLocationLink: pedido.link_ubicacion || undefined,
        items: [], // Items vacíos por ahora
        totalAmount: pedido.valor_total,
        status: pedido.mensajero_concretado ? 'entregado' as const : 
                pedido.mensajero_asignado ? 'en_ruta' as const : 'pendiente' as const,
        paymentMethod: 'efectivo' as const,
        origin: 'csv' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: pedido.notas || '',
        deliveryNotes: pedido.nota_asesor || '',
        assignedMessenger: pedido.mensajero_asignado ? { 
          id: '1', 
          name: pedido.mensajero_asignado, 
          email: '', 
          role: 'mensajero' as const,
          createdAt: new Date().toISOString(),
          isActive: true
        } : undefined,
      }));

      // Calcular estadísticas basadas en los datos de Supabase
      const totalOrders = ordersConverted.length;
      const deliveredOrders = ordersConverted.filter(o => o.status === 'entregado').length;
      const pendingOrders = ordersConverted.filter(o => o.status === 'pendiente').length;
      const inRouteOrders = ordersConverted.filter(o => o.status === 'en_ruta').length;
      const totalRevenue = ordersConverted.reduce((sum, o) => sum + o.totalAmount, 0);
      
      const statsRes: MessengerStats = {
        totalOrders,
        deliveredOrders,
        returnedOrders: 0,
        rescheduledOrders: 0,
        pendingOrders,
        totalCash: totalRevenue,
        totalSinpe: 0,
        deliveryRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
        assignedToday: inRouteOrders,
        completedToday: deliveredOrders,
        pendingToday: pendingOrders,
        inRouteToday: inRouteOrders,
      };
      
      setAllOrders(ordersConverted);
      setStats(statsRes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar pedidos
  const filteredAndSortedOrders = allOrders
    .filter(order => {
      // Filtro por estado
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      
      // Filtro por fecha
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      let dateMatch = true;
      
      switch (dateFilter) {
        case 'today':
          dateMatch = orderDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateMatch = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateMatch = orderDate >= monthAgo;
          break;
        case 'all':
        default:
          dateMatch = true;
          break;
      }
      
      // Búsqueda por texto
      const searchMatch = searchTerm === '' || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.customerPhone.includes(searchTerm);
      
      return statusMatch && dateMatch && searchMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const updateOrderStatus = async (orderId: string, status: 'en_ruta' | 'entregado' | 'devolucion' | 'reagendado') => {
    try {
      setUpdatingOrder(orderId);
      
      // Actualizar en Supabase
      const updates: Partial<PedidoTest> = {};
      if (status === 'entregado') {
        updates.mensajero_concretado = user?.name || '';
      }
      
      await updatePedido(orderId, updates);
      
      // También actualizar en mock API para mantener consistencia
      await mockApi.updateOrderStatus(orderId, status);
      
      // Recargar datos
      await loadData();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleOrderUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      setUpdatingOrder(selectedOrder.id);
      
      // Actualizar en Supabase
      const updates: Partial<PedidoTest> = {};
      
      if (newStatus === 'entregado') {
        updates.mensajero_concretado = user?.name || '';
        if (orderComment) {
          updates.notas = orderComment;
        }
      } else if (newStatus === 'en_ruta') {
        updates.mensajero_asignado = user?.name || '';
        if (orderComment) {
          updates.notas = orderComment;
        }
      }
      
      const success = await updatePedido(selectedOrder.id, updates);
      
      if (success) {
        await loadData(); // Recargar datos
        setIsUpdateModalOpen(false);
        setSelectedOrder(null);
        setNewStatus('');
        setOrderComment('');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 rounded-xl shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">¡Hola, {user?.name}!</h1>
              <p className="text-sm opacity-90">{allOrders.length} pedidos en tu historial</p>
            </div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">Estado actual</span>
            </div>
            <Badge className="bg-green-500 hover:bg-green-600 mt-1">
              Activo
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild className="h-16 bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/dashboard/mensajero/mi-ruta-hoy">
            <div className="flex flex-col items-center gap-1">
              <Route className="w-6 h-6" />
              <span className="text-sm font-medium">Mi Ruta Hoy</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-16 bg-green-600 hover:bg-green-700 text-white">
          <Link href="/dashboard/mensajero/comprobante-sinpe">
            <div className="flex flex-col items-center gap-1">
              <CreditCard className="w-6 h-6" />
              <span className="text-sm font-medium">Comprobante SINPE</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-16 bg-orange-600 hover:bg-orange-700 text-white">
          <Link href="/dashboard/mensajero/comprobante-reagendado">
            <div className="flex flex-col items-center gap-1">
              <Calendar className="w-6 h-6" />
              <span className="text-sm font-medium">Reagendado</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-16 bg-purple-600 hover:bg-purple-700 text-white">
          <Link href="/dashboard/mensajero/route-history">
            <div className="flex flex-col items-center gap-1">
              <History className="w-6 h-6" />
              <span className="text-sm font-medium">Historial</span>
            </div>
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">Completados</p>
                <p className="text-lg font-bold text-green-700">{allOrders.filter(o => o.status === 'entregado').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-medium">Efectividad</p>
                <p className="text-lg font-bold text-blue-700">
                  {allOrders.length > 0 ? Math.round((allOrders.filter(o => o.status === 'entregado').length / allOrders.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda Avanzada */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Historial de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por ID, cliente, dirección o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="en_ruta">En Ruta</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="devolucion">Devolución</SelectItem>
                <SelectItem value="reagendado">Reagendado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el historial</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'date' | 'status' | 'amount') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha</SelectItem>
                <SelectItem value="status">Estado</SelectItem>
                <SelectItem value="amount">Monto</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Más reciente</SelectItem>
                <SelectItem value="asc">Más antiguo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resumen de resultados */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {filteredAndSortedOrders.length} de {allOrders.length} pedidos
            </span>
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'No se encontraron pedidos con esos criterios' 
                  : 'No hay pedidos en el historial'
                }
              </p>
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                  className="mt-2"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredAndSortedOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          order.status === 'entregado' ? 'bg-green-500' :
                          order.status === 'en_ruta' ? 'bg-blue-500' :
                          order.status === 'devolucion' ? 'bg-red-500' :
                          'bg-orange-500'
                        }`} />
                        <h3 className="font-semibold">{order.id}</h3>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{order.deliveryAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => order.customerPhone && window.open(`tel:${order.customerPhone}`)}
                        className="flex-1"
                        disabled={!order.customerPhone}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Llamar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (order.deliveryAddress) {
                            const encodedAddress = encodeURIComponent(order.deliveryAddress);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
                          }
                        }}
                        className="flex-1"
                        disabled={!order.deliveryAddress}
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Ruta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsUpdateModalOpen(true);
                        }}
                        className="flex-1"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Actualizar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para actualizar pedido */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Actualizar Estado del Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Pedido: {selectedOrder.id}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-600">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
              
              <div className="space-y-3">
                <Label>Nuevo Estado</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_ruta">En Ruta</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="devolucion">Devolución</SelectItem>
                    <SelectItem value="reagendado">Reagendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Comentarios (opcional)</Label>
                <Textarea
                  placeholder="Añadir comentarios sobre el pedido..."
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedOrder(null);
                    setNewStatus('');
                    setOrderComment('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleOrderUpdate}
                  disabled={!newStatus || updatingOrder === selectedOrder.id}
                  className="flex-1"
                >
                  {updatingOrder === selectedOrder.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Actualizar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}