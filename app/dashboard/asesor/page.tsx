'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { mockApi } from '@/lib/mock-api';
import { Order, Stats } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { 
  Plus,
  Upload,
  Download,
  Loader2,
  Package,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  Truck
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';

export default function AsesorDashboard() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        mockApi.getOrders({ userCompanyId: user.companyId }),
        mockApi.getStats({ userCompanyId: user.companyId }),
      ]);
      
      // Get last 10 orders
      setRecentOrders(ordersRes.slice(0, 10));
      setStats(statsRes);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Dashboard Asesor</h1>
        <p className="opacity-90">
          Gestiona pedidos y supervisa las métricas de ventas
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild className="w-full">
              <Link href="/dashboard/asesor/orders/new">
                <Plus className="w-4 h-4 mr-2" />
                Añadir Pedido
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-green-200 hover:border-green-400 transition-colors">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/asesor/orders/upload">
                <Upload className="w-4 h-4 mr-2" />
                Cargar CSV
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/asesor/orders/upload">
                <Download className="w-4 h-4 mr-2" />
                Descargar Plantilla
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Pedidos"
            value={stats.totalOrders}
            icon={Package}
            trend={{ value: 12, isPositive: true }}
            className="bg-blue-50 border-blue-200"
          />
          <StatsCard
            title="Entregados"
            value={stats.deliveredOrders}
            icon={CheckCircle}
            trend={{ value: 8, isPositive: true }}
            className="bg-green-50 border-green-200"
          />
          <StatsCard
            title="Tasa de Entrega"
            value={`${stats.deliveryRate}%`}
            icon={TrendingUp}
            trend={{ value: 3, isPositive: true }}
            className="bg-purple-50 border-purple-200"
          />
        </div>
      )}

      {/* Additional Stats */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-4">
          <StatsCard
            title="Devoluciones"
            value={stats.returnedOrders}
            icon={RotateCcw}
            className="bg-red-50 border-red-200"
          />
          <StatsCard
            title="Reagendados"
            value={stats.rescheduledOrders}
            icon={Package}
            className="bg-yellow-50 border-yellow-200"
          />
          <StatsCard
            title="En Ruta"
            value={stats.pendingOrders}
            icon={Truck}
            className="bg-indigo-50 border-indigo-200"
          />
        </div>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos Recientes</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/asesor/orders">Ver Todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{order.id}</h3>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {order.customerName} • {order.customerPhone || 'Sin teléfono'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.customerDistrict}, {order.customerCanton}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {order.paymentMethod}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('es-CR')}
                  </p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/asesor/orders/${order.id}`}>
                        Ver Detalles
                      </Link>
                    </Button>
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