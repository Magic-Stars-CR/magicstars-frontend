'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockApi } from '@/lib/mock-api';
import { RedLogisticOrder, RedLogisticTracking, RedLogisticStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Weight,
  Ruler,
  User,
  Phone,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  History,
  Eye,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RedLogisticOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<RedLogisticOrder | null>(null);
  const [tracking, setTracking] = useState<RedLogisticTracking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadData(params.id as string);
    }
  }, [params.id]);

  const loadData = async (orderId: string) => {
    try {
      setLoading(true);
      const [orderData, trackingData] = await Promise.all([
        mockApi.getRedLogisticOrder(orderId),
        mockApi.getRedLogisticTracking(orderId),
      ]);
      setOrder(orderData);
      setTracking(trackingData);
    } catch (error) {
      console.error('Error loading Red Logística order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: RedLogisticStatus) => {
    if (!order) return;
    
    try {
      await mockApi.updateRedLogisticOrderStatus(order.id, newStatus);
      
      // Procesar inventario automáticamente
      try {
        if (newStatus === 'enviado') {
          await mockApi.processRedLogisticInventory(order.id, 'ship');
        } else if (newStatus === 'entregado') {
          await mockApi.processRedLogisticInventory(order.id, 'deliver');
        } else if (newStatus === 'devuelto') {
          await mockApi.processRedLogisticInventory(order.id, 'return');
        }
      } catch (inventoryError) {
        console.error('Error processing inventory:', inventoryError);
      }
      
      await loadData(order.id);
    } catch (error) {
      console.error('Error updating status:', error);
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

  const getStatusIcon = (status: RedLogisticStatus) => {
    switch (status) {
      case 'pendiente_envio': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'enviado': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'en_transito': return <Package className="w-4 h-4 text-orange-600" />;
      case 'entregado': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'devuelto': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'cancelado': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
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
            <Link href="/dashboard/admin/red-logistic">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Red Logística
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Envío no encontrado</p>
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
            <Link href="/dashboard/admin/red-logistic">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Red Logística
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Envío {order.trackingNumber}</h1>
            <p className="text-muted-foreground">
              {order.order.customerName} • {order.company.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/orders/${order.orderId}`}>
              <Eye className="w-4 h-4 mr-2" />
              Ver Pedido Original
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Detalles del Envío</TabsTrigger>
          <TabsTrigger value="tracking">Seguimiento</TabsTrigger>
          <TabsTrigger value="inventory">Estado de Inventario</TabsTrigger>
        </TabsList>

        {/* Order Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Shipping Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Información de Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número de Tracking</p>
                  <p className="font-mono font-medium">{order.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado Actual</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    {getStatusBadge(order.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Entrega</p>
                  <p className="font-medium capitalize">{order.deliveryMethod.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <p className="text-sm text-muted-foreground">Entrega Estimada</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDate(order.estimatedDelivery)}
                    </p>
                  </div>
                )}
                {order.actualDelivery && (
                  <div>
                    <p className="text-sm text-muted-foreground">Entrega Real</p>
                    <p className="font-medium flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      {formatDate(order.actualDelivery)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Información del Paquete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Peso</p>
                  <p className="font-medium flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    {order.weight} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dimensiones</p>
                  <p className="font-medium flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    {order.dimensions.length} x {order.dimensions.width} x {order.dimensions.height} cm
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Declarado</p>
                  <p className="font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(order.declaredValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Costo de Envío</p>
                  <p className="font-medium">{formatCurrency(order.shippingCost)}</p>
                </div>
                {order.insuranceCost && (
                  <div>
                    <p className="text-sm text-muted-foreground">Seguro</p>
                    <p className="font-medium">{formatCurrency(order.insuranceCost)}</p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Costo Total</p>
                  <p className="font-bold text-lg">{formatCurrency(order.totalCost)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Addresses */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Dirección de Origen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.pickupAddress}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Dirección de Destino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.deliveryAddress}</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{order.order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.order.customerPhone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Dirección Completa</p>
                  <p className="font-medium">
                    {order.order.customerAddress}, {order.order.customerDistrict}, {order.order.customerCanton}, {order.order.customerProvince}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones de Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {order.status === 'pendiente_envio' && (
                  <Button onClick={() => updateStatus('enviado')} className="bg-blue-600 hover:bg-blue-700">
                    <Truck className="w-4 h-4 mr-2" />
                    Marcar como Enviado
                  </Button>
                )}
                {order.status === 'enviado' && (
                  <Button onClick={() => updateStatus('en_transito')} className="bg-orange-600 hover:bg-orange-700">
                    <Package className="w-4 h-4 mr-2" />
                    Marcar en Tránsito
                  </Button>
                )}
                {order.status === 'en_transito' && (
                  <Button onClick={() => updateStatus('entregado')} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Entregado
                  </Button>
                )}
                {(order.status === 'enviado' || order.status === 'en_transito') && (
                  <Button 
                    onClick={() => updateStatus('devuelto')} 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Marcar como Devuelto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Seguimiento ({tracking.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tracking.length > 0 ? (
                  tracking.map((entry, index) => (
                    <div key={entry.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(entry.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{entry.description}</p>
                          {getStatusBadge(entry.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {entry.location}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(entry.timestamp)}
                          </div>
                        </div>
                        {entry.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <span className="font-medium">Notas:</span> {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay historial de seguimiento disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Estado de Inventario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  El inventario se procesa automáticamente cuando cambias el estado del envío. 
                  Los productos se descontarán cuando se marque como "Enviado" y se devolverán si se marca como "Devuelto".
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-4">
                {order.order.items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product.sku} • Cantidad: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)} c/u
                        </p>
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
