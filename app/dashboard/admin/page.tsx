'use client';

import { useState, useEffect } from 'react';
import { getPedidos } from '@/lib/supabase-pedidos';
import { Order, Stats, User, PedidoTest } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      console.log('Cargando datos reales de Supabase para admin...');
      
      // Cargar pedidos reales de Supabase
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

      // Obtener usuarios únicos de los pedidos (mensajeros)
      const uniqueMessengers = Array.from(new Set(pedidosData.map(p => p.mensajero_asignado).filter(Boolean))) as string[];
      const messengerUsers: User[] = uniqueMessengers.map((name, index) => ({
        id: `msg-${index + 1}`,
        name: name!,
        email: `${name!.toLowerCase()}@magicstars.com`,
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
      }));

      // Agregar algunos asesores simulados (ya que no están en la tabla de pedidos)
      const advisorUsers: User[] = [
        {
          id: 'adv-1',
          name: 'Asesor 1',
          email: 'asesor1@magicstars.com',
          role: 'asesor' as const,
          phone: '+506 0000-0001',
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
        },
        {
          id: 'adv-2',
          name: 'Asesor 2',
          email: 'asesor2@magicstars.com',
          role: 'asesor' as const,
          phone: '+506 0000-0002',
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
        },
      ];

      setUsers([...messengerUsers, ...advisorUsers]);
      
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

      {/* Quick Actions */}
      <div className="grid md:grid-cols-7 gap-6">
        {/* Sincronizar Registros - Botón Principal */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  disabled={syncing || !canSync()}
                  className="w-full h-16 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  variant="outline"
                >
                  <div className="flex flex-col items-center gap-1">
                    {syncing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    <span className="text-xs">
                      {syncing ? 'Sincronizando...' : 'Sincronizar Registros'}
                    </span>
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

        {/* Gestionar Pedidos */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/pedidos" className="flex flex-col items-center gap-1">
                <Package className="w-5 h-5" />
                <span className="text-xs">Gestionar Pedidos</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gestionar Inventario */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
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
          <CardContent className="flex items-center justify-center p-6">
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
          <CardContent className="flex items-center justify-center p-6">
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
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild className="w-full h-16 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/companies" className="flex flex-col items-center gap-1">
                <Building2 className="w-5 h-5" />
                <span className="text-xs">Gestionar Empresas</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="flex items-center justify-center p-6">
            <Button asChild className="w-full h-16 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard/admin/stats" className="flex flex-col items-center gap-1">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Estadísticas</span>
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pedidos Recientes</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/admin/pedidos">Ver Todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-sm">{order.id}</h3>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.assignedMessenger?.name || 'Sin asignar'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('es-CR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Equipo de Trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Mensajeros ({messengers.length})
                </h4>
                <div className="space-y-2">
                  {messengers.slice(0, 3).map((messenger) => (
                    <div key={messenger.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                          {messenger.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{messenger.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {messenger.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Asesores ({advisors.length})
                </h4>
                <div className="space-y-2">
                  {advisors.map((advisor) => (
                    <div key={advisor.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">
                          {advisor.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{advisor.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {advisor.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}