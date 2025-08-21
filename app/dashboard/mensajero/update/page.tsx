'use client';

import { useState } from 'react';
import { mockApi } from '@/lib/mock-api';
import { Order, OrderStatus } from '@/lib/types';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Search, Package, CheckCircle, AlertCircle, Navigation, Phone } from 'lucide-react';

export default function UpdateOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('en_ruta');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchOrder = async () => {
    if (!orderId.trim()) return;
    
    setLoading(true);
    setError('');
    setOrder(null);
    
    try {
      const orders = await mockApi.getOrders();
      const foundOrder = orders.find(o => 
        o.id.toLowerCase().includes(orderId.toLowerCase()) ||
        o.customer.name.toLowerCase().includes(orderId.toLowerCase()) ||
        o.customer.phone.includes(orderId)
      );
      
      if (foundOrder) {
        setOrder(foundOrder);
        setNewStatus(foundOrder.status);
        setNotes(foundOrder.deliveryNotes || '');
      } else {
        setError('Pedido no encontrado. Intenta con el ID, nombre del cliente o teléfono.');
      }
    } catch (err) {
      setError('Error al buscar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async () => {
    if (!order) return;
    
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      await mockApi.updateOrderStatus(order.id, newStatus, notes);
      setSuccess('Pedido actualizado exitosamente');
      // Update local order state
      setOrder({ ...order, status: newStatus, deliveryNotes: notes });
    } catch (err) {
      setError('Error al actualizar el pedido');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'en_ruta', label: 'En Ruta', color: 'purple' },
    { value: 'entregado', label: 'Entregado', color: 'green' },
    { value: 'devolucion', label: 'Devolución', color: 'red' },
    { value: 'reagendado', label: 'Reagendado', color: 'orange' },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">Actualizar Pedido</h1>
        <p className="text-muted-foreground">
          Busca un pedido por ID, nombre del cliente o teléfono para actualizar su estado
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="search">ID del Pedido, Nombre o Teléfono</Label>
              <Input
                id="search"
                placeholder="Ej: MS-000001, Juan Pérez, 8888-1234"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchOrder} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Order Details */}
      {order && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{order.id}</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{order.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium"
                      onClick={() => window.open(`tel:${order.customer.phone}`)}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {order.customer.phone}
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Estado Actual</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Pago</p>
                    <Badge variant="outline" className="capitalize">
                      {order.paymentMethod.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{order.customer.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer.district}, {order.customer.canton}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Productos</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Form */}
      {order && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Actualizar Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Nuevo Estado</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-${option.color}-500`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notas de Entrega</Label>
              <Textarea
                id="notes"
                placeholder="Agregar notas sobre la entrega (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={updateOrder} 
              disabled={updating}
              className="w-full"
            >
              {updating ? 'Actualizando...' : 'Confirmar Actualización'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}