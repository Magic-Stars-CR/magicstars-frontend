'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { RouteLiquidation, RouteLiquidationStats, RouteLiquidationFilters } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Loader2,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLiquidationPage() {
  const [liquidations, setLiquidations] = useState<RouteLiquidation[]>([]);
  const [stats, setStats] = useState<RouteLiquidationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RouteLiquidationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [liquidating, setLiquidating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [liquidationsData, statsData] = await Promise.all([
        mockApi.getRouteLiquidations(filters),
        mockApi.getRouteLiquidationStats(),
      ]);
      setLiquidations(liquidationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidateRoute = async (liquidationId: string) => {
    try {
      setLiquidating(liquidationId);
      await mockApi.liquidateRoute(liquidationId, adminNotes);
      setAdminNotes('');
      await loadData();
    } catch (error) {
      console.error('Error liquidating route:', error);
      alert('Error al liquidar la ruta: ' + (error as Error).message);
    } finally {
      setLiquidating(null);
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pendiente</Badge>;
      case 'finalizada':
        return <Badge className="bg-blue-100 text-blue-800">Finalizada</Badge>;
      case 'liquidada':
        return <Badge className="bg-green-100 text-green-800">Liquidada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredLiquidations = liquidations.filter(liquidation => {
    const matchesSearch = 
      liquidation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liquidation.messenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liquidation.routeDate.includes(searchTerm);
    
    return matchesSearch;
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liquidación de Rutas</h1>
          <p className="text-gray-600">Gestiona la liquidación de todas las rutas</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin">
            <Truck className="w-4 h-4 mr-2" />
            Dashboard
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
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendientes por Liquidar</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingLiquidation}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Total Recaudado Hoy</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalCollectedToday)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">A Entregar Hoy</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalToDeliverToday)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, mensajero o fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
                <SelectItem value="liquidada">Liquidada</SelectItem>
              </SelectContent>
            </Select>

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
              onClick={() => setFilters({})}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liquidations List */}
      <Card>
        <CardHeader>
          <CardTitle>Liquidaciones ({filteredLiquidations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLiquidations.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay liquidaciones que coincidan con los filtros</p>
              </div>
            ) : (
              filteredLiquidations.map((liquidation) => (
                <div key={liquidation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm">Ruta {liquidation.routeDate}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(liquidation.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{liquidation.messenger.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{liquidation.company.name}</span>
                    </div>

                    <div>
                      <p className="font-bold text-sm text-green-600">{formatCurrency(liquidation.totalCollected)}</p>
                      <p className="text-xs text-muted-foreground">Recaudado</p>
                    </div>

                    <div>
                      <p className="font-bold text-sm text-orange-600">{formatCurrency(liquidation.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">Gastado</p>
                    </div>

                    <div>
                      <p className="font-bold text-sm text-purple-600">{formatCurrency(liquidation.totalToDeliver)}</p>
                      <p className="text-xs text-muted-foreground">A entregar</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(liquidation.status)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/admin/liquidation/${liquidation.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>

                    {liquidation.status === 'finalizada' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Liquidar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Liquidar Ruta</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Alert>
                              <AlertCircle className="w-4 h-4" />
                              <AlertDescription>
                                Al liquidar la ruta, se confirmará la recepción del efectivo y se marcará como liquidada.
                              </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-2">
                              <p className="font-medium">Resumen de la liquidación:</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Total recaudado:</span>
                                  <span className="font-bold text-green-600 ml-2">{formatCurrency(liquidation.totalCollected)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total gastado:</span>
                                  <span className="font-bold text-orange-600 ml-2">{formatCurrency(liquidation.totalSpent)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">A entregar:</span>
                                  <span className="font-bold text-purple-600 ml-2">{formatCurrency(liquidation.totalToDeliver)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Pedidos:</span>
                                  <span className="font-bold ml-2">{liquidation.deliveredOrders}/{liquidation.totalOrders} entregados</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Notas de liquidación (opcional)</label>
                              <Textarea
                                placeholder="Agrega observaciones sobre la liquidación..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="mt-1"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setAdminNotes('')}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => handleLiquidateRoute(liquidation.id)}
                                disabled={liquidating === liquidation.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {liquidating === liquidation.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Confirmar Liquidación
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
