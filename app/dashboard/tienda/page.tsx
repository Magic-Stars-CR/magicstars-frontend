'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useTiendaPedidos } from '@/hooks/use-tienda-pedidos';
import { PedidosStats } from '@/components/dashboard/pedidos-stats';
import { PedidosTable } from '@/components/dashboard/pedidos-table';
import { 
  Building2, 
  Package, 
  TrendingUp, 
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  Filter,
  RefreshCw,
  Loader2,
  DollarSign
} from 'lucide-react';

export default function TiendaDashboard() {
  const { user } = useAuth();
  const { pedidos, loading, loadPedidos, stats: pedidosStats, hasServerSideFilters, pagination } = useTiendaPedidos(user?.tiendaName || '');
  
  const [refreshing, setRefreshing] = useState(false);

  // El hook useTiendaPedidos ya maneja la carga automática
  
  // Debug logs
  console.log('🔍 Dashboard Debug:', {
    user: user?.tiendaName,
    pedidosLength: pedidos.length,
    loading,
    firstPedido: pedidos[0]
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPedidos();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'confirmado': return 'bg-blue-100 text-blue-800';
      case 'devolucion': return 'bg-red-100 text-red-800';
      case 'reagendado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtrar pedidos por confirmar (pendientes)
  const pedidosPorConfirmar = pedidos.filter(pedido => 
    pedido.estado_pedido === 'pendiente' || pedido.estado_pedido === 'confirmado'
  );

  // Estadísticas rápidas
  const stats = {
    total: pedidos.length,
    porConfirmar: pedidosPorConfirmar.length,
    entregados: pedidos.filter(p => p.estado_pedido === 'entregado').length,
    pendientes: pedidos.filter(p => p.estado_pedido === 'pendiente').length,
    confirmados: pedidos.filter(p => p.estado_pedido === 'confirmado').length,
    totalValue: pedidos.reduce((sum, p) => sum + p.valor_total, 0),
    pendingValue: pedidosPorConfirmar.reduce((sum, p) => sum + p.valor_total, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Dashboard de {user?.tiendaName || 'Mi Tienda'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los pedidos y operaciones de tu tienda
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Debug Reload
          </Button>
          <Button asChild>
            <Link href="/dashboard/tienda/liquidacion">
              <DollarSign className="w-4 h-4 mr-2" />
              Liquidación
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/tienda/orders">
              <Filter className="w-4 h-4 mr-2" />
              Ver Pedidos
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/tienda/orders/new">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pedido
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Por Confirmar</p>
                <p className="text-3xl font-bold">{stats.porConfirmar}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entregados</p>
                <p className="text-3xl font-bold">{stats.entregados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Pendiente</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.pendingValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contadores avanzados (misma vista que Pedidos) */}
      <PedidosStats stats={pedidosStats} hasActiveFilters={hasServerSideFilters} totalPedidos={pagination.totalPedidos} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Gestión de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/tienda/orders">
                <Eye className="w-4 h-4 mr-2" />
                Ver Todos los Pedidos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/tienda/orders/new">
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Pedido
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Liquidación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/tienda/liquidacion">
                <DollarSign className="w-4 h-4 mr-2" />
                Ver Liquidación Diaria
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Gestiona la liquidación y métricas financieras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Confirmados:</span>
                <span className="font-medium">{stats.confirmados}</span>
              </div>
              <div className="flex justify-between">
                <span>Pendientes:</span>
                <span className="font-medium">{stats.pendientes}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor Total:</span>
                <span className="font-medium">{formatCurrency(stats.totalValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos recientes - misma tabla que la vista de pedidos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pedidos recientes</h2>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/tienda/orders">Ver todos</Link>
            </Button>
          </div>
        </div>
        <PedidosTable 
          pedidos={pedidos.slice(0, 10)} 
          loading={loading} 
          onEditPedido={() => {}} 
          onViewPedido={() => {}} 
          onUpdateStatus={() => {}} 
          updatingPedido={null}
        />
      </div>

      {/* Pedidos por Confirmar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pedidos por Confirmar ({stats.porConfirmar})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/tienda/orders">
                Ver Todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pedidosPorConfirmar.length > 0 ? (
              pedidosPorConfirmar.slice(0, 10).map((pedido) => (
                <div key={pedido.id_pedido} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-sm">{pedido.id_pedido}</p>
                      <p className="text-sm text-muted-foreground">{pedido.cliente_nombre || 'Sin nombre'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(pedido.fecha_creacion)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(pedido.estado_pedido || 'pendiente')}>
                      {pedido.estado_pedido?.toUpperCase() || 'PENDIENTE'}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(pedido.valor_total)}</p>
                      <p className="text-xs text-muted-foreground">{pedido.metodo_pago || 'Sin método'}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/tienda/orders">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay pedidos por confirmar</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/tienda/orders/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Nuevo Pedido
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
