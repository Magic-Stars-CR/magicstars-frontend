'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { InventoryItem, InventoryStats, InventoryAlert, InventoryTransaction, Company } from '@/lib/types';
import { obtenerInventarioPorTienda, ProductoInventario } from '@/lib/supabase-inventario';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  Bell,
  CheckCircle,
  XCircle,
  Minus,
  ArrowUpDown,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_MINIMUM_STOCK = 5;
const DEFAULT_MAXIMUM_STOCK = 1000;

export default function AdvisorInventoryPage() {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const resolveCompanyInfo = (): Company => {
    const now = new Date().toISOString();

    if (user?.company) {
      return {
        ...user.company,
        createdAt: user.company.createdAt ?? now,
        updatedAt: user.company.updatedAt ?? now,
      };
    }

    const fallbackId = user?.companyId ?? 'SIN-EMPRESA';
    return {
      id: fallbackId,
      name: fallbackId,
      taxId: '',
      address: '',
      phone: '',
      email: user?.email ?? '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  };

  const mapProductosToInventoryItems = (productos: ProductoInventario[]): InventoryItem[] => {
    const timestamp = new Date().toISOString();
    const company = resolveCompanyInfo();

    return productos.map((producto, index) => {
      const baseId = producto.idx ?? index;
      const rawName = producto.producto?.toString().trim();
      const name = rawName && rawName.length > 0 ? rawName : `Producto ${index + 1}`;
      const sku =
        name
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `SKU-${index + 1}`;

      const stock = Number.isFinite(producto.cantidad) ? Number(producto.cantidad) : 0;

      return {
        id: `inv-${baseId}`,
        productId: `prod-${baseId}`,
        product: {
          id: `prod-${baseId}`,
          sku,
          name,
          category: 'Inventario',
          price: 0,
          companyId: user?.companyId ?? company.id,
          company,
        },
        companyId: user?.companyId ?? company.id,
        company,
        currentStock: stock,
        minimumStock: DEFAULT_MINIMUM_STOCK,
        maximumStock: DEFAULT_MAXIMUM_STOCK,
        reservedStock: 0,
        availableStock: stock,
        location: producto.tienda || company.name,
        lastUpdated: timestamp,
        createdAt: timestamp,
        isActive: true,
      };
    });
  };

  const buildInventoryStats = (items: InventoryItem[]): InventoryStats => {
    const totalProducts = items.length;
    const totalStockValue = items.reduce(
      (sum, item) => sum + item.currentStock * (item.product.price ?? 0),
      0
    );
    const lowStockItems = items.filter(
      (item) => item.currentStock > 0 && item.currentStock <= DEFAULT_MINIMUM_STOCK
    ).length;
    const outOfStockItems = items.filter((item) => item.currentStock <= 0).length;
    const overstockItems = items.filter((item) => item.currentStock > DEFAULT_MAXIMUM_STOCK).length;

    return {
      totalProducts,
      totalStockValue,
      lowStockItems,
      outOfStockItems,
      overstockItems,
      totalTransactions: 0,
      transactionsToday: 0,
      companyId: user?.companyId ?? undefined,
    };
  };

  const buildInventoryAlerts = (items: InventoryItem[]): InventoryAlert[] => {
    const timestamp = new Date().toISOString();

    return items
      .filter((item) => item.currentStock <= DEFAULT_MINIMUM_STOCK)
      .map((item) => {
        const isOutOfStock = item.currentStock <= 0;
        return {
          id: `alert-${item.id}`,
          inventoryItemId: item.id,
          inventoryItem: item,
          alertType: isOutOfStock ? 'out_of_stock' : 'low_stock',
          severity: isOutOfStock ? 'critical' : 'high',
          message: isOutOfStock
            ? 'Producto sin stock disponible.'
            : 'Stock cercano al mínimo recomendado.',
          isRead: false,
          createdAt: timestamp,
        };
      });
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) => (alert.id === alertId ? { ...alert, isRead: true } : alert))
    );
  };

  const loadData = async () => {
    if (!user?.companyId) return;

    try {
      setLoading(true);
      const storeName = user.company?.name ?? user.companyId ?? 'ALL STARS';
      const productos = await obtenerInventarioPorTienda(storeName);
      const mappedItems = mapProductosToInventoryItems(productos);
      const computedStats = buildInventoryStats(mappedItems);
      const computedAlerts = buildInventoryAlerts(mappedItems);

      setInventoryItems(mappedItems);
      setStats(computedStats);
      setAlerts(computedAlerts);
      setTransactions([]);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: 'out_of_stock', label: 'Agotado', color: 'destructive' };
    if (item.currentStock <= item.minimumStock) return { status: 'low_stock', label: 'Stock Bajo', color: 'destructive' };
    if (item.currentStock > item.maximumStock) return { status: 'overstock', label: 'Sobre Stock', color: 'secondary' };
    return { status: 'in_stock', label: 'En Stock', color: 'default' };
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'out_of_stock': return <XCircle className="w-4 h-4" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4" />;
      case 'overstock': return <TrendingUp className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getAlertSeverity = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const filteredItems = inventoryItems.filter((item) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      item.product.name.toLowerCase().includes(normalizedSearch) ||
      item.product.sku.toLowerCase().includes(normalizedSearch) ||
      (item.location?.toLowerCase().includes(normalizedSearch) ?? false);
    const matchesStock = stockFilter === 'all' || getStockStatus(item).status === stockFilter;
    return matchesSearch && matchesStock;
  });

  const unreadAlerts = alerts.filter((alert) => !alert.isRead);

  const totalUnits = useMemo(
    () => inventoryItems.reduce((sum, item) => sum + item.currentStock, 0),
    [inventoryItems]
  );

  const inventoryStatusCounts = useMemo(() => {
    const counts: Record<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock', number> = {
      all: inventoryItems.length,
      in_stock: 0,
      low_stock: 0,
      out_of_stock: 0,
      overstock: 0,
    };

    inventoryItems.forEach((item) => {
      const status = getStockStatus(item).status;
      if (status !== 'in_stock' && status !== 'low_stock' && status !== 'out_of_stock' && status !== 'overstock') {
        return;
      }
      counts[status] += 1;
    });

    return counts;
  }, [inventoryItems]);

  const stockFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos', count: inventoryStatusCounts.all },
      { value: 'in_stock', label: 'En stock', count: inventoryStatusCounts.in_stock },
      { value: 'low_stock', label: 'Stock bajo', count: inventoryStatusCounts.low_stock },
      { value: 'out_of_stock', label: 'Agotado', count: inventoryStatusCounts.out_of_stock },
      { value: 'overstock', label: 'Sobre stock', count: inventoryStatusCounts.overstock },
    ],
    [inventoryStatusCounts]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user?.companyId) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            No tienes una empresa asignada. Contacta al administrador.
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
          <h1 className="text-3xl font-bold">Inventario - {user.company?.name}</h1>
          <p className="text-muted-foreground">
            Gestiona el inventario de tu empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/asesor/orders">
              <Package className="w-4 h-4 mr-2" />
              Ver Pedidos
            </Link>
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">{user.company?.name}</h3>
              <p className="text-sm text-blue-700">
                Inventario exclusivo de tu empresa • {inventoryItems.length} productos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Productos"
            value={stats.totalProducts}
            icon={Package}
            className="bg-blue-50 border-blue-200"
          />
          <StatsCard
            title="Unidades Totales"
            value={totalUnits.toLocaleString('es-CR')}
            icon={TrendingUp}
            className="bg-green-50 border-green-200"
          />
          <StatsCard
            title="Stock Bajo"
            value={stats.lowStockItems}
            icon={AlertTriangle}
            className="bg-yellow-50 border-yellow-200"
          />
          <StatsCard
            title="Agotados"
            value={stats.outOfStockItems}
            icon={XCircle}
            className="bg-red-50 border-red-200"
          />
        </div>
      )}

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <strong>{unreadAlerts.length} alertas</strong> requieren atención en tu inventario
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="transactions">Movimientos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="space-y-4 border-b bg-slate-50/60">
              <div className="flex flex-col gap-1">
                <CardTitle>Productos en Inventario ({filteredItems.length})</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Filtra por estado y busca por nombre, SKU o ubicación.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto por nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 rounded-full border-slate-200 pl-9"
                  />
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product.sku}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.location}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">{item.currentStock}</p>
                          <p className="text-sm text-muted-foreground">
                            Disponible: {item.availableStock}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Min: {item.minimumStock} • Max: {item.maximumStock}
                          </p>
                        </div>
                        
                        <Badge variant={stockStatus.color as any}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {transaction.quantity > 0 ? (
                          <ArrowUpDown className="w-4 h-4 text-green-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.inventoryItem.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.reason} • {transaction.user.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString('es-CR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 border rounded-lg ${!alert.isRead ? 'bg-yellow-50 border-yellow-200' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getAlertIcon(alert.alertType)}
                        </div>
                        <div>
                          <p className="font-medium">{alert.inventoryItem.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.inventoryItem.location}
                          </p>
                          <p className="text-sm mt-1">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getAlertSeverity(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        {!alert.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAlertAsRead(alert.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
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
