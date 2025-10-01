'use client';

import { useState, useEffect } from 'react';
import { getPedidos, getPedidosDelDia } from '@/lib/supabase-pedidos';
import { mockMessengers } from '@/lib/mock-messengers';
import { Order, Stats, User, PedidoTest } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Package,
  CheckCircle,
  RotateCcw,
  Truck,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  Plus,
  Upload,
  Download,
  UserCheck,
  Clock,
  Building2,
  Warehouse,
  RefreshCw,
  Phone,
  Mail,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isShowingTodayOrders, setIsShowingTodayOrders] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Actualizar el contador de tiempo cada segundo
  useEffect(() => {
    if (!canSync() && lastSyncTime) {
      const interval = setInterval(() => {
        // Forzar re-render para actualizar el contador
        setLastSyncTime(prev => prev);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [lastSyncTime]);

  const canSync = () => {
    if (!lastSyncTime) return true;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos
    return Date.now() - lastSyncTime > fiveMinutes;
  };

  const getTimeUntilNextSync = () => {
    if (!lastSyncTime) return null;
    const fiveMinutes = 5 * 60 * 1000;
    const timeLeft = fiveMinutes - (Date.now() - lastSyncTime);
    if (timeLeft <= 0) return null;
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const syncRegistries = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      
      console.log('Iniciando sincronización de registros...');
      
      const response = await fetch('https://primary-production-2b25b.up.railway.app/webhook/Sync-Today-Registries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error en la sincronización: ${response.status}`);
      }

      const result = await response.json();
      console.log('Sincronización exitosa:', result);
      
      setSyncMessage('Sincronización exitosa. Los datos se han actualizado.');
      setLastSyncTime(Date.now());
      
      // Recargar los datos después de la sincronización
      await loadData();
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setSyncMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error en la sincronización:', error);
      setSyncMessage('Error en la sincronización. Por favor, inténtalo de nuevo.');
      
      // Limpiar el mensaje de error después de 5 segundos
      setTimeout(() => {
        setSyncMessage(null);
      }, 5000);
    } finally {
      setSyncing(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos del día de hoy para admin...');
      
      // Cargar pedidos del día de hoy usando fecha de Costa Rica
      const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
      const today = getCostaRicaDateISO();
      const pedidosDelDia = await getPedidosDelDia(today);
      console.log('Pedidos del día cargados:', pedidosDelDia.length);
      
      // Cargar todos los pedidos para estadísticas generales
      const pedidosDataResult = await getPedidos(1, 1000); // Obtener muchos pedidos para estadísticas
      const pedidosData = pedidosDataResult.data;
      console.log('Total pedidos cargados:', pedidosData.length);
      
      // Usar pedidos del día si hay, sino usar los más recientes
      const pedidosParaMostrar = pedidosDelDia.length > 0 ? pedidosDelDia : pedidosData.slice(0, 10);
      const hayPedidosHoy = pedidosDelDia.length > 0;
      setIsShowingTodayOrders(hayPedidosHoy);
      console.log('Pedidos para mostrar:', pedidosParaMostrar.length, hayPedidosHoy ? '(del día de hoy)' : '(más recientes)');
      
      // Convertir pedidos a formato Order para mostrar
      const orders: Order[] = pedidosParaMostrar.map((pedido: PedidoTest) => ({
        id: pedido.id_pedido,
        customerName: pedido.cliente_nombre || `Cliente ${pedido.id_pedido}`,
        customerPhone: pedido.cliente_telefono || 'No disponible',
        customerAddress: pedido.direccion || pedido.distrito,
        customerProvince: pedido.provincia || 'San José',
        customerCanton: pedido.canton || 'Central',
        customerDistrict: pedido.distrito,
        customerLocationLink: pedido.link_ubicacion || undefined,
        items: [],
        totalAmount: pedido.valor_total,
        status: pedido.estado_pedido === 'entregado' ? 'entregado' : 
                pedido.estado_pedido === 'devolucion' ? 'devolucion' :
                pedido.estado_pedido === 'reagendado' ? 'reagendado' :
                pedido.mensajero_concretado ? 'entregado' : 
                (pedido.mensajero_asignado ? 'en_ruta' : 'pendiente'),
        paymentMethod: (pedido.metodo_pago?.toLowerCase() as any) || 'efectivo',
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
        createdAt: pedido.fecha_creacion,
        updatedAt: pedido.fecha_creacion,
      }));

      // Obtener últimos 8 pedidos
      setRecentOrders(orders.slice(0, 8));

      // Calcular estadísticas reales
      const totalOrders = pedidosData.length;
      const deliveredOrders = pedidosData.filter(p => p.mensajero_concretado).length;
      const pendingOrders = pedidosData.filter(p => !p.mensajero_asignado).length;
      const returnedOrders = 0; // No hay campo para devoluciones en la tabla actual
      const rescheduledOrders = 0; // No hay campo para reagendados en la tabla actual
      const totalCash = pedidosData.reduce((sum, p) => sum + p.valor_total, 0);
      const totalSinpe = 0; // No hay campo para Sinpe en la tabla actual
      const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

      const realStats: Stats = {
        totalOrders,
        deliveredOrders,
        pendingOrders,
        returnedOrders,
        rescheduledOrders,
        totalCash,
        totalSinpe,
        deliveryRate,
      };

      setStats(realStats);

      // Usar usuarios de los mocks en lugar de generarlos
      const allUsers = mockMessengers;
      setUsers(allUsers);
      
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

  const messengers = users.filter(u => u.role === 'mensajero');
  const advisors = users.filter(u => u.role === 'asesor');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Dashboard Administrador</h1>
        <p className="opacity-90">
          Panel de control completo para gestionar pedidos, usuarios y estadísticas
        </p>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className={`p-4 rounded-lg border ${
          syncMessage.includes('exitoso') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {syncMessage.includes('exitoso') ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <RotateCcw className="w-5 h-5" />
            )}
            <span className="font-medium">{syncMessage}</span>
          </div>
        </div>
      )}

      {/* Gestión de Pedidos - Prioridad Principal */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Gestión de Pedidos - PRINCIPAL */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild className="w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/pedidos" className="flex flex-col items-center gap-2">
                <Package className="w-8 h-8" />
                <span className="text-lg font-bold">Gestión de Pedidos</span>
                <span className="text-xs opacity-90">Editar, asignar y administrar pedidos</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Sincronizar Registros */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  disabled={syncing || !canSync()}
                  className="w-full h-24 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  variant="outline"
                >
                  <div className="flex flex-col items-center gap-2">
                    {syncing ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <RefreshCw className="w-8 h-8" />
                    )}
                    <span className="text-lg font-bold">
                      {syncing ? 'Sincronizando...' : 'Sincronizar Registros'}
                    </span>
                    <span className="text-xs opacity-90">Actualizar datos del sistema</span>
                  </div>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Sincronización</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>¿Estás seguro de que quieres sincronizar los registros con Google Sheets?</p>
                    <p className="font-medium text-amber-600">
                      ⚠️ Importante: No realices múltiples sincronizaciones en menos de 5 minutos para evitar sobrecargar el sistema.
                    </p>
                    {!canSync() && (
                      <p className="font-medium text-red-600">
                        Debes esperar {getTimeUntilNextSync()} antes de poder sincronizar nuevamente.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={syncRegistries}
                    disabled={!canSync()}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    Confirmar Sincronización
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Secundarias */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Estadísticas por Empresa */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild className="w-full h-20 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/stats/empresas" className="flex flex-col items-center gap-2">
                <Building2 className="w-6 h-6" />
                <span className="text-sm font-bold">Estadísticas por Empresa</span>
                <span className="text-xs opacity-90">Análisis detallado por empresa</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Estadísticas por Mensajero */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild className="w-full h-20 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/stats/mensajeros" className="flex flex-col items-center gap-2">
                <UserCheck className="w-6 h-6" />
                <span className="text-sm font-bold">Estadísticas por Mensajero</span>
                <span className="text-xs opacity-90">Rendimiento individual</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Estadísticas Generales */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild className="w-full h-20 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/stats" className="flex flex-col items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                <span className="text-sm font-bold">Estadísticas Generales</span>
                <span className="text-xs opacity-90">Vista completa del negocio</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas Secundarias */}
      <div className="grid md:grid-cols-6 gap-4 mb-8">

        {/* Gestionar Inventario */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-4">
            <Button asChild className="w-full h-16 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/inventory" className="flex flex-col items-center gap-1">
                <Warehouse className="w-5 h-5" />
                <span className="text-xs">Gestionar Inventario</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Asignar Rutas */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-4">
            <Button asChild className="w-full h-16 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/routes" className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5" />
                <span className="text-xs">Asignar Rutas</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gestionar Usuarios */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-4">
            <Button asChild className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/users" className="flex flex-col items-center gap-1">
                <Users className="w-5 h-5" />
                <span className="text-xs">Gestionar Usuarios</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gestionar Empresas */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-4">
            <Button asChild className="w-full h-16 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/companies" className="flex flex-col items-center gap-1">
                <Building2 className="w-5 h-5" />
                <span className="text-xs">Gestionar Empresas</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Liquidación */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-4">
            <Button asChild className="w-full h-16 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/liquidation" className="flex flex-col items-center gap-1">
                <DollarSign className="w-5 h-5" />
                <span className="text-xs">Liquidación</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <StatsCard
            title="Ingresos Totales"
            value={formatCurrency(stats.totalCash + stats.totalSinpe)}
            icon={DollarSign}
            trend={{ value: 15, isPositive: true }}
            className="bg-orange-50 border-orange-200"
          />
        </div>
      )}

      {/* Secondary Stats */}
      {stats && (
        <div className="grid md:grid-cols-5 gap-4">
          <StatsCard
            title="Pendientes"
            value={stats.pendingOrders}
            icon={Clock}
            className="bg-yellow-50 border-yellow-200"
          />
          <StatsCard
            title="En Ruta"
            value={stats.totalOrders - stats.deliveredOrders - stats.pendingOrders}
            icon={Truck}
            className="bg-blue-50 border-blue-200"
          />
          <StatsCard
            title="Devoluciones"
            value={stats.returnedOrders}
            icon={RotateCcw}
            className="bg-red-50 border-red-200"
          />
          <StatsCard
            title="Mensajeros"
            value={messengers.length}
            icon={UserCheck}
            className="bg-indigo-50 border-indigo-200"
          />
          <StatsCard
            title="Asesores"
            value={advisors.length}
            icon={Users}
            className="bg-pink-50 border-pink-200"
          />
        </div>
      )}

      {/* Sistema de Pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            {isShowingTodayOrders ? 'Pedidos de Hoy' : 'Pedidos Recientes'}
          </TabsTrigger>
          <TabsTrigger value="messengers" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Mensajeros ({messengers.length})
          </TabsTrigger>
          <TabsTrigger value="advisors" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Asesores ({advisors.length})
          </TabsTrigger>
        </TabsList>

        {/* Pestaña de Pedidos de Hoy */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {isShowingTodayOrders ? 'Pedidos de Hoy' : 'Pedidos Recientes'}
                </CardTitle>
                {!isShowingTodayOrders && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    Sin pedidos hoy
                  </Badge>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/pedidos">Ver Todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">ID Pedido</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Cliente</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Estado</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Mensajero</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Valor</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm">{order.id}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-sm">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerAddress}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {order.assignedMessenger ? (
                              <>
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                                  {order.assignedMessenger.name.charAt(0)}
                                </div>
                                <span className="text-sm">{order.assignedMessenger.name}</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sin asignar</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-sm">{formatCurrency(order.totalAmount)}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('es-CR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Mensajeros */}
        <TabsContent value="messengers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Mensajeros Activos ({messengers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {messengers.map((messenger) => (
                  <div key={messenger.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {messenger.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{messenger.name}</h3>
                        <p className="text-xs text-muted-foreground">{messenger.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{messenger.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{messenger.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Desde: {new Date(messenger.createdAt).toLocaleDateString('es-CR')}
                        </span>
                        <Badge variant={messenger.isActive ? "default" : "secondary"} className="text-xs">
                          {messenger.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Asesores */}
        <TabsContent value="advisors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Asesores Activos ({advisors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {advisors.map((advisor) => (
                  <div key={advisor.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {advisor.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{advisor.name}</h3>
                        <p className="text-xs text-muted-foreground">{advisor.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{advisor.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{advisor.email}</span>
                      </div>
                      {advisor.company && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate">{advisor.company.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Desde: {new Date(advisor.createdAt).toLocaleDateString('es-CR')}
                        </span>
                        <Badge variant={advisor.isActive ? "default" : "secondary"} className="text-xs">
                          {advisor.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
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