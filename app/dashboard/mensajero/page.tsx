'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { mockApi } from '@/lib/mock-api';
import { Order, MessengerStats } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FileText
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MessengerDashboard() {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<MessengerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [activeTab, setActiveTab] = useState('assigned');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [orderComment, setOrderComment] = useState('');
  const [orderNovelty, setOrderNovelty] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
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
      const [ordersRes, statsRes] = await Promise.all([
        mockApi.getOrders({ 
          assignedMessengerId: user?.id,
        }),
        mockApi.getMessengerStats(user?.id || ''),
      ]);
      
      setAllOrders(ordersRes);
      setStats(statsRes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'en_ruta' | 'entregado' | 'devolucion' | 'reagendado') => {
    try {
      setUpdatingOrder(orderId);
      
      // Actualizar el estado del pedido
      await mockApi.updateOrderStatus(orderId, status);
      
      // Manejar inventario automáticamente según el estado
      try {
        if (status === 'en_ruta') {
          // Descontar inventario cuando el pedido se monta a ruta
          await mockApi.processOrderInventory(orderId, 'mount');
        } else if (status === 'entregado') {
          // Confirmar entrega (no cambia stock, solo registra)
          await mockApi.processOrderInventory(orderId, 'deliver');
        } else if (['devolucion', 'reagendado'].includes(status)) {
          // Devolver inventario cuando el pedido no se entrega
          await mockApi.processOrderInventory(orderId, 'return');
        }
      } catch (inventoryError) {
        console.error('Error processing inventory:', inventoryError);
        // No fallar la actualización del pedido si hay error en inventario
      }
      
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const openUpdateModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOrderComment(order.deliveryNotes || '');
    setOrderNovelty('');
    setIsUpdateModalOpen(true);
  };

  const openReceiptModal = (order: Order) => {
    setSelectedReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  const handleOrderUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    
    setIsUpdatingOrder(true);
    try {
      // Aquí podrías llamar a tu API para actualizar el pedido
      await mockApi.updateOrderStatus(selectedOrder.id, newStatus as any, orderComment);
      
      // Cerrar modal y recargar datos
      setIsUpdateModalOpen(false);
      setSelectedOrder(null);
      await loadData();
      
      // Limpiar formulario
      setNewStatus('');
      setOrderComment('');
      setOrderNovelty('');
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsUpdatingOrder(false);
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

  const getFilteredOrders = () => {
    let filtered = allOrders;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm)) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtrar por fecha
    if (dateFilter !== 'all') {
      const today = new Date();
      const orderDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(order => 
            new Date(order.createdAt).toDateString() === today.toDateString()
          );
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => 
            new Date(order.createdAt) >= weekAgo
          );
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => 
            new Date(order.createdAt) >= monthAgo
          );
          break;
      }
    }

    return filtered;
  };

  const getOrdersByStatus = () => {
    const filtered = getFilteredOrders();
    const today = new Date().toDateString();
    
    return {
      assigned: filtered.filter(o => 
        ['confirmado', 'en_ruta', 'reagendado'].includes(o.status) && 
        new Date(o.createdAt).toDateString() === today
      ),
      completed: filtered.filter(o => o.status === 'entregado'),
      returned: filtered.filter(o => o.status === 'devolucion'),
      all: filtered
    };
  };

  const getOrderPriority = (order: Order) => {
    if (order.status === 'en_ruta') return 1;
    if (order.status === 'confirmado') return 2;
    if (order.status === 'reagendado') return 3;
    return 4;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const ordersByStatus = getOrdersByStatus();
  const assignedOrders = ordersByStatus.assigned.sort((a, b) => getOrderPriority(a) - getOrderPriority(b));

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
              <p className="text-sm opacity-90">
                {assignedOrders.length} pedidos asignados hoy
            </p>
          </div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90 mb-1">Estado actual</p>
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none">
              {assignedOrders.some(o => o.status === 'en_ruta') ? 'En Ruta' : 'Disponible'}
            </Badge>
              </div>
              <Button variant="outline" size="sm" asChild className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Link href="/dashboard/mensajero/profile">
                  <User className="w-4 h-4 mr-1" />
                  Perfil
                </Link>
              </Button>
            </div>
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
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Completados</p>
                  <p className="text-lg font-bold text-green-700">{ordersByStatus.completed.length}</p>
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
                  <p className="text-lg font-bold text-blue-700">{stats.deliveryRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-3">
            <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
              placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('assigned')}
          className={`p-3 rounded-lg border-2 transition-all ${
                  activeTab === 'assigned'
              ? 'bg-blue-50 border-blue-300'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${
              activeTab === 'assigned' ? 'text-blue-600' : 'text-slate-500'
                  }`} />
            <span className={`text-sm font-medium ${
              activeTab === 'assigned' ? 'text-blue-700' : 'text-slate-700'
            }`}>
              Asignados ({assignedOrders.length})
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
          className={`p-3 rounded-lg border-2 transition-all ${
                  activeTab === 'completed'
              ? 'bg-green-50 border-green-300'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${
              activeTab === 'completed' ? 'text-green-600' : 'text-slate-500'
                  }`} />
            <span className={`text-sm font-medium ${
              activeTab === 'completed' ? 'text-green-700' : 'text-slate-700'
            }`}>
              Completados ({ordersByStatus.completed.length})
                  </span>
                </div>
              </button>
                </div>

        {/* Tab Content */}
        {activeTab === 'assigned' && (
        <div className="space-y-3">
              {assignedOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium text-slate-700">¡Excelente trabajo!</p>
                <p className="text-slate-500">No tienes pedidos asignados para hoy</p>
              </CardContent>
            </Card>
          ) : (
            assignedOrders.map((order) => (
              <Card key={order.id} className="p-4">
                        <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        order.status === 'en_ruta' ? 'bg-blue-500' :
                        order.status === 'confirmado' ? 'bg-green-500' :
                        'bg-orange-500'
                      }`} />
                      <h3 className="font-semibold">{order.id}</h3>
                            </div>
                    <Badge variant="outline">
                      {order.status}
                    </Badge>
                        </div>
                        
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{order.customerName}</span>
                            </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{order.customerPhone || 'No especificado'}</span>
                          </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="truncate">{order.deliveryAddress}</span>
                          </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
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
                  </div>

                  {order.status !== 'entregado' && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                                     <Button
                             size="sm"
                        onClick={() => updateOrderStatus(order.id, 'entregado')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Entregado
                          </Button>
                          <Button
                            size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'devolucion')}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Devolver
                          </Button>
                </div>
              )}
                </div>
          </Card>
            ))
          )}
          </div>
        )}

        {/* Completed Orders Tab */}
        {activeTab === 'completed' && (
        <div className="space-y-3">
              {ordersByStatus.completed.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium text-slate-700">No hay pedidos completados</p>
                <p className="text-slate-500">Los pedidos completados aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            ordersByStatus.completed.map((order) => (
              <Card key={order.id} className="p-4 bg-green-50 border-green-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold">{order.id}</h3>
                        </div>
                        <Badge variant="secondary" className="bg-green-200 text-green-800">
                          Entregado
                        </Badge>
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
                      <span className="font-semibold text-green-700">{formatCurrency(order.totalAmount)}</span>
                      </div>
                           </div>

                  <div className="flex gap-2">
                          <Button
                            size="sm"
                      variant="outline"
                            onClick={() => openReceiptModal(order)}
                      className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                            Comprobante
                          </Button>
                          <Button
                            size="sm"
                      variant="outline"
                            onClick={() => openUpdateModal(order)}
                      className="flex-1 border-amber-200 text-amber-600 hover:bg-amber-50"
                          >
                      <Edit3 className="w-4 h-4 mr-1" />
                            Actualizar
                          </Button>
                        </div>
                    </div>
          </Card>
            ))
        )}
      </div>
      )}


      {/* Modal para actualizar estado del pedido */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              Actualizar Estado
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Información del pedido */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium mb-2">Pedido: {selectedOrder.id}</h3>
                <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-600">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>

              {/* Cambio de estado */}
              <div className="space-y-3">
                <Label>Cambiar Estado</Label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setNewStatus('entregado')}
                    className={`p-3 rounded-lg border-2 text-left ${
                      newStatus === 'entregado'
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        newStatus === 'entregado' ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span className="font-medium">Entregado</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setNewStatus('devolucion')}
                    className={`p-3 rounded-lg border-2 text-left ${
                      newStatus === 'devolucion'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        newStatus === 'devolucion' ? 'bg-red-500' : 'bg-gray-300'
                      }`} />
                      <span className="font-medium">Devolución</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setNewStatus('reagendado')}
                    className={`p-3 rounded-lg border-2 text-left ${
                      newStatus === 'reagendado'
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        newStatus === 'reagendado' ? 'bg-orange-500' : 'bg-gray-300'
                      }`} />
                      <span className="font-medium">Reagendado</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Comentario */}
              <div className="space-y-2">
                <Label>Comentario (Opcional)</Label>
                <Textarea
                  placeholder="Añade detalles sobre la entrega..."
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="flex-1"
                  disabled={isUpdatingOrder}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleOrderUpdate}
                  disabled={!newStatus || isUpdatingOrder}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {isUpdatingOrder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para ver comprobante */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Comprobante
            </DialogTitle>
          </DialogHeader>
          
          {selectedReceiptOrder && (
            <div className="space-y-4">
              {/* Información del pedido */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium mb-2">Pedido: {selectedReceiptOrder.id}</h3>
                <p className="text-sm text-gray-600">{selectedReceiptOrder.customerName}</p>
                <p className="text-sm text-gray-600">
                  {selectedReceiptOrder.paymentMethod === 'sinpe' ? 'SINPE' : 'Efectivo'}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {formatCurrency(selectedReceiptOrder.totalAmount)}
                </p>
              </div>

              {/* Comprobante */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                {selectedReceiptOrder.paymentMethod === 'sinpe' ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CreditCard className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Comprobante SINPE</h4>
                      <p className="text-sm text-gray-600">Transferencia confirmada</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Referencia:</span>
                        <span className="font-mono">SINPE-{selectedReceiptOrder.id.slice(-6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monto:</span>
                        <span className="font-semibold">{formatCurrency(selectedReceiptOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Comprobante Efectivo</h4>
                      <p className="text-sm text-gray-600">Pago recibido</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Recibido por:</span>
                        <span className="font-semibold">Mensajero</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monto:</span>
                        <span className="font-semibold">{formatCurrency(selectedReceiptOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de cierre */}
              <Button
                variant="outline"
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}