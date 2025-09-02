'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { InventoryItem, InventoryStats, InventoryAlert, InventoryTransaction, Company } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  History,
  Bell,
  CheckCircle,
  XCircle,
  Minus,
  ArrowUpDown,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function InventoryManagement() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedCompany]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, statsRes, alertsRes, transactionsRes, companiesRes] = await Promise.all([
        mockApi.getInventoryItems({ companyId: selectedCompany === 'all' ? undefined : selectedCompany }),
        mockApi.getInventoryStats(selectedCompany === 'all' ? undefined : selectedCompany),
        mockApi.getInventoryAlerts(selectedCompany === 'all' ? undefined : selectedCompany),
        mockApi.getInventoryTransactions({ companyId: selectedCompany === 'all' ? undefined : selectedCompany }),
        mockApi.getCompanies(),
      ]);
      
      setInventoryItems(itemsRes);
      setStats(statsRes);
      setAlerts(alertsRes);
      setTransactions(transactionsRes);
      setCompanies(companiesRes);
    } catch (error) {
      console.error('Error loading inventory data:', error);
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

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = stockFilter === 'all' || getStockStatus(item).status === stockFilter;
    return matchesSearch && matchesStock;
  });

  const unreadAlerts = alerts.filter(alert => !alert.isRead);

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
          <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
          <p className="text-muted-foreground">
            Administra el inventario de todas las empresas
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/admin/inventory/adjust">
              <Plus className="w-4 h-4 mr-2" />
              Ajustar Inventario
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/inventory/create">
              <Package className="w-4 h-4 mr-2" />
              Crear Producto
            </Link>
          </Button>
        </div>
      </div>

      {/* Company Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="in_stock">En Stock</SelectItem>
                  <SelectItem value="low_stock">Stock Bajo</SelectItem>
                  <SelectItem value="out_of_stock">Agotado</SelectItem>
                  <SelectItem value="overstock">Sobre Stock</SelectItem>
                </SelectContent>
              </Select>
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
            title="Valor Total"
            value={formatCurrency(stats.totalStockValue)}
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
            <strong>{unreadAlerts.length} alertas</strong> requieren atención
            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => {
              // Scroll to alerts section
              document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Ver alertas
            </Button>
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
            <CardHeader>
              <CardTitle>Productos en Inventario ({filteredItems.length})</CardTitle>
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
                            SKU: {item.product.sku} • {item.company.name}
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
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/admin/inventory/${item.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/admin/inventory/${item.id}/adjust`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
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
        <TabsContent value="alerts" className="space-y-4" id="alerts-section">
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
                            {alert.inventoryItem.company.name} • {alert.inventoryItem.location}
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
                            onClick={() => {
                              mockApi.markAlertAsRead(alert.id);
                              setAlerts(prev => prev.map(a => 
                                a.id === alert.id ? { ...a, isRead: true } : a
                              ));
                            }}
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
