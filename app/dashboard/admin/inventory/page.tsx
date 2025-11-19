'use client';

import { useEffect, useMemo, useState } from 'react';
import { obtenerInventario, ProductoInventario } from '@/lib/supabase-inventario';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  XCircle,
  Building2,
  Search,
  RefreshCw,
  Warehouse,
  Filter,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_MINIMUM_STOCK = 5;
const DEFAULT_MAXIMUM_STOCK = 1000;

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
type StockFilterValue = 'all' | StockStatus;

type StatusInfo = {
  status: StockStatus;
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
};

const normalizeStoreName = (store?: string | null) =>
  store?.trim() && store.trim().length > 0 ? store.trim() : 'Sin tienda';

const getStatusInfo = (quantity: number): StatusInfo => {
  if (quantity <= 0) {
    return { status: 'out_of_stock', label: 'Agotado', variant: 'destructive' };
  }
  if (quantity <= DEFAULT_MINIMUM_STOCK) {
    return { status: 'low_stock', label: 'Stock bajo', variant: 'destructive' };
  }
  if (quantity > DEFAULT_MAXIMUM_STOCK) {
    return { status: 'overstock', label: 'Sobre stock', variant: 'secondary' };
  }
  return { status: 'in_stock', label: 'En stock', variant: 'default' };
};

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<ProductoInventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilterValue>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await obtenerInventario();
      setInventory(data);
      setError(null);
    } catch (err) {
      console.error('❌ Error cargando inventario:', err);
      setError('No se pudo cargar el inventario. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedStore === 'all') return;
    const exists = inventory.some((item) => normalizeStoreName(item.tienda) === selectedStore);
    if (!exists) {
      setSelectedStore('all');
    }
  }, [inventory, selectedStore]);

  const storeOptions = useMemo(() => {
    const counts = inventory.reduce<Record<string, number>>((acc, item) => {
      const storeName = normalizeStoreName(item.tienda);
      acc[storeName] = (acc[storeName] ?? 0) + 1;
      return acc;
    }, {});

    const sortedStores = Object.entries(counts).sort(([a], [b]) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    return [
      { value: 'all', label: 'Todas', count: inventory.length },
      ...sortedStores.map(([store, count]) => ({
        value: store,
        label: store,
        count,
      })),
    ];
  }, [inventory]);

  const inventoryForStore = useMemo(() => {
    if (selectedStore === 'all') return inventory;
    return inventory.filter((item) => normalizeStoreName(item.tienda) === selectedStore);
  }, [inventory, selectedStore]);

  const statusCounts = useMemo<Record<'all' | StockStatus, number>>(() => {
    const counts: Record<'all' | StockStatus, number> = {
      all: inventoryForStore.length,
      in_stock: 0,
      low_stock: 0,
      out_of_stock: 0,
      overstock: 0,
    };

    inventoryForStore.forEach((item) => {
      const status = getStatusInfo(item.cantidad).status;
      counts[status] += 1;
    });

    return counts;
  }, [inventoryForStore]);

  const stockFilterOptions = useMemo<
    Array<{ value: StockFilterValue; label: string; count: number }>
  >(
    () => [
      { value: 'all', label: 'Todos', count: statusCounts.all },
      { value: 'in_stock', label: 'En stock', count: statusCounts.in_stock },
      { value: 'low_stock', label: 'Stock bajo', count: statusCounts.low_stock },
      { value: 'out_of_stock', label: 'Agotado', count: statusCounts.out_of_stock },
      { value: 'overstock', label: 'Sobre stock', count: statusCounts.overstock },
    ],
    [statusCounts]
  );

  const searchFilteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return inventoryForStore;

    return inventoryForStore.filter((item) => {
      const productName = item.producto?.toLowerCase() ?? '';
      const storeName = normalizeStoreName(item.tienda).toLowerCase();
      return productName.includes(normalizedSearch) || storeName.includes(normalizedSearch);
    });
  }, [inventoryForStore, searchTerm]);

  const filteredItems = useMemo(() => {
    if (stockFilter === 'all') return searchFilteredItems;
    return searchFilteredItems.filter(
      (item) => getStatusInfo(item.cantidad).status === stockFilter
    );
  }, [searchFilteredItems, stockFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const storeA = normalizeStoreName(a.tienda);
      const storeB = normalizeStoreName(b.tienda);

      if (storeA !== storeB) {
        return storeA.localeCompare(storeB, 'es', { sensitivity: 'base' });
      }

      return (a.producto || '').localeCompare(b.producto || '', 'es', { sensitivity: 'base' });
    });
  }, [filteredItems]);

  const totalUnits = useMemo(
    () => inventoryForStore.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0),
    [inventoryForStore]
  );

  const totalStores = storeOptions.length > 0 ? storeOptions.length - 1 : 0;
  const lowStockTotal = statusCounts.low_stock;
  const outOfStockTotal = statusCounts.out_of_stock;
  const isInitialLoading = loading && inventory.length === 0;
  const isRefreshing = loading && inventory.length > 0;

  if (isInitialLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header mejorado con gradiente */}
      <div className="relative rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 p-8 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20"></div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Warehouse className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white mb-3">
                <Package className="h-4 w-4" />
                Panel de gestión de inventario
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                Inventario General
              </h1>
              <p className="text-white/90 text-base">
                Consulta el inventario consolidado de todas las tiendas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={loadInventory} 
              disabled={loading}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              variant="outline"
            >
              <RefreshCw className={cn('w-4 h-4', loading ? 'animate-spin' : '')} />
              <span>Recargar</span>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={loadInventory} disabled={loading}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Estadísticas - Mejoradas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border-2 border-sky-200 dark:border-sky-800">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-sky-400/30 to-blue-400/30 blur-xl" />
          <CardContent className="relative p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Productos listados</p>
                <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">{statusCounts.all.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Total de productos</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-lg">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border-2 border-emerald-200 dark:border-emerald-800">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/30 to-green-400/30 blur-xl" />
          <CardContent className="relative p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Unidades totales</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{totalUnits.toLocaleString('es-CR')}</p>
                <p className="text-xs text-muted-foreground mt-1">Stock disponible</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border-2 border-purple-200 dark:border-purple-800">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400/30 to-indigo-400/30 blur-xl" />
          <CardContent className="relative p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tiendas activas</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{totalStores}</p>
                <p className="text-xs text-muted-foreground mt-1">Puntos de venta</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border-2 border-amber-200 dark:border-amber-800">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-400/30 to-yellow-400/30 blur-xl" />
          <CardContent className="relative p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Alertas</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{lowStockTotal + outOfStockTotal}</p>
                <p className="text-xs text-muted-foreground mt-1">Bajo/Agotado</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Filtros - Mejorada */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-indigo-400 rounded-2xl opacity-10 group-hover:opacity-20 blur transition duration-300"></div>
        <Card className="relative border-0 shadow-lg bg-gradient-to-br from-sky-50/50 to-indigo-50/50 dark:from-sky-950/50 dark:to-indigo-950/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Filtros y Búsqueda</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Filtra inventario por tienda, estado de stock o búsqueda de texto
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filteredItems.length} resultado{filteredItems.length === 1 ? '' : 's'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filtros rápidos por tienda */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-500" />
                Filtros rápidos por tienda
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {storeOptions.map((option) => {
                  const isActive = selectedStore === option.value;
                  return (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => setSelectedStore(option.value)}
                      className={cn(
                        'transition-all duration-200 hover:scale-105',
                        isActive
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-md'
                          : 'hover:bg-sky-50'
                      )}
                    >
                      <span>{option.label}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                        {option.count}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
              <span className="text-xs text-muted-foreground">Estado de Stock</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
            </div>

            {/* Filtros de estado */}
            <div className="flex flex-wrap items-center gap-2">
              {stockFilterOptions.map((option) => {
                const isActive = stockFilter === option.value;
                return (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => setStockFilter(option.value)}
                    className={cn(
                      'transition-all duration-200 hover:scale-105',
                      isActive
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                        : 'hover:bg-emerald-50'
                    )}
                  >
                    <span>{option.label}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                      {option.count}
                    </span>
                  </Button>
                );
              })}
            </div>

            {/* Búsqueda */}
            <div className="pt-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4 text-sky-500" />
                  Buscar
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Producto o tienda..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 transition-all duration-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Inventario - Mejorada */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-10 group-hover:opacity-20 blur transition duration-300"></div>
        <Card className="relative border-0 shadow-lg bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Inventario Detallado</CardTitle>
                  <CardDescription className="mt-1">
                    {sortedItems.length} producto{sortedItems.length === 1 ? '' : 's'}
                    {stockFilter === 'all' ? '' : ` • ${stockFilterOptions.find((o) => o.value === stockFilter)?.label ?? ''}`}
                  </CardDescription>
                </div>
              </div>
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Actualizando...
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sortedItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground mb-1">No se encontraron productos</p>
                    <p className="text-sm text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-b border-emerald-200 dark:border-emerald-800">
                      <TableHead className="font-semibold">Tienda</TableHead>
                      <TableHead className="font-semibold">Producto</TableHead>
                      <TableHead className="font-semibold text-right">Unidades</TableHead>
                      <TableHead className="font-semibold text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item, index) => {
                      const storeName = normalizeStoreName(item.tienda);
                      const statusInfo = getStatusInfo(item.cantidad);

                      return (
                        <TableRow 
                          key={`${storeName}-${item.producto}-${index}`}
                          className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30 transition-all duration-200 border-b border-emerald-100/50 dark:border-emerald-900/30"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">{storeName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-sm">{item.producto || 'Producto sin nombre'}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">
                            {item.cantidad}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={statusInfo.variant}
                              className="transition-all duration-200 hover:scale-105"
                            >
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
