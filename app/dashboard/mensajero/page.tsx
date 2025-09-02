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
  Building2
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/20 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold mb-1 flex items-center">
              <span className="bg-white/20 p-2 rounded-full mr-3 shadow-inner">
                <User className="w-6 h-6" />
              </span>
              ¡Hola, {user?.name}!
            </h1>
            <p className="opacity-90 text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2 animate-pulse" />
              Tienes <span className="font-bold mx-1">{assignedOrders.length}</span> pedidos asignados hoy
            </p>
          </div>
          <div className="text-right bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20 shadow-inner w-full sm:w-auto">
            <p className="text-sm opacity-90 mb-2">Estado actual</p>
            <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none shadow-md mb-3">
              {assignedOrders.some(o => o.status === 'en_ruta') ? 'En Ruta' : 'Disponible'}
            </Badge>
            <div>
              <Button variant="outline" size="sm" asChild className="bg-white/20 text-white border-white/30 hover:bg-white/30 shadow-md transition-all duration-300 hover:scale-105">
                <Link href="/dashboard/mensajero/profile">
                  <User className="w-4 h-4 mr-2" />
                  Mi Perfil
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Asignados Hoy"
            value={assignedOrders.length}
            icon={Clock}
            className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 shadow-md shadow-yellow-100/50 hover:shadow-lg hover:shadow-yellow-200/50 transition-all duration-300 transform hover:-translate-y-1"
          />
          <StatsCard
            title="Completados Hoy"
            value={ordersByStatus.completed.length}
            icon={CheckCircle}
            className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-md shadow-green-100/50 hover:shadow-lg hover:shadow-green-200/50 transition-all duration-300 transform hover:-translate-y-1"
          />
          <StatsCard
            title="Total Entregados"
            value={stats.deliveredOrders}
            icon={Truck}
            className="bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200 shadow-md shadow-blue-100/50 hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-300 transform hover:-translate-y-1"
          />
          <StatsCard
            title="Efectividad"
            value={`${stats.deliveryRate}%`}
            icon={TrendingUp}
            className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-md shadow-purple-100/50 hover:shadow-lg hover:shadow-purple-200/50 transition-all duration-300 transform hover:-translate-y-1"
          />
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-md border-slate-200/60 overflow-hidden backdrop-blur-sm">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
            <Filter className="w-4 h-4 mr-2 text-blue-500" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-white/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
              <Input
                placeholder="Buscar por ID, cliente, teléfono o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300">
                <SelectValue placeholder="Filtrar por estado" />
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
              <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300">
                <SelectValue placeholder="Filtrar por fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fechas</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all duration-300">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <div className="space-y-4">
        {/* State Selection Component */}
        <Card className="shadow-md border-slate-200/60 overflow-hidden">
          <CardContent className="p-3 sm:p-4 lg:p-6 bg-white/50">
            {/* State Selection Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {/* Asignados Hoy */}
              <button
                onClick={() => setActiveTab('assigned')}
                className={`group relative flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'assigned'
                    ? 'bg-blue-50 border-blue-300 shadow-lg shadow-blue-100/50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`p-2 sm:p-2.5 lg:p-3 rounded-full transition-colors duration-300 ${
                  activeTab === 'assigned' ? 'bg-blue-100' : 'bg-slate-200 group-hover:bg-slate-300'
                }`}>
                  <Clock className={`w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transition-colors duration-300 ${
                    activeTab === 'assigned' ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-600'
                  }`} />
                </div>
                <div className="text-center">
                  <span className={`block font-semibold text-xs sm:text-sm lg:text-base transition-colors duration-300 ${
                    activeTab === 'assigned' ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-800'
                  }`}>
                    Asignados Hoy
                  </span>
                  <Badge variant="secondary" className={`mt-1 sm:mt-2 text-xs px-2 py-1 transition-all duration-300 ${
                    activeTab === 'assigned' 
                      ? 'bg-blue-200 text-blue-700 border-blue-300' 
                      : 'bg-slate-200 text-slate-600 border-slate-300 group-hover:bg-slate-300 group-hover:text-slate-700'
                  }`}>
                    {assignedOrders.length}
                  </Badge>
                </div>
              </button>

              {/* Completados */}
              <button
                onClick={() => setActiveTab('completed')}
                className={`group relative flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'completed'
                    ? 'bg-green-50 border-green-300 shadow-lg shadow-green-100/50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`p-2 sm:p-2.5 lg:p-3 rounded-full transition-colors duration-300 ${
                  activeTab === 'completed' ? 'bg-green-100' : 'bg-slate-200 group-hover:bg-slate-300'
                }`}>
                  <CheckCircle className={`w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transition-colors duration-300 ${
                    activeTab === 'completed' ? 'text-green-600' : 'text-slate-500 group-hover:text-slate-600'
                  }`} />
                </div>
                <div className="text-center">
                  <span className={`block font-semibold text-xs sm:text-sm lg:text-base transition-colors duration-300 ${
                    activeTab === 'completed' ? 'text-green-700' : 'text-slate-700 group-hover:text-slate-800'
                  }`}>
                    Completados
                  </span>
                  <Badge variant="secondary" className={`mt-1 sm:mt-2 text-xs px-2 py-1 transition-all duration-300 ${
                    activeTab === 'completed' 
                      ? 'bg-green-200 text-green-700 border-green-300' 
                      : 'bg-slate-200 text-slate-600 border-slate-300 group-hover:bg-slate-300 group-hover:text-slate-700'
                  }`}>
                    {ordersByStatus.completed.length}
                  </Badge>
                </div>
              </button>

              {/* Devoluciones */}
              <button
                onClick={() => setActiveTab('returned')}
                className={`group relative flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'returned'
                    ? 'bg-orange-50 border-orange-300 shadow-lg shadow-orange-100/50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`p-2 sm:p-2.5 lg:p-3 rounded-full transition-colors duration-300 ${
                  activeTab === 'returned' ? 'bg-orange-100' : 'bg-slate-200 group-hover:bg-slate-300'
                }`}>
                  <RotateCcw className={`w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transition-colors duration-300 ${
                    activeTab === 'returned' ? 'text-orange-600' : 'text-slate-500 group-hover:text-slate-600'
                  }`} />
                </div>
                <div className="text-center">
                  <span className={`block font-semibold text-xs sm:text-sm lg:text-base transition-colors duration-300 ${
                    activeTab === 'returned' ? 'text-orange-700' : 'text-slate-700 group-hover:text-slate-800'
                  }`}>
                    Devoluciones
                  </span>
                  <Badge variant="secondary" className={`mt-1 sm:mt-2 text-xs px-2 py-1 transition-all duration-300 ${
                    activeTab === 'returned' 
                      ? 'bg-orange-200 text-orange-700 border-orange-300' 
                      : 'bg-slate-200 text-slate-600 border-slate-300 group-hover:bg-slate-300 group-hover:text-slate-700'
                  }`}>
                    {ordersByStatus.returned.length}
                  </Badge>
                </div>
              </button>

              {/* Historial */}
              <button
                onClick={() => setActiveTab('history')}
                className={`group relative flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  activeTab === 'history'
                    ? 'bg-purple-50 border-purple-300 shadow-lg shadow-purple-100/50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`p-2 sm:p-2.5 lg:p-3 rounded-full transition-colors duration-300 ${
                  activeTab === 'history' ? 'bg-purple-100' : 'bg-slate-200 group-hover:bg-slate-300'
                }`}>
                  <History className={`w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transition-colors duration-300 ${
                    activeTab === 'history' ? 'text-purple-600' : 'text-slate-500 group-hover:text-slate-600'
                  }`} />
                </div>
                <div className="text-center">
                  <span className={`block font-semibold text-xs sm:text-sm lg:text-base transition-colors duration-300 ${
                    activeTab === 'history' ? 'text-purple-700' : 'text-slate-700 group-hover:text-slate-800'
                  }`}>
            Historial
                  </span>
                  <Badge variant="secondary" className={`mt-1 sm:mt-2 text-xs px-2 py-1 transition-all duration-300 ${
                    activeTab === 'history' 
                      ? 'bg-purple-200 text-purple-700 border-purple-300' 
                      : 'bg-slate-200 text-slate-600 border-slate-300 group-hover:bg-slate-300 group-hover:text-slate-700'
                  }`}>
                    {ordersByStatus.all.length}
                  </Badge>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
        {activeTab === 'assigned' && (
          <div className="space-y-4">
          <Card className="shadow-md border-slate-200/60 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-100 border-b border-amber-100">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <div className="bg-amber-200 p-2 rounded-full">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                Pedidos Asignados Hoy
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white/50 p-5">
              {assignedOrders.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner">
                  <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-green-100/50">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <p className="text-xl font-medium text-slate-700">¡Excelente trabajo!</p>
                  <p className="text-slate-500 mt-2">No tienes pedidos asignados para hoy</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedOrders.map((order) => (
                    <div key={order.id} className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-5 gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full shadow-md flex items-center justify-center ${
                            order.status === 'en_ruta' ? 'bg-purple-500 shadow-purple-200' :
                            order.status === 'confirmado' ? 'bg-blue-500 shadow-blue-200' :
                            'bg-orange-500 shadow-orange-200'
                          }`}>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-800">{order.id}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-1.5 rounded-full shadow-sm">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-800">{order.customerName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-1.5 rounded-full shadow-sm">
                              <Phone className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-sm text-slate-700">
                              {order.customerPhone || 'No especificado'}
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-amber-100 p-1.5 rounded-full shadow-sm mt-0.5">
                              <MapPin className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-sm text-slate-700 flex-1">
                              {order.deliveryAddress || 'Sin dirección'}
                            </span>
                          </div>
                            {/* Información del producto */}
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-1.5 rounded-full shadow-sm">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              </div>
                              <span className="text-sm text-slate-700 font-medium">
                                Producto: {order.items[0]?.product.name || 'Producto Magic Stars'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3 sm:border-l sm:pl-5 sm:border-slate-200 pt-3 sm:pt-0">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-1.5 rounded-full shadow-sm">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="font-bold text-lg text-slate-800">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          <div className="flex flex-col gap-2">
                          <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 font-medium px-3 py-1 shadow-sm">
                            {order.paymentMethod === 'sinpe' ? 'SINPE' : 'Efectivo'}
                          </Badge>
                            {/* Badge de Empresa */}
                            {order.company && (
                              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-medium px-2 py-1 text-xs">
                                <Building2 className="w-3 h-3 mr-1" />
                                {order.company.name}
                              </Badge>
                            )}
                          </div>
                          {order.notes && (
                            <div className="mt-2 bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                              <p className="text-xs text-slate-600 italic">
                                "{order.notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-5 bg-slate-50/70 p-4 rounded-lg border border-slate-100">
                        {/* Botones de acción principales eliminados - solo se mantienen los botones de comunicación y utilidades */}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => order.customerPhone && window.open(`tel:${order.customerPhone}`)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                          disabled={!order.customerPhone}
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          Llamar
                        </Button>

                          {/* Nuevos botones de comunicación y ubicación */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => order.customerPhone && window.open(`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=Hola ${order.customerName}, soy tu mensajero de Magic Stars. Te escribo sobre tu pedido ${order.id}.`)}
                            className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                            disabled={!order.customerPhone}
                          >
                            <div className="w-4 h-4 mr-2 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                              </svg>
                            </div>
                            WhatsApp
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (order.deliveryAddress) {
                                const encodedAddress = encodeURIComponent(order.deliveryAddress);
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
                              }
                            }}
                            className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                            disabled={!order.deliveryAddress}
                          >
                            <div className="w-4 h-4 mr-2 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                            </div>
                            Ubicación
                          </Button>

                          {/* Botón para ver comprobante */}
                                                     <Button
                             variant="outline"
                             size="sm"
                             onClick={() => openReceiptModal(order)}
                             className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                           >
                            <div className="w-4 h-4 mr-2 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                <path d="M14 2v6h6"/>
                                <path d="M16 13H8"/>
                                <path d="M16 17H8"/>
                                <path d="M10 9H8"/>
                              </svg>
                            </div>
                            Ver Comprobante
                          </Button>

                          {/* Botón para actualizar estado del pedido */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateModal(order)}
                            className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Actualizar Estado
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Completed Orders Tab */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Pedidos Completados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersByStatus.completed.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p>No hay pedidos completados en el período seleccionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ordersByStatus.completed.map((order) => (
                       <div key={order.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                           <div className="flex-1">
                          <p className="font-semibold">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName} - {order.deliveryAddress || 'Sin dirección'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                             {/* Información del producto */}
                             <div className="flex items-center gap-2 mt-2">
                               <div className="bg-blue-100 p-1.5 rounded-full shadow-sm">
                                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-600">
                                   <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                 </svg>
                        </div>
                               <span className="text-xs text-slate-600 font-medium">
                                 Producto: {order.items[0]?.product.name || 'Producto Magic Stars'}
                               </span>
                      </div>
                           </div>
                         </div>
                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                           <div className="text-left sm:text-right">
                        <p className="font-bold text-green-700">{formatCurrency(order.totalAmount)}</p>
                        <Badge variant="secondary" className="bg-green-200 text-green-800">
                          Entregado
                        </Badge>
                           </div>
                           <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => openReceiptModal(order)}
                               className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 w-full sm:w-auto"
                             >
                               <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                   <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                   <path d="M14 2v6h6"/>
                                   <path d="M16 13H8"/>
                                   <path d="M16 17H8"/>
                                   <path d="M10 9H8"/>
                                 </svg>
                               </div>
                               Comprobante
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => openUpdateModal(order)}
                               className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 w-full sm:w-auto"
                             >
                               <Edit3 className="w-4 h-4 mr-2" />
                               Actualizar
                             </Button>
                           </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Returned Orders Tab */}
        {activeTab === 'returned' && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-red-600" />
                Pedidos Devueltos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersByStatus.returned.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RotateCcw className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <p>No hay pedidos devueltos en el período seleccionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ordersByStatus.returned.map((order) => (
                       <div key={order.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <XCircle className="w-5 h-5 text-red-600" />
                           <div className="flex-1">
                          <p className="font-semibold">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName} - {order.deliveryAddress || 'Sin dirección'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                             {/* Información del producto */}
                             <div className="flex items-center gap-2 mt-2">
                               <div className="bg-blue-100 p-1.5 rounded-full shadow-sm">
                                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-600">
                                   <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                 </svg>
                        </div>
                               <span className="text-xs text-slate-600 font-medium">
                                 Producto: {order.items[0]?.product.name || 'Producto Magic Stars'}
                               </span>
                      </div>
                           </div>
                         </div>
                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                           <div className="text-left sm:text-right">
                        <p className="font-bold text-red-700">{formatCurrency(order.totalAmount)}</p>
                        <Badge variant="secondary" className="bg-red-200 text-red-800">
                          Devuelto
                        </Badge>
                           </div>
                           <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => openReceiptModal(order)}
                               className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 w-full sm:w-auto"
                             >
                               <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                   <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                   <path d="M14 2v6h6"/>
                                   <path d="M16 13H8"/>
                                   <path d="M16 17H8"/>
                                   <path d="M10 9H8"/>
                                 </svg>
                               </div>
                               Comprobante
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => openUpdateModal(order)}
                               className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 w-full sm:w-auto"
                             >
                               <Edit3 className="w-4 h-4 mr-2" />
                               Actualizar
                             </Button>
                           </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial Completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ordersByStatus.all.map((order) => (
                    <div key={order.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        order.status === 'entregado' ? 'bg-green-500' :
                        order.status === 'devolucion' ? 'bg-red-500' :
                        order.status === 'en_ruta' ? 'bg-purple-500' :
                        order.status === 'confirmado' ? 'bg-blue-500' :
                        'bg-orange-500'
                      }`} />
                        <div className="flex-1">
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName} - {formatDate(order.createdAt)}
                        </p>
                          {/* Información del producto */}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="bg-blue-100 p-1 rounded-full shadow-sm">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-blue-600">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                      </div>
                            <span className="text-xs text-slate-600 font-medium">
                              Producto: {order.items[0]?.product.name || 'Producto Magic Stars'}
                            </span>
                    </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="text-left sm:text-right">
                      <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                      <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReceiptModal(order)}
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 w-full sm:w-auto"
                          >
                            <div className="w-4 h-4 mr-2 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                <path d="M14 2v6h6"/>
                                <path d="M16 13H8"/>
                                <path d="M16 17H8"/>
                                <path d="M10 9H8"/>
                              </svg>
                            </div>
                            Comprobante
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateModal(order)}
                            className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 w-full sm:w-auto"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Actualizar
                          </Button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        )}
      </div>

      {/* Modal para actualizar estado del pedido */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit3 className="w-5 h-5 text-amber-600" />
              Actualizar Estado del Pedido
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Información del pedido */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Información del Pedido</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">ID:</span>
                    <span className="ml-2 font-medium text-slate-800">{selectedOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Cliente:</span>
                    <span className="ml-2 font-medium text-slate-800">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Estado Actual:</span>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                  <div>
                    <span className="text-slate-600">Monto:</span>
                    <span className="ml-2 font-medium text-slate-800">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Cambio de estado */}
              <div className="space-y-3">
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                  Cambiar Estado del Pedido
                </Label>
                
                {/* Selector simplificado con solo 3 opciones */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setNewStatus('entregado')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      newStatus === 'entregado'
                        ? 'bg-green-50 border-green-300 shadow-md'
                        : 'bg-white border-slate-200 hover:border-green-200 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${
                        newStatus === 'entregado' ? 'bg-green-500' : 'bg-green-300'
                      }`} />
                      <span className={`font-semibold text-sm uppercase ${
                        newStatus === 'entregado' ? 'text-green-700' : 'text-slate-700'
                      }`}>
                        Entregado
                      </span>
                      {newStatus === 'entregado' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setNewStatus('devolucion')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      newStatus === 'devolucion'
                        ? 'bg-red-50 border-red-300 shadow-md'
                        : 'bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${
                        newStatus === 'devolucion' ? 'bg-red-500' : 'bg-red-300'
                      }`} />
                      <span className={`font-semibold text-sm uppercase ${
                        newStatus === 'devolucion' ? 'text-red-700' : 'text-slate-700'
                      }`}>
                        Devolución
                      </span>
                      {newStatus === 'devolucion' && (
                        <CheckCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setNewStatus('reagendado')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      newStatus === 'reagendado'
                        ? 'bg-orange-50 border-orange-300 shadow-md'
                        : 'bg-white border-slate-200 hover:border-orange-200 hover:bg-orange-50/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${
                        newStatus === 'reagendado' ? 'bg-orange-500' : 'bg-orange-300'
                      }`} />
                      <span className={`font-semibold text-sm uppercase ${
                        newStatus === 'reagendado' ? 'text-orange-700' : 'text-slate-700'
                      }`}>
                        Reagendo
                      </span>
                      {newStatus === 'reagendado' && (
                        <CheckCircle className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Indicador de estado seleccionado */}
                {newStatus && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">Estado seleccionado:</span>
                      <OrderStatusBadge status={newStatus as any} />
                    </div>
                  </div>
                )}
              </div>

              {/* Añadir novedad */}
              <div className="space-y-3">
                <Label htmlFor="novelty" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Añadir Novedad (Opcional)
                </Label>
                <Textarea
                  id="novelty"
                  placeholder="Describe cualquier novedad o problema encontrado durante la entrega..."
                  value={orderNovelty}
                  onChange={(e) => setOrderNovelty(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Añadir comentario */}
              <div className="space-y-3">
                <Label htmlFor="comment" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Comentario de Entrega (Opcional)
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Añade detalles sobre la entrega, instrucciones especiales, o cualquier información relevante..."
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
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
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para ver comprobante */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-600">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              Comprobante de Pago
            </DialogTitle>
          </DialogHeader>
          
          {selectedReceiptOrder && (
            <div className="space-y-6">
              {/* Información del pedido */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3">Información del Pedido</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">ID del Pedido:</span>
                    <span className="ml-2 font-medium text-slate-800">{selectedReceiptOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Cliente:</span>
                    <span className="ml-2 font-medium text-slate-800">{selectedReceiptOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Método de Pago:</span>
                    <Badge variant="outline" className="ml-2">
                      {selectedReceiptOrder.paymentMethod === 'sinpe' ? 'SINPE' : 'Efectivo'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-600">Monto Total:</span>
                    <span className="ml-2 font-bold text-slate-800">{formatCurrency(selectedReceiptOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Imagen del comprobante */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Comprobante de Pago
                </Label>
                
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                  {selectedReceiptOrder.paymentMethod === 'sinpe' ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-emerald-600">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Comprobante SINPE</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Transferencia bancaria confirmada
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-slate-200 max-w-sm mx-auto">
                        <div className="text-xs text-slate-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Referencia:</span>
                            <span className="font-mono">SINPE-{selectedReceiptOrder.id.slice(-6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fecha:</span>
                            <span>{formatDate(selectedReceiptOrder.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Monto:</span>
                            <span className="font-semibold">{formatCurrency(selectedReceiptOrder.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-600">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Comprobante en Efectivo</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Pago recibido en efectivo
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-slate-200 max-w-sm mx-auto">
                        <div className="text-xs text-slate-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Recibido por:</span>
                            <span className="font-semibold">Mensajero</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fecha:</span>
                            <span>{formatDate(selectedReceiptOrder.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Monto:</span>
                            <span className="font-semibold">{formatCurrency(selectedReceiptOrder.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de cierre */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-6"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}