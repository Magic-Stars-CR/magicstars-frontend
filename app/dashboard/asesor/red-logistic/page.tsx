'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { useAuth } from '@/contexts/auth-context';
import { RedLogisticOrder, RedLogisticStats, RedLogisticFilters, RedLogisticStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Eye,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

export default function AsesorRedLogisticPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<RedLogisticOrder[]>([]);
  const [stats, setStats] = useState<RedLogisticStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RedLogisticFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user?.companyId, filters]);

  const loadData = async () => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      const [ordersData, statsData] = await Promise.all([
        mockApi.getRedLogisticOrders({ ...filters, companyId: user.companyId }),
        mockApi.getRedLogisticStats(user.companyId),
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading Red Logística data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: RedLogisticStatus) => {
    const statusConfig = {
      'pendiente_envio': { label: 'Pendiente Envío', color: 'bg-yellow-100 text-yellow-800' },
      'enviado': { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
      'en_transito': { label: 'En Tránsito', color: 'bg-orange-100 text-orange-800' },
      'entregado': { label: 'Entregado', color: 'bg-green-100 text-green-800' },
      'devuelto': { label: 'Devuelto', color: 'bg-red-100 text-red-800' },
      'cancelado': { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order =>
    order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logística Externa</h1>
          <p className="text-gray-600">Envíos de {user?.company?.name}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/asesor/red-logistic/create">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Envío
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Envíos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Tránsito</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.inTransitOrders}</p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entregados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.successRate}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por tracking, cliente o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as RedLogisticStatus }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente_envio">Pendiente Envío</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="en_transito">En Tránsito</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                  <SelectItem value="devuelto">Devuelto</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setFilters({})}
                className="px-4"
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Envíos de Red Logística ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Tracking</th>
                  <th className="text-left py-3 px-4 font-semibold">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold">Destino</th>
                  <th className="text-left py-3 px-4 font-semibold">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold">Costo</th>
                  <th className="text-left py-3 px-4 font-semibold">Fecha Envío</th>
                  <th className="text-left py-3 px-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm font-medium">
                        {order.trackingNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{order.order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div className="text-sm">
                          <div className="font-medium">{order.order.customerDistrict}</div>
                          <div className="text-gray-500">{order.order.customerCanton}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(order.totalCost)}</div>
                        <div className="text-gray-500">Envío: {formatCurrency(order.shippingCost)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </div>
                        {order.estimatedDelivery && (
                          <div className="text-gray-500 text-xs">
                            Est: {formatDate(order.estimatedDelivery)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/asesor/red-logistic/${order.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron envíos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
