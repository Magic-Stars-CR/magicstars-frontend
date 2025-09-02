'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockApi } from '@/lib/mock-api';
import { InventoryItem, InventoryTransaction, InventoryAlert } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Package,
  History,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ArrowUpDown,
  Bell,
  XCircle,
  CheckCircle,
  Edit,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function InventoryItemDetail() {
  const params = useParams();
  const router = useRouter();
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadData(params.id as string);
    }
  }, [params.id]);

  const loadData = async (itemId: string) => {
    try {
      setLoading(true);
      
      // Primero obtener el item de inventario
      const itemRes = await mockApi.getInventoryItem(itemId);
      setInventoryItem(itemRes);
      
      // Luego obtener las transacciones y alertas usando el productId
      const [transactionsRes, alertsRes] = await Promise.all([
        mockApi.getInventoryTransactions({ productId: itemRes.productId }),
        mockApi.getInventoryAlerts(),
      ]);
      
      setTransactions(transactionsRes);
      setAlerts(alertsRes.filter(alert => alert.inventoryItemId === itemId));
    } catch (error) {
      console.error('Error loading inventory item:', error);
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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'entrada': return <Plus className="w-4 h-4 text-green-600" />;
      case 'salida': return <Minus className="w-4 h-4 text-red-600" />;
      case 'ajuste': return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      case 'pedido_montado': return <TrendingDown className="w-4 h-4 text-orange-600" />;
      case 'pedido_devuelto': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'pedido_entregado': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inicial': return <Package className="w-4 h-4 text-blue-600" />;
      case 'perdida': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <ArrowUpDown className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'entrada': 'Entrada',
      'salida': 'Salida',
      'ajuste': 'Ajuste',
      'pedido_montado': 'Pedido Montado',
      'pedido_devuelto': 'Pedido Devuelto',
      'pedido_entregado': 'Pedido Entregado',
      'inicial': 'Stock Inicial',
      'perdida': 'Pérdida',
      'transferencia': 'Transferencia',
    };
    return labels[actionType] || actionType;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!inventoryItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/inventory">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inventario
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Producto no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stockStatus = getStockStatus(inventoryItem);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/inventory">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inventario
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{inventoryItem.product.name}</h1>
            <p className="text-muted-foreground">
              SKU: {inventoryItem.product.sku} • {inventoryItem.company.name}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/admin/inventory/${inventoryItem.id}/adjust`}>
            <Edit className="w-4 h-4 mr-2" />
            Ajustar Stock
          </Link>
        </Button>
      </div>

      {/* Product Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Información del Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Categoría</p>
              <p className="font-medium">{inventoryItem.product.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Precio</p>
              <p className="font-medium">{formatCurrency(inventoryItem.product.price)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ubicación</p>
              <p className="font-medium">{inventoryItem.location || 'No especificada'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Actualización</p>
              <p className="font-medium">
                {new Date(inventoryItem.lastUpdated).toLocaleDateString('es-CR')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Stock Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-3xl font-bold">{inventoryItem.currentStock}</p>
              <p className="text-sm text-muted-foreground">unidades</p>
            </div>
            <div className="flex justify-center">
              <Badge variant={stockStatus.color as any} className="text-sm">
                {stockStatus.label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Disponible</p>
                <p className="font-medium">{inventoryItem.availableStock}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reservado</p>
                <p className="font-medium">{inventoryItem.reservedStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Límites de Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Stock Mínimo</p>
              <p className="font-medium">{inventoryItem.minimumStock}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Máximo</p>
              <p className="font-medium">{inventoryItem.maximumStock}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium">
                {formatCurrency(inventoryItem.currentStock * inventoryItem.product.price)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <strong>{alerts.filter(a => !a.isRead).length} alertas</strong> activas para este producto
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Movimientos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial Detallado de Movimientos ({transactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {getActionIcon(transaction.actionType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{getActionLabel(transaction.actionType)}</p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.actionType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {transaction.reason}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Usuario:</span> {transaction.user.name}
                            </div>
                            <div>
                              <span className="font-medium">Fecha:</span> {new Date(transaction.createdAt).toLocaleDateString('es-CR')} {new Date(transaction.createdAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {transaction.referenceId && (
                              <div>
                                <span className="font-medium">Referencia:</span> 
                                <Link href={`/dashboard/admin/orders`} className="text-blue-600 hover:underline ml-1">
                                  {transaction.referenceId}
                                </Link>
                              </div>
                            )}
                            {transaction.referenceType && (
                              <div>
                                <span className="font-medium">Tipo:</span> {transaction.referenceType}
                              </div>
                            )}
                          </div>
                          {transaction.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <span className="font-medium">Notas:</span> {transaction.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${transaction.quantity > 0 ? 'text-green-600' : transaction.quantity < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>{transaction.previousStock}</span>
                            <span>→</span>
                            <span className="font-medium">{transaction.newStock}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Stock final
                        </div>
                      </div>
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
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alertas ({alerts.length})
              </CardTitle>
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
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleDateString('es-CR')} {new Date(alert.createdAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
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
