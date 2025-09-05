'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { Order, User } from '@/lib/types';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Calendar,
  MapPin
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [messengerFilter, setMessengerFilter] = useState<string>('all');
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [statusFilter, messengerFilter, deliveryMethodFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (messengerFilter !== 'all') {
        filters.assignedMessengerId = messengerFilter;
      }
      if (deliveryMethodFilter !== 'all') {
        filters.deliveryMethod = deliveryMethodFilter;
      }
      
      const [ordersRes, usersRes] = await Promise.all([
        mockApi.getOrders(filters),
        mockApi.getUsers(),
      ]);
      setOrders(ordersRes);
      setUsers(usersRes);
    } catch (error) {
      console.error('Error loading data:', error);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessengerName = (messengerId: string) => {
    const messenger = users.find(u => u.id === messengerId && u.role === 'mensajero');
    return messenger?.name || 'Sin asignar';
  };

  const getDeliveryMethodName = (method?: string) => {
    switch (method) {
      case 'mensajeria_propia': return 'Mensajería Propia';
      case 'red_logistic': return 'Red Logística';
      case 'correos_costa_rica': return 'Correos de Costa Rica';
      default: return 'No especificado';
    }
  };

  const getDeliveryMethodIcon = (method?: string) => {
    switch (method) {
      case 'mensajeria_propia': return '🚚';
      case 'red_logistic': return '🌐';
      case 'correos_costa_rica': return '📮';
      default: return '❓';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerPhone && order.customerPhone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesMessenger = messengerFilter === 'all' || order.assignedMessenger?.id === messengerFilter;

    return matchesSearch && matchesStatus && matchesMessenger;
  });

  const messengers = users.filter(u => u.role === 'mensajero');

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
          <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">
            Administra todos los pedidos del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/admin/orders/new">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pedido
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="en_ruta">En Ruta</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="devolucion">Devolución</SelectItem>
                <SelectItem value="reagendado">Reagendado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={messengerFilter} onValueChange={setMessengerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por mensajero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los mensajeros</SelectItem>
                {messengers.map(messenger => (
                  <SelectItem key={messenger.id} value={messenger.id}>
                    {messenger.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={deliveryMethodFilter} onValueChange={setDeliveryMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por mensajería" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las mensajerías</SelectItem>
                <SelectItem value="mensajeria_propia">Mensajería Propia</SelectItem>
                <SelectItem value="red_logistic">Red Logística</SelectItem>
                <SelectItem value="correos_costa_rica">Correos de Costa Rica</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium text-sm">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerPhone || 'Sin teléfono'}</p>
                  </div>

                  <div>
                    <p className="font-bold text-sm">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.paymentMethod === 'sinpe' ? 'SINPE' : 'Efectivo'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{order.deliveryAddress || 'Sin dirección'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{getMessengerName(order.assignedMessenger?.id || '')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getDeliveryMethodIcon(order.deliveryMethod)}</span>
                    <span className="text-sm">{getDeliveryMethodName(order.deliveryMethod)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/admin/orders/${order.id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/admin/inventory`}>
                      <Package className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
