'use client';

import { useEffect, useMemo, useState } from 'react';
import { obtenerInventario, ProductoInventario } from '@/lib/supabase-inventario';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario General</h1>
          <p className="text-muted-foreground">
            Consulta el inventario consolidado de todas las tiendas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadInventory} disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading ? 'animate-spin' : '')} />
          Recargar
        </Button>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Productos listados"
          value={statusCounts.all}
          icon={Package}
          className="bg-blue-50 border-blue-200"
        />
        <StatsCard
          title="Unidades totales"
          value={totalUnits.toLocaleString('es-CR')}
          icon={TrendingUp}
          className="bg-green-50 border-green-200"
        />
        <StatsCard
          title="Tiendas activas"
          value={totalStores}
          icon={Building2}
          className="bg-purple-50 border-purple-200"
        />
        <StatsCard
          title="Alertas (bajo/agotado)"
          value={lowStockTotal + outOfStockTotal}
          icon={AlertTriangle}
          className="bg-yellow-50 border-yellow-200"
        />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {storeOptions.map((option) => {
                const isActive = selectedStore === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStore(option.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span>{option.label}</span>
                    <span
                      className={cn(
                        'min-w-[1.75rem] rounded-full px-2 py-0.5 text-xs font-semibold',
                        isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {option.count}
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {stockFilterOptions.map((option) => {
                const isActive = stockFilter === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStockFilter(option.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span>{option.label}</span>
                    <span
                      className={cn(
                        'min-w-[1.75rem] rounded-full px-2 py-0.5 text-xs font-semibold',
                        isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {option.count}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto o tienda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 rounded-full border-slate-200 pl-9"
            />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            Inventario detallado ({sortedItems.length}
            {stockFilter === 'all' ? '' : ` • ${stockFilterOptions.find((o) => o.value === stockFilter)?.label ?? ''}`})
          </CardTitle>
          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Actualizando inventario...
            </div>
          )}
        </CardHeader>
        <CardContent>
          {sortedItems.length === 0 ? (
            <Alert>
              <AlertDescription>
                No se encontraron productos que coincidan con los filtros seleccionados.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Tienda</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-[120px] text-right">Unidades</TableHead>
                    <TableHead className="w-[140px] text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item, index) => {
                    const storeName = normalizeStoreName(item.tienda);
                    const statusInfo = getStatusInfo(item.cantidad);

                    return (
                      <TableRow key={`${storeName}-${item.producto}-${index}`}>
                        <TableCell className="font-medium">{storeName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {item.producto || 'Producto sin nombre'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {item.cantidad}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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
  );
}
