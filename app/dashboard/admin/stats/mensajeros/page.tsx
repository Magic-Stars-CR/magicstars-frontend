'use client';

import { useState, useEffect } from 'react';
import { getPedidos } from '@/lib/supabase-pedidos';
import { Order, PedidoTest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserCheck, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Building2,
  Calendar,
  Download,
  Filter,
  PieChart,
  Activity,
  Target,
  Clock,
  MapPin,
  ArrowLeft,
  Star,
  Award,
  Zap
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface MessengerStats {
  messengerId: string;
  messengerName: string;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  inRouteOrders: number;
  returnedOrders: number;
  totalEarnings: number;
  avgOrderValue: number;
  deliveryRate: number;
  efficiency: number;
  topAreas: Array<{
    area: string;
    count: number;
  }>;
  recentOrders: Order[];
  performance: 'excelente' | 'bueno' | 'regular' | 'mejorable';
}

export default function MessengerStatsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [messengerStats, setMessengerStats] = useState<MessengerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessenger, setSelectedMessenger] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');
  const [sortBy, setSortBy] = useState<string>('deliveredOrders');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos de mensajeros...');
      
      const pedidosData = await getPedidos();
      console.log('Pedidos cargados:', pedidosData.length);
      
      // Convertir pedidos de Supabase a formato Order
      const orders: Order[] = pedidosData.map((pedido: PedidoTest) => ({
        id: pedido.id_pedido,
        customerName: `Cliente ${pedido.id_pedido}`,
        customerPhone: '0000-0000',
        customerAddress: pedido.distrito,
        customerProvince: 'San José',
        customerCanton: 'Central',
        customerDistrict: pedido.distrito,
        customerLocationLink: pedido.link_ubicacion || undefined,
        items: [],
        totalAmount: pedido.valor_total,
        status: pedido.mensajero_concretado ? 'entregado' : (pedido.mensajero_asignado ? 'en_ruta' : 'pendiente'),
        paymentMethod: 'efectivo' as const,
        origin: 'csv' as const,
        assignedMessenger: pedido.mensajero_asignado ? {
          id: `msg-${pedido.mensajero_asignado}`,
          name: pedido.mensajero_asignado,
          email: `${pedido.mensajero_asignado.toLowerCase()}@magicstars.com`,
          role: 'mensajero' as const,
          phone: '+506 0000-0000',
          company: {
            id: 'company-1',
            name: 'Magic Stars',
            taxId: '123456789',
            address: 'San José, Costa Rica',
            phone: '+506 0000-0000',
            email: 'info@magicstars.com',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } : undefined,
        deliveryNotes: pedido.nota_asesor || undefined,
        notes: pedido.notas || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setOrders(orders);

      // Obtener mensajeros únicos
      const uniqueMessengers = Array.from(new Set(
        orders.map(o => o.assignedMessenger?.name).filter(Boolean)
      )) as string[];

      const stats: MessengerStats[] = uniqueMessengers.map((messengerName, index) => {
        const messengerOrders = orders.filter(o => o.assignedMessenger?.name === messengerName);
        
        const deliveredOrders = messengerOrders.filter(o => o.status === 'entregado').length;
        const pendingOrders = messengerOrders.filter(o => o.status === 'pendiente').length;
        const inRouteOrders = messengerOrders.filter(o => o.status === 'en_ruta').length;
        const returnedOrders = messengerOrders.filter(o => o.status === 'devolucion').length;
        
        const totalEarnings = deliveredOrders > 0 
          ? messengerOrders.filter(o => o.status === 'entregado').reduce((sum, o) => sum + o.totalAmount, 0)
          : 0;
        
        const avgOrderValue = deliveredOrders > 0 ? totalEarnings / deliveredOrders : 0;
        const deliveryRate = messengerOrders.length > 0 ? Math.round((deliveredOrders / messengerOrders.length) * 100) : 0;
        const efficiency = messengerOrders.length > 0 ? Math.round((deliveredOrders / (deliveredOrders + returnedOrders + pendingOrders)) * 100) : 0;

        // Top áreas del mensajero
        const areaStats: { [key: string]: number } = {};
        messengerOrders.forEach(order => {
          if (order.customerAddress) {
            const area = order.customerAddress.split(',')[0].trim();
            areaStats[area] = (areaStats[area] || 0) + 1;
          }
        });

        const topAreas = Object.entries(areaStats)
          .map(([area, count]) => ({ area, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        // Pedidos recientes del mensajero
        const recentOrders = messengerOrders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        // Determinar nivel de rendimiento
        let performance: 'excelente' | 'bueno' | 'regular' | 'mejorable' = 'mejorable';
        if (deliveryRate >= 95 && efficiency >= 90) performance = 'excelente';
        else if (deliveryRate >= 85 && efficiency >= 80) performance = 'bueno';
        else if (deliveryRate >= 70 && efficiency >= 70) performance = 'regular';

        return {
          messengerId: `msg-${index + 1}`,
          messengerName,
          totalOrders: messengerOrders.length,
          deliveredOrders,
          pendingOrders,
          inRouteOrders,
          returnedOrders,
          totalEarnings,
          avgOrderValue,
          deliveryRate,
          efficiency,
          topAreas,
          recentOrders,
          performance,
        };
      });

      // Ordenar por criterio seleccionado
      const sortedStats = stats.sort((a, b) => {
        switch (sortBy) {
          case 'deliveredOrders':
            return b.deliveredOrders - a.deliveredOrders;
          case 'totalEarnings':
            return b.totalEarnings - a.totalEarnings;
          case 'deliveryRate':
            return b.deliveryRate - a.deliveryRate;
          case 'efficiency':
            return b.efficiency - a.efficiency;
          default:
            return b.deliveredOrders - a.deliveredOrders;
        }
      });

      setMessengerStats(sortedStats);
      
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

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excelente': return 'bg-green-100 text-green-800 border-green-200';
      case 'bueno': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'regular': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mejorable': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excelente': return <Award className="w-4 h-4" />;
      case 'bueno': return <Star className="w-4 h-4" />;
      case 'regular': return <Zap className="w-4 h-4" />;
      case 'mejorable': return <Clock className="w-4 h-4" />;
      default: return <UserCheck className="w-4 h-4" />;
    }
  };

  const filteredStats = selectedMessenger === 'all' 
    ? messengerStats 
    : messengerStats.filter(stat => stat.messengerName === selectedMessenger);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-blue-600" />
              Estadísticas por Mensajero
            </h1>
            <p className="text-muted-foreground">
              Análisis detallado del rendimiento individual de cada mensajero
            </p>
          </div>
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

      {/* Filtros y Ordenamiento */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtrar por mensajero:</span>
            </div>
            <Select value={selectedMessenger} onValueChange={setSelectedMessenger}>
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los mensajeros</SelectItem>
                {messengerStats.map(stat => (
                  <SelectItem key={stat.messengerId} value={stat.messengerName}>
                    {stat.messengerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Ordenar por:</span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deliveredOrders">Entregas</SelectItem>
                <SelectItem value="totalEarnings">Ingresos</SelectItem>
                <SelectItem value="deliveryRate">Tasa de Entrega</SelectItem>
                <SelectItem value="efficiency">Eficiencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ranking de Mensajeros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStats.map((stat, index) => (
          <Card key={stat.messengerId} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                  {stat.messengerName}
                </CardTitle>
                <Badge className={getPerformanceColor(stat.performance)}>
                  <div className="flex items-center gap-1">
                    {getPerformanceIcon(stat.performance)}
                    {stat.performance.charAt(0).toUpperCase() + stat.performance.slice(1)}
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Métricas principales */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{stat.deliveredOrders}</p>
                  <p className="text-xs text-muted-foreground">Entregados</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{formatCurrency(stat.totalEarnings)}</p>
                  <p className="text-xs text-muted-foreground">Ingresos</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xl font-bold text-purple-600">{stat.deliveryRate}%</p>
                  <p className="text-xs text-muted-foreground">Tasa Entrega</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-xl font-bold text-orange-600">{stat.efficiency}%</p>
                  <p className="text-xs text-muted-foreground">Eficiencia</p>
                </div>
              </div>

              {/* Estados de pedidos */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Distribución de Pedidos</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Entregados
                    </span>
                    <span className="font-medium">{stat.deliveredOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      En Ruta
                    </span>
                    <span className="font-medium">{stat.inRouteOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Pendientes
                    </span>
                    <span className="font-medium">{stat.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Devoluciones
                    </span>
                    <span className="font-medium">{stat.returnedOrders}</span>
                  </div>
                </div>
              </div>

              {/* Top áreas */}
              {stat.topAreas.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Zonas Más Activas</h4>
                  <div className="space-y-1">
                    {stat.topAreas.map((area, areaIndex) => (
                      <div key={area.area} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">
                            {areaIndex + 1}
                          </div>
                          <span className="text-sm font-medium">{area.area}</span>
                        </div>
                        <span className="text-sm font-medium">{area.count} pedidos</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedidos recientes */}
              {stat.recentOrders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Pedidos Recientes</h4>
                  <div className="space-y-1">
                    {stat.recentOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-blue-600" />
                          <span className="text-sm font-medium">{order.id}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('es-CR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumen de Rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Resumen de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {messengerStats.filter(s => s.performance === 'excelente').length}
              </p>
              <p className="text-sm text-muted-foreground">Excelente</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {messengerStats.filter(s => s.performance === 'bueno').length}
              </p>
              <p className="text-sm text-muted-foreground">Bueno</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {messengerStats.filter(s => s.performance === 'regular').length}
              </p>
              <p className="text-sm text-muted-foreground">Regular</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {messengerStats.filter(s => s.performance === 'mejorable').length}
              </p>
              <p className="text-sm text-muted-foreground">Mejorable</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
