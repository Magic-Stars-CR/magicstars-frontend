'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { mockApi } from '@/lib/mock-api';
import { Order, InventoryItem } from '@/lib/types';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Truck,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdvisorOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id && user?.companyId) {
      loadData(params.id as string);
    }
  }, [params.id, user]);

  const loadData = async (orderId: string) => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      
      // Obtener el pedido
      const orders = await mockApi.getOrders({ userCompanyId: user.companyId });
      const foundOrder = orders.find(o => o.id === orderId);
      
      if (!foundOrder) {
        throw new Error('Pedido no encontrado');
      }
      
      setOrder(foundOrder);
      
      // Obtener información de inventario para los productos del pedido
      const inventoryPromises = foundOrder.items.map(item => 
        mockApi.getInventoryItems({ productId: item.product.id, companyId: user.companyId })
      );
      
      const inventoryResults = await Promise.all(inventoryPromises);
      const allInventoryItems = inventoryResults.flat();
      setInventoryItems(allInventoryItems);
      
    } catch (error) {
      console.error('Error loading order data:', error);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInventoryItem = (productId: string) => {
    return inventoryItems.find(item => item.productId === productId);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: 'out_of_stock', label: 'Agotado', color: 'destructive' };
    if (item.currentStock <= item.minimumStock) return { status: 'low_stock', label: 'Stock Bajo', color: 'destructive' };
    if (item.currentStock > item.maximumStock) return { status: 'overstock', label: 'Sobre Stock', color: 'secondary' };
    return { status: 'in_stock', label: 'En Stock', color: 'default' };
  };

  const getStockMessage = (orderItem: any, inventoryItem: InventoryItem | undefined) => {
    if (!inventoryItem) {
      return {
        message: 'Producto no encontrado en inventario',
        type: 'error',
        icon: <XCircle className="w-4 h-4" />
      };
    }

    const stockStatus = getStockStatus(inventoryItem);
    const requestedQuantity = orderItem.quantity;
    const availableStock = inventoryItem.availableStock;

    if (order?.status === 'entregado') {
      return {
        message: `✅ Producto entregado exitosamente. Stock actual: ${inventoryItem.currentStock}`,
        type: 'success',
        icon: <CheckCircle className="w-4 h-4" />
      };
    }

    if (order?.status === 'devolucion' || order?.status === 'reagendado') {
      return {
        message: `🔄 Producto devuelto al inventario. Stock restaurado: ${inventoryItem.currentStock}`,
        type: 'info',
        icon: <TrendingUp className="w-4 h-4" />
      };
    }

    if (order?.status === 'en_ruta') {
      return {
        message: `🚚 Producto montado a ruta. Stock descontado: ${inventoryItem.currentStock} (reservado: ${inventoryItem.reservedStock})`,
        type: 'warning',
        icon: <Truck className="w-4 h-4" />
      };
    }

    if (availableStock < requestedQuantity) {
      return {
        message: `⚠️ Stock insuficiente. Disponible: ${availableStock}, Solicitado: ${requestedQuantity}`,
        type: 'error',
        icon: <AlertTriangle className="w-4 h-4" />
      };
    }

    return {
      message: `✅ Stock disponible: ${availableStock} unidades. Estado: ${stockStatus.label}`,
      type: 'success',
      icon: <CheckCircle className="w-4 h-4" />
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/asesor/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Pedidos
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Pedido no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/asesor/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Pedidos
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pedido {order.id}</h1>
            <p className="text-muted-foreground">
              {order.customerName} • {user?.company?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/asesor/inventory">
              <Package className="w-4 h-4 mr-2" />
              Ver Inventario
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Detalles del Pedido</TabsTrigger>
          <TabsTrigger value="inventory">Estado de Inventario</TabsTrigger>
        </TabsList>

        {/* Order Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.customerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {order.customerAddress}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.customerProvince}, {order.customerCanton}, {order.customerDistrict}
                  </p>
                </div>
                {order.customerLocationLink && (
                  <div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={order.customerLocationLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Ubicación
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Información del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <p className="font-medium capitalize">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                {order.deliveryDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                    <p className="font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {formatDate(order.deliveryDate)}
                    </p>
                  </div>
                )}
                {order.assignedMessenger && (
                  <div>
                    <p className="text-sm text-muted-foreground">Mensajero Asignado</p>
                    <p className="font-medium flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {order.assignedMessenger.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Productos del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.product.sku} • Cantidad: {item.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Precio unitario: {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Status Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Estado de Inventario por Producto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((orderItem) => {
                  const inventoryItem = getInventoryItem(orderItem.product.id);
                  const stockMessage = getStockMessage(orderItem, inventoryItem);
                  
                  return (
                    <div key={orderItem.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{orderItem.product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              SKU: {orderItem.product.sku} • Cantidad solicitada: {orderItem.quantity}
                            </p>
                            
                            <Alert className={`mt-3 ${
                              stockMessage.type === 'error' ? 'border-red-200 bg-red-50' :
                              stockMessage.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                              stockMessage.type === 'success' ? 'border-green-200 bg-green-50' :
                              'border-blue-200 bg-blue-50'
                            }`}>
                              <div className="flex items-center gap-2">
                                {stockMessage.icon}
                                <AlertDescription className={`
                                  ${stockMessage.type === 'error' ? 'text-red-800' :
                                    stockMessage.type === 'warning' ? 'text-yellow-800' :
                                    stockMessage.type === 'success' ? 'text-green-800' :
                                    'text-blue-800'}
                                `}>
                                  {stockMessage.message}
                                </AlertDescription>
                              </div>
                            </Alert>

                            {inventoryItem && (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Stock Actual</p>
                                  <p className="font-medium">{inventoryItem.currentStock}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Disponible</p>
                                  <p className="font-medium">{inventoryItem.availableStock}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Reservado</p>
                                  <p className="font-medium">{inventoryItem.reservedStock}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Ubicación</p>
                                  <p className="font-medium">{inventoryItem.location || 'No especificada'}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {inventoryItem && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/asesor/inventory`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}