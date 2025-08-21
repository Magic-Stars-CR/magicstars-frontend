'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { mockApi } from '@/lib/mock-api';
import { Order, MessengerStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Settings, 
  ArrowLeft,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Package,
  CheckCircle,
  RotateCcw,
  DollarSign,
  BarChart3,
  History
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MessengerProfilePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<MessengerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        mockApi.getOrders({ 
          assignedMessengerId: user?.id,
        }),
        mockApi.getMessengerStats(user?.id || ''),
      ]);
      
      setOrders(ordersRes);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    return {
      total: monthlyOrders.length,
      delivered: monthlyOrders.filter(o => o.status === 'entregado').length,
      returned: monthlyOrders.filter(o => o.status === 'devolucion').length,
      revenue: monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    };
  };

  const getWeeklyStats = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weeklyOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekStart && orderDate <= weekEnd;
    });

    return {
      total: weeklyOrders.length,
      delivered: weeklyOrders.filter(o => o.status === 'entregado').length,
      returned: weeklyOrders.filter(o => o.status === 'devolucion').length,
      revenue: weeklyOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    };
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

  const handleSaveProfile = async () => {
    try {
      // Aquí iría la lógica para actualizar el perfil
      // await mockApi.updateUserProfile(user?.id, profileData);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const monthlyStats = getMonthlyStats();
  const weeklyStats = getWeeklyStats();
  const topAreas = getTopAreas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/mensajero">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y revisa tus estadísticas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <CardTitle>{user?.name}</CardTitle>
              <Badge variant="secondary">Mensajero</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!editing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!editing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!editing}
                />
              </div>

              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button onClick={handleSaveProfile} className="flex-1">
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditing(true)} className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats and Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="performance">Rendimiento</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Entregas</p>
                        <p className="text-2xl font-bold">{stats?.deliveredOrders || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Efectividad</p>
                        <p className="text-2xl font-bold">{stats?.deliveryRate || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                        <p className="text-2xl font-bold">{monthlyStats.delivered}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ingresos Mes</p>
                        <p className="text-2xl font-bold">{formatCurrency(monthlyStats.revenue)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly vs Monthly Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Esta Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Pedidos:</span>
                        <span className="font-semibold">{weeklyStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entregados:</span>
                        <span className="font-semibold text-green-600">{weeklyStats.delivered}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Devueltos:</span>
                        <span className="font-semibold text-red-600">{weeklyStats.returned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingresos:</span>
                        <span className="font-semibold">{formatCurrency(weeklyStats.revenue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Este Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Pedidos:</span>
                        <span className="font-semibold">{monthlyStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entregados:</span>
                        <span className="font-semibold text-green-600">{monthlyStats.delivered}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Devueltos:</span>
                        <span className="font-semibold text-red-600">{monthlyStats.returned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingresos:</span>
                        <span className="font-semibold">{formatCurrency(monthlyStats.revenue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Zonas Más Activas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topAreas.map((area, index) => (
                      <div key={area.area} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{area.area}</p>
                            <p className="text-sm text-muted-foreground">
                              {area.count} pedidos
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {((area.count / orders.length) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Métricas de Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Delivery Rate Over Time */}
                    <div>
                      <h4 className="font-medium mb-3">Tasa de Entrega</h4>
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Actual</span>
                          <span className="font-bold text-2xl text-green-600">{stats?.deliveryRate || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stats?.deliveryRate || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Performance */}
                    <div>
                      <h4 className="font-medium mb-3">Rendimiento Reciente</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-600">{weeklyStats.delivered}</p>
                          <p className="text-sm text-muted-foreground">Esta semana</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-600">{monthlyStats.delivered}</p>
                          <p className="text-sm text-muted-foreground">Este mes</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-purple-600">{stats?.deliveredOrders || 0}</p>
                          <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Historial de Entregas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 20).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            order.status === 'entregado' ? 'bg-green-500' :
                            order.status === 'devolucion' ? 'bg-red-500' :
                            order.status === 'en_ruta' ? 'bg-purple-500' :
                            'bg-blue-500'
                          }`} />
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer.name} - {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                          <Badge variant="secondary">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
