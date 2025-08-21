'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { Order, Stats, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  UserCheck,
  Calendar,
  Download,
  Filter,
  PieChart,
  Activity,
  Target,
  Clock,
  MapPin
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function AdminStatsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes, usersRes] = await Promise.all([
        mockApi.getOrders(),
        mockApi.getStats(),
        mockApi.getUsers(),
      ]);
      setOrders(ordersRes);
      setStats(statsRes);
      setUsers(usersRes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  const getPaymentMethodCount = (method: string) => {
    return orders.filter(order => order.paymentMethod === method).length;
  };

  const getTopMessengers = () => {
    const messengerStats = users
      .filter(u => u.role === 'mensajero')
      .map(messenger => {
        const deliveredOrders = orders.filter(
          order => order.assignedMessenger?.id === messenger.id && order.status === 'entregado'
        );
        const totalEarnings = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        return {
          ...messenger,
          deliveredOrders: deliveredOrders.length,
          totalEarnings,
          avgOrderValue: deliveredOrders.length > 0 ? totalEarnings / deliveredOrders.length : 0
        };
      })
      .sort((a, b) => b.deliveredOrders - a.deliveredOrders)
      .slice(0, 5);
    
    return messengerStats;
  };

  const getTopAreas = () => {
    const areaStats: { [key: string]: number } = {};
    orders.forEach(order => {
      const area = order.deliveryAddress.split(',')[0].trim();
      areaStats[area] = (areaStats[area] || 0) + 1;
    });
    
    return Object.entries(areaStats)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getDailyStats = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = orders.filter(order => 
        order.createdAt.startsWith(date)
      );
      
      return {
        date: new Date(date).toLocaleDateString('es-CR', { month: 'short', day: 'numeric' }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        delivered: dayOrders.filter(o => o.status === 'entregado').length
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const topMessengers = getTopMessengers();
  const topAreas = getTopAreas();
  const dailyStats = getDailyStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas Detalladas</h1>
          <p className="text-muted-foreground">
            Análisis completo del rendimiento del negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
                <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">+12%</span>
                  <span className="text-muted-foreground">vs mes anterior</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">
                  {formatCurrency((stats?.totalCash || 0) + (stats?.totalSinpe || 0))}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">+8%</span>
                  <span className="text-muted-foreground">vs mes anterior</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasa de Entrega</p>
                <p className="text-2xl font-bold">{stats?.deliveryRate || 0}%</p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">+2%</span>
                  <span className="text-muted-foreground">vs mes anterior</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensajeros Activos</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'mensajero' && u.isActive).length}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">+1</span>
                  <span className="text-muted-foreground">vs mes anterior</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Pedidos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['confirmado', 'en_ruta', 'entregado', 'devolucion', 'reagendado'].map(status => {
                const count = getStatusCount(status);
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                const statusColors = {
                  'confirmado': 'bg-blue-500',
                  'en_ruta': 'bg-yellow-500',
                  'entregado': 'bg-green-500',
                  'devolucion': 'bg-red-500',
                  'reagendado': 'bg-orange-500'
                };
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                      <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['efectivo', 'sinpe'].map(method => {
                const count = getPaymentMethodCount(method);
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                const methodColors = {
                  'efectivo': 'bg-green-500',
                  'sinpe': 'bg-blue-500'
                };
                
                return (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${methodColors[method as keyof typeof methodColors]}`} />
                      <span className="text-sm capitalize">{method}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Messengers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Top Mensajeros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMessengers.map((messenger, index) => (
                <div key={messenger.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{messenger.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {messenger.deliveredOrders} entregas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {formatCurrency(messenger.totalEarnings)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Promedio: {formatCurrency(messenger.avgOrderValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Zonas Más Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAreas.map((area, index) => (
                <div key={area.area} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{area.area}</p>
                      <p className="text-xs text-muted-foreground">
                        {area.count} pedidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {((area.count / orders.length) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tendencia de los Últimos 7 Días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {dailyStats.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-sm font-medium mb-2">{day.date}</p>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Pedidos: {day.orders}
                  </div>
                  <div className="text-xs font-medium text-green-600">
                    {formatCurrency(day.revenue)}
                  </div>
                  <div className="text-xs text-blue-600">
                    Entregados: {day.delivered}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
