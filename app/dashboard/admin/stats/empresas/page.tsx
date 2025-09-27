'use client';

import { useState, useEffect } from 'react';
import { getPedidos } from '@/lib/supabase-pedidos';
import { Order, PedidoTest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
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
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CompanyStats {
  companyName: string;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  inRouteOrders: number;
  totalRevenue: number;
  deliveryRate: number;
  avgOrderValue: number;
  topMessengers: Array<{
    name: string;
    deliveredOrders: number;
    totalEarnings: number;
  }>;
  topAreas: Array<{
    area: string;
    count: number;
  }>;
}

export default function CompanyStatsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos de empresas...');
      
      const pedidosDataResult = await getPedidos(1, 1000);
      const pedidosData = pedidosDataResult.data;
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

      // Agrupar por empresa (simulamos diferentes empresas)
      const companies = ['Magic Stars', 'Empresa A', 'Empresa B', 'Empresa C'];
      const stats: CompanyStats[] = companies.map(companyName => {
        const companyOrders = orders.filter(order => 
          (order.assignedMessenger && 'company' in order.assignedMessenger && order.assignedMessenger.company?.name === companyName) || companyName === 'Magic Stars'
        );
        
        const deliveredOrders = companyOrders.filter(o => o.status === 'entregado').length;
        const pendingOrders = companyOrders.filter(o => o.status === 'pendiente').length;
        const inRouteOrders = companyOrders.filter(o => o.status === 'en_ruta').length;
        const totalRevenue = companyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const deliveryRate = companyOrders.length > 0 ? Math.round((deliveredOrders / companyOrders.length) * 100) : 0;
        const avgOrderValue = companyOrders.length > 0 ? totalRevenue / companyOrders.length : 0;

        // Top mensajeros de la empresa
        const messengerStats: { [key: string]: { deliveredOrders: number; totalEarnings: number } } = {};
        companyOrders.forEach(order => {
          if (order.assignedMessenger && order.status === 'entregado') {
            const messengerName = order.assignedMessenger.name;
            if (!messengerStats[messengerName]) {
              messengerStats[messengerName] = { deliveredOrders: 0, totalEarnings: 0 };
            }
            messengerStats[messengerName].deliveredOrders++;
            messengerStats[messengerName].totalEarnings += order.totalAmount;
          }
        });

        const topMessengers = Object.entries(messengerStats)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.deliveredOrders - a.deliveredOrders)
          .slice(0, 3);

        // Top áreas de la empresa
        const areaStats: { [key: string]: number } = {};
        companyOrders.forEach(order => {
          if (order.customerAddress) {
            const area = order.customerAddress.split(',')[0].trim();
            areaStats[area] = (areaStats[area] || 0) + 1;
          }
        });

        const topAreas = Object.entries(areaStats)
          .map(([area, count]) => ({ area, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        return {
          companyName,
          totalOrders: companyOrders.length,
          deliveredOrders,
          pendingOrders,
          inRouteOrders,
          totalRevenue,
          deliveryRate,
          avgOrderValue,
          topMessengers,
          topAreas,
        };
      });

      setCompanyStats(stats);
      
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

  const filteredStats = selectedCompany === 'all' 
    ? companyStats 
    : companyStats.filter(stat => stat.companyName === selectedCompany);

  const totalStats = companyStats.reduce((acc, stat) => ({
    totalOrders: acc.totalOrders + stat.totalOrders,
    deliveredOrders: acc.deliveredOrders + stat.deliveredOrders,
    pendingOrders: acc.pendingOrders + stat.pendingOrders,
    inRouteOrders: acc.inRouteOrders + stat.inRouteOrders,
    totalRevenue: acc.totalRevenue + stat.totalRevenue,
  }), {
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    inRouteOrders: 0,
    totalRevenue: 0,
  });

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
              <Building2 className="w-8 h-8 text-purple-600" />
              Estadísticas por Empresa
            </h1>
            <p className="text-muted-foreground">
              Análisis detallado del rendimiento por empresa
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

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtrar por empresa:</span>
            </div>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {companyStats.map(stat => (
                  <SelectItem key={stat.companyName} value={stat.companyName}>
                    {stat.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumen General */}
      {selectedCompany === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
                  <p className="text-2xl font-bold">{totalStats.totalOrders}</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</p>
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
                  <p className="text-2xl font-bold">
                    {totalStats.totalOrders > 0 ? Math.round((totalStats.deliveredOrders / totalStats.totalOrders) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empresas Activas</p>
                  <p className="text-2xl font-bold">{companyStats.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estadísticas por Empresa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStats.map((stat) => (
          <Card key={stat.companyName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                {stat.companyName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Métricas principales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stat.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stat.totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">Ingresos</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stat.deliveryRate}%</p>
                  <p className="text-sm text-muted-foreground">Tasa de Entrega</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stat.avgOrderValue)}</p>
                  <p className="text-sm text-muted-foreground">Valor Promedio</p>
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
                </div>
              </div>

              {/* Top mensajeros */}
              {stat.topMessengers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Top Mensajeros</h4>
                  <div className="space-y-1">
                    {stat.topMessengers.map((messenger, index) => (
                      <div key={messenger.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium">{messenger.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{messenger.deliveredOrders} entregas</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(messenger.totalEarnings)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top áreas */}
              {stat.topAreas.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Zonas Más Activas</h4>
                  <div className="space-y-1">
                    {stat.topAreas.map((area, index) => (
                      <div key={area.area} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium">{area.area}</span>
                        </div>
                        <span className="text-sm font-medium">{area.count} pedidos</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
