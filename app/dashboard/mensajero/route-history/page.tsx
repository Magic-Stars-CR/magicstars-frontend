'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { useAuth } from '@/contexts/auth-context';
import { DailyRoute, RouteHistoryStats, RouteExpense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  Package,
  DollarSign,
  Plus,
  Eye,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Loader2,
  Camera,
  Edit,
  Trash2,
  Receipt,
  Fuel,
  Utensils,
  CreditCard,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function MessengerRouteHistoryPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<DailyRoute[]>([]);
  const [stats, setStats] = useState<RouteHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<DailyRoute | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RouteExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    category: 'combustible' as 'combustible' | 'alimentacion' | 'peaje' | 'mantenimiento' | 'otro',
    images: [] as string[],
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [routesData, statsData] = await Promise.all([
        mockApi.getDailyRoutes({ messengerId: user.id }),
        mockApi.getRouteHistoryStats(user.id),
      ]);
      setRoutes(routesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!selectedRoute || !user) return;
    
    try {
      await mockApi.createRouteExpense({
        routeId: selectedRoute.id,
        messengerId: user.id,
        messenger: user,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        category: expenseForm.category,
        date: selectedRoute.routeDate,
        images: expenseForm.images,
      });
      
      setExpenseForm({ amount: '', description: '', category: 'combustible', images: [] });
      setShowAddExpense(false);
      await loadData();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error al añadir el gasto: ' + (error as Error).message);
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;
    
    try {
      await mockApi.updateRouteExpense(editingExpense.id, {
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        category: expenseForm.category,
        images: expenseForm.images,
      });
      
      setEditingExpense(null);
      setExpenseForm({ amount: '', description: '', category: 'combustible', images: [] });
      await loadData();
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Error al actualizar el gasto: ' + (error as Error).message);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return;
    
    try {
      await mockApi.deleteRouteExpense(expenseId);
      await loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error al eliminar el gasto: ' + (error as Error).message);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combustible': return <Fuel className="w-4 h-4" />;
      case 'alimentacion': return <Utensils className="w-4 h-4" />;
      case 'peaje': return <CreditCard className="w-4 h-4" />;
      case 'mantenimiento': return <Wrench className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'combustible': return 'Combustible';
      case 'alimentacion': return 'Alimentación';
      case 'peaje': return 'Peaje';
      case 'mantenimiento': return 'Mantenimiento';
      case 'otro': return 'Otro';
      default: return category;
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Rutas</h1>
          <p className="text-gray-600">Gestiona tus rutas diarias y gastos</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/mensajero">
            <Truck className="w-4 h-4 mr-2" />
            Mis Pedidos
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Rutas</p>
                  <p className="text-2xl font-bold">{stats.totalRoutes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pedidos Entregados</p>
                  <p className="text-2xl font-bold">{stats.totalDelivered}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Total Recaudado</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cantidad Neta</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.netAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Rutas ({routes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routes.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tienes rutas registradas</p>
              </div>
            ) : (
              routes.map((route) => (
                <div key={route.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm">{formatDate(route.routeDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {route.deliveredOrders}/{route.totalOrders} entregados
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{route.messenger.name}</span>
                    </div>

                    <div>
                      <p className="font-bold text-sm text-green-600">{formatCurrency(route.totalCollected)}</p>
                      <p className="text-xs text-muted-foreground">Recaudado</p>
                    </div>

                    <div>
                      <p className="font-bold text-sm text-orange-600">{formatCurrency(route.totalExpenses)}</p>
                      <p className="text-xs text-muted-foreground">Gastos</p>
                    </div>

                    <div>
                      <p className="font-bold text-sm text-purple-600">{formatCurrency(route.netAmount)}</p>
                      <p className="text-xs text-muted-foreground">Neto</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-600">
                        {route.expenses.length} gastos
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedRoute(route)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Route Detail Modal */}
      {selectedRoute && (
        <Dialog open={!!selectedRoute} onOpenChange={() => setSelectedRoute(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ruta del {formatDate(selectedRoute.routeDate)}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedRoute.totalOrders}</p>
                      <p className="text-sm text-muted-foreground">Total Pedidos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{selectedRoute.deliveredOrders}</p>
                      <p className="text-sm text-muted-foreground">Entregados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedRoute.totalCollected)}</p>
                      <p className="text-sm text-muted-foreground">Recaudado</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedRoute.netAmount)}</p>
                      <p className="text-sm text-muted-foreground">Cantidad Neta</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedRoute.notes && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Notas de la Ruta</h4>
                      <p className="text-sm text-muted-foreground">{selectedRoute.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <div className="space-y-2">
                  {selectedRoute.orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{order.id}</p>
                          <p className="text-xs text-muted-foreground">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(order.totalAmount)}</p>
                        <Badge variant={order.status === 'entregado' ? 'default' : 'outline'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Gastos de la Ruta</h4>
                  <Button
                    size="sm"
                    onClick={() => {
                      setExpenseForm({ amount: '', description: '', category: 'combustible', images: [] });
                      setShowAddExpense(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Gasto
                  </Button>
                </div>

                <div className="space-y-2">
                  {selectedRoute.expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(expense.category)}
                        <div>
                          <p className="font-medium text-sm">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {getCategoryName(expense.category)} • {formatDate(expense.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{formatCurrency(expense.amount)}</p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingExpense(expense);
                              setExpenseForm({
                                amount: expense.amount.toString(),
                                description: expense.description,
                                category: expense.category,
                                images: expense.images,
                              });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRoute.expenses.length === 0 && (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay gastos registrados para esta ruta</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Edit Expense Modal */}
      <Dialog open={showAddExpense || !!editingExpense} onOpenChange={() => {
        setShowAddExpense(false);
        setEditingExpense(null);
        setExpenseForm({ amount: '', description: '', category: 'combustible', images: [] });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Editar Gasto' : 'Añadir Gasto'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Monto</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value: any) => setExpenseForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combustible">Combustible</SelectItem>
                    <SelectItem value="alimentacion">Alimentación</SelectItem>
                    <SelectItem value="peaje">Peaje</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                placeholder="Describe el gasto..."
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Imágenes (opcional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Arrastra imágenes aquí o haz clic para seleccionar</p>
                <p className="text-xs text-gray-400">Máximo 5 imágenes</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddExpense(false);
                  setEditingExpense(null);
                  setExpenseForm({ amount: '', description: '', category: 'combustible', images: [] });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={editingExpense ? handleEditExpense : handleAddExpense}
                disabled={!expenseForm.amount || !expenseForm.description}
              >
                {editingExpense ? 'Actualizar' : 'Añadir'} Gasto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
