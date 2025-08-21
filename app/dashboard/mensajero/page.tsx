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
  Clock3
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
  const [activeTab, setActiveTab] = useState('pending');

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
      await mockApi.updateOrderStatus(orderId, status);
      await loadData(); // Reload data
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

  const getFilteredOrders = () => {
    let filtered = allOrders;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.phone.includes(searchTerm) ||
        order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
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
    
    return {
      pending: filtered.filter(o => ['confirmado', 'en_ruta', 'reagendado'].includes(o.status)),
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
  const pendingOrders = ordersByStatus.pending.sort((a, b) => getOrderPriority(a) - getOrderPriority(b));

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">¡Hola, {user?.name}!</h1>
            <p className="opacity-90">
              Tienes {pendingOrders.length} pedidos pendientes para completar
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Estado actual</p>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {pendingOrders.some(o => o.status === 'en_ruta') ? 'En Ruta' : 'Disponible'}
            </Badge>
            <div className="mt-2">
              <Button variant="outline" size="sm" asChild className="bg-white/20 text-white border-white/30 hover:bg-white/30">
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
            title="Pendientes Hoy"
            value={pendingOrders.length}
            icon={Clock}
            className="bg-yellow-50 border-yellow-200"
          />
          <StatsCard
            title="Completados Hoy"
            value={ordersByStatus.completed.length}
            icon={CheckCircle}
            className="bg-green-50 border-green-200"
          />
          <StatsCard
            title="Total Entregados"
            value={stats.deliveredOrders}
            icon={Truck}
            className="bg-blue-50 border-blue-200"
          />
          <StatsCard
            title="Efectividad"
            value={`${stats.deliveryRate}%`}
            icon={TrendingUp}
            className="bg-purple-50 border-purple-200"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente, teléfono o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fechas</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pendientes ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Completados ({ordersByStatus.completed.length})
          </TabsTrigger>
          <TabsTrigger value="returned" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Devoluciones ({ordersByStatus.returned.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Pending Orders Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pedidos Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">¡Excelente trabajo!</p>
                  <p>No tienes pedidos pendientes para hoy</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            order.status === 'en_ruta' ? 'bg-purple-500' :
                            order.status === 'confirmado' ? 'bg-blue-500' :
                            'bg-orange-500'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-lg">{order.id}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{order.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{order.customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{order.deliveryAddress}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold text-lg">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          <Badge variant="outline">
                            {order.paymentMethod === 'sinpe' ? 'SINPE' : 'Efectivo'}
                          </Badge>
                          {order.notes && (
                            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                              {order.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.status === 'confirmado' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'en_ruta')}
                            disabled={updatingOrder === order.id}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {updatingOrder === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Truck className="w-3 h-3 mr-1" />
                            )}
                            Iniciar Ruta
                          </Button>
                        )}
                        
                        {order.status === 'en_ruta' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'entregado')}
                            disabled={updatingOrder === order.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {updatingOrder === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            Marcar Entregado
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'devolucion')}
                          disabled={updatingOrder === order.id}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          Devolución
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'reagendado')}
                          disabled={updatingOrder === order.id}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Clock3 className="w-3 h-3 mr-1" />
                          )}
                          Reagendar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${order.customer.phone}`)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Llamar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Orders Tab */}
        <TabsContent value="completed" className="space-y-4">
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
                    <div key={order.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-semibold">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer.name} - {order.deliveryAddress}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700">{formatCurrency(order.totalAmount)}</p>
                        <Badge variant="secondary" className="bg-green-200 text-green-800">
                          Entregado
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returned Orders Tab */}
        <TabsContent value="returned" className="space-y-4">
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
                    <div key={order.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-semibold">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer.name} - {order.deliveryAddress}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-700">{formatCurrency(order.totalAmount)}</p>
                        <Badge variant="secondary" className="bg-red-200 text-red-800">
                          Devuelto
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
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
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        order.status === 'entregado' ? 'bg-green-500' :
                        order.status === 'devolucion' ? 'bg-red-500' :
                        order.status === 'en_ruta' ? 'bg-purple-500' :
                        order.status === 'confirmado' ? 'bg-blue-500' :
                        'bg-orange-500'
                      }`} />
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer.name} - {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}