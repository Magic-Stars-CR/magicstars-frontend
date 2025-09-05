'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { RouteAssignment, ZoneGroup, UnassignedOrder, RouteMessengerStats, RouteManagementFilters, RouteInfo, RouteStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  Package,
  MapPin,
  Users,
  Plus,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Filter,
  BarChart3,
  Route,
} from 'lucide-react';

export default function RouteManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [zoneGroups, setZoneGroups] = useState<ZoneGroup[]>([]);
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<UnassignedOrder[]>([]);
  const [messengerStats, setMessengerStats] = useState<RouteMessengerStats[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStats[]>([]);
  const [allRoutes, setAllRoutes] = useState<RouteInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState<RouteManagementFilters>({});

  useEffect(() => {
    loadData();
  }, [selectedDate, filters.companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar pedidos primero
      const ordersData = await mockApi.getOrdersForRouteCreation(selectedDate, filters.companyId);
      setOrders(ordersData);
      
      // Luego agrupar por zonas
      const zoneGroupsData = await mockApi.groupOrdersByZone(ordersData);
      setZoneGroups(zoneGroupsData);
      
      // Cargar asignaciones, estadísticas y rutas
      const [assignmentsData, statsData, routeStatsData, allRoutesData] = await Promise.all([
        mockApi.getRouteAssignments(filters),
        mockApi.getRouteMessengerStats(filters),
        mockApi.getRouteStats(filters),
        mockApi.getAllRoutes(),
      ]);
      
      setAssignments(assignmentsData);
      setMessengerStats(statsData);
      setRouteStats(routeStatsData);
      setAllRoutes(allRoutesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      setOrders([]);
      setZoneGroups([]);
      setAssignments([]);
      setMessengerStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      const result = await mockApi.assignOrdersToMessengers(selectedDate, filters.companyId);
      setAssignments(result.assignments);
      setUnassignedOrders(result.unassignedOrders);
    } catch (error) {
      console.error('Error auto-assigning orders:', error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pendiente</Badge>;
      case 'assigned':
        return <Badge className="bg-blue-100 text-blue-800">Asignado</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800">En Progreso</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Rutas</h1>
            <p className="text-gray-600">Identifica, agrupa y asigna pedidos a mensajeros</p>
          </div>
        </div>
        
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            {error}
            <Button 
              onClick={() => {
                setError(null);
                loadData();
              }}
              className="ml-4"
              size="sm"
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Rutas</h1>
          <p className="text-gray-600">Identifica, agrupa y asigna pedidos a mensajeros</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAutoAssign} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Asignación Automática
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Ruta
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha de Ruta</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Select
              value={filters.companyId || 'all'}
              onValueChange={(value) => setFilters(prev => ({ ...prev, companyId: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                <SelectItem value="1">Para Machos CR</SelectItem>
                <SelectItem value="2">BeautyFan</SelectItem>
                <SelectItem value="3">AllStars</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Fecha desde"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
            />

            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setSelectedDate(new Date().toISOString().split('T')[0]);
              }}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="orders">Pedidos ({orders.length})</TabsTrigger>
          <TabsTrigger value="zones">Rutas ({zoneGroups.length})</TabsTrigger>
          <TabsTrigger value="assignments">Asignaciones ({assignments.length})</TabsTrigger>
          <TabsTrigger value="routes">Rutas Disponibles</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos para {formatDate(selectedDate)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay pedidos para esta fecha</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{order.id}</p>
                          <p className="text-xs text-muted-foreground">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">{order.customerCanton}</p>
                        </div>
                        <Badge variant={order.assignedMessengerId ? 'default' : 'outline'}>
                          {order.assignedMessengerId ? 'Asignado' : 'Sin asignar'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agrupación por Mensajeros (30 pedidos cada uno)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zoneGroups.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay grupos para mostrar</p>
                  </div>
                ) : (
                  zoneGroups.map((group, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Route className="w-4 h-4 text-blue-600" />
                          <h3 className="font-semibold">{group.zone}</h3>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {group.totalOrders} pedidos asignados
                          </p>
                          <p className="text-sm font-medium">
                            {formatCurrency(group.totalAmount)}
                          </p>
                          {group.assignedMessenger && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-xs text-blue-600 font-medium">
                                Mensajero: {group.assignedMessenger.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {group.totalOrders === 30 ? '✅ 30 pedidos completos' : `⚠️ ${group.totalOrders}/30 pedidos`}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asignaciones de Rutas (30 pedidos por mensajero)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay asignaciones de rutas</p>
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-sm">
                              {assignment.messenger.name} - {formatDate(assignment.routeDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.assignedOrders} pedidos asignados
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.assignedOrders === 30 ? (
                            <Badge variant="default" className="bg-green-600">
                              ✅ 30/30 Completo
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              ⚠️ {assignment.assignedOrders}/30
                            </Badge>
                          )}
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      
                      {/* Progreso de pedidos */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progreso de asignación</span>
                          <span>{assignment.assignedOrders}/30 ({Math.round((assignment.assignedOrders / 30) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(assignment.assignedOrders / 30) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Estadísticas de pedidos */}
                      <div className="grid grid-cols-4 gap-4 text-xs mb-3">
                        <div className="text-center">
                          <p className="text-green-600 font-medium">
                            {assignment.orders.filter(o => o.status === 'entregado').length}
                          </p>
                          <p className="text-gray-500">Entregados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-yellow-600 font-medium">
                            {assignment.orders.filter(o => o.status === 'confirmado').length}
                          </p>
                          <p className="text-gray-500">Pendientes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-orange-600 font-medium">
                            {assignment.orders.filter(o => o.status === 'reagendado').length}
                          </p>
                          <p className="text-gray-500">Reagendados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-red-600 font-medium">
                            {assignment.orders.filter(o => o.status === 'devolucion').length}
                          </p>
                          <p className="text-gray-500">Devueltos</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(assignment.orders.reduce((sum, o) => sum + o.totalAmount, 0))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.company.name}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: Implementar cambio de asignación
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Cambiar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Unassigned Orders Alert */}
          {unassignedOrders.length > 0 && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>{unassignedOrders.length} pedidos no asignados:</strong>
                <ul className="mt-2 space-y-1">
                  {unassignedOrders.map((unassigned, index) => (
                    <li key={index} className="text-sm">
                      • {unassigned.order.id} - {unassigned.order.customerName} 
                      ({unassigned.reason === 'no_messenger_available' ? 'Sin mensajero disponible' : 'Zona no cubierta'})
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rutas Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allRoutes.length === 0 ? (
                  <div className="text-center py-8">
                    <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay rutas disponibles</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allRoutes.map((route, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Route className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-lg">Ruta {route.route}</h3>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Zonas:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {route.zones.map((zone, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {zone}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Pago por mensajero:</p>
                              <p className="text-sm font-bold text-green-600">
                                {formatCurrency(route.payment)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Mensajeros asignados:</p>
                              <p className="text-sm text-gray-800">
                                {route.messengers.length} mensajero{route.messengers.length !== 1 ? 's' : ''}
                              </p>
                              <div className="mt-1">
                                {route.messengers.map((messenger, idx) => (
                                  <p key={idx} className="text-xs text-blue-600">
                                    • {messenger.name}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Route Statistics */}
          {routeStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas por Ruta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Ruta</th>
                        <th className="text-center p-2">Pedidos</th>
                        <th className="text-center p-2">Monto Total</th>
                        <th className="text-center p-2">Valor Promedio</th>
                        <th className="text-center p-2">Mensajeros</th>
                        <th className="text-center p-2">Pago por Mensajero</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeStats.map((stat, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Route className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{stat.route}</span>
                            </div>
                          </td>
                          <td className="text-center p-2">{stat.totalOrders}</td>
                          <td className="text-center p-2 font-medium">
                            {formatCurrency(stat.totalAmount)}
                          </td>
                          <td className="text-center p-2">
                            {formatCurrency(stat.averageOrderValue)}
                          </td>
                          <td className="text-center p-2">{stat.assignedMessengers}</td>
                          <td className="text-center p-2 text-green-600">
                            {formatCurrency(stat.paymentPerMessenger)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Mensajeros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messengerStats.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay estadísticas disponibles</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Mensajero</th>
                          <th className="text-center p-2">Asignados</th>
                          <th className="text-center p-2">Entregados</th>
                          <th className="text-center p-2">Devueltos</th>
                          <th className="text-center p-2">Reagendados</th>
                          <th className="text-center p-2">Efectivo</th>
                          <th className="text-center p-2">SINPE</th>
                          <th className="text-center p-2">A Devolver</th>
                          <th className="text-center p-2">Efectividad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messengerStats.map((stat) => (
                          <tr key={stat.messengerId} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{stat.messenger.name}</span>
                              </div>
                            </td>
                            <td className="text-center p-2">{stat.assignedOrders}</td>
                            <td className="text-center p-2 text-green-600">{stat.deliveredOrders}</td>
                            <td className="text-center p-2 text-red-600">{stat.returnedOrders}</td>
                            <td className="text-center p-2 text-orange-600">{stat.rescheduledOrders}</td>
                            <td className="text-center p-2 text-green-600">{formatCurrency(stat.cashCollected)}</td>
                            <td className="text-center p-2 text-blue-600">{formatCurrency(stat.sinpeCollected)}</td>
                            <td className="text-center p-2 text-red-600">{stat.ordersToReturn}</td>
                            <td className="text-center p-2">
                              <Badge variant={stat.effectiveness >= 80 ? 'default' : 'outline'}>
                                {stat.effectiveness}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}