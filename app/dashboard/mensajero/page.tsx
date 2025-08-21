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
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function MessengerDashboard() {
  const { user } = useAuth();
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<MessengerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [ordersRes, statsRes] = await Promise.all([
        mockApi.getOrders({ 
          assignedMessengerId: user?.id,
          dateFrom: today,
          dateTo: today,
        }),
        mockApi.getMessengerStats(user?.id || ''),
      ]);
      
      setTodayOrders(ordersRes);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const pendingOrders = todayOrders.filter(o => ['confirmado', 'en_ruta', 'reagendado'].includes(o.status));
  const completedOrders = todayOrders.filter(o => o.status === 'entregado');

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">¡Hola, {user?.name}!</h1>
        <p className="opacity-90">
          Tienes {pendingOrders.length} pedidos pendientes para hoy
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Pedidos Hoy"
            value={stats.assignedToday}
            icon={Package}
            className="bg-blue-50 border-blue-200"
          />
          <StatsCard
            title="Completados"
            value={stats.completedToday}
            icon={CheckCircle}
            className="bg-green-50 border-green-200"
          />
          <StatsCard
            title="Entregados Total"
            value={stats.deliveredOrders}
            icon={Truck}
            className="bg-purple-50 border-purple-200"
          />
          <StatsCard
            title="Efectividad"
            value={`${stats.deliveryRate}%`}
            icon={DollarSign}
            className="bg-orange-50 border-orange-200"
          />
        </div>
      )}

      {/* Pending Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pedidos Pendientes ({pendingOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>¡Excelente! No tienes pedidos pendientes</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{order.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.customer.name}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">{order.customer.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer.district}, {order.customer.canton}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${order.customer.phone}`)}
                        className="flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        Llamar
                      </Button>
                      
                      <Badge variant="outline" className="text-xs">
                        {formatCurrency(order.totalAmount)}
                      </Badge>
                      
                      <Badge variant="outline" className="text-xs">
                        {order.paymentMethod.replace('_', ' ')}
                      </Badge>
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
                        En Ruta
                      </Button>
                    )}
                    
                    {['confirmado', 'en_ruta'].includes(order.status) && (
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
                        Entregado
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
                        <RotateCcw className="w-3 h-3 mr-1" />
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
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      Reagendar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Completados Hoy ({completedOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.name} - {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}