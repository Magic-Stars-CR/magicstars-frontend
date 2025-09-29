'use client';

import { useState, useEffect } from 'react';
import { getPedidos, updatePedido } from '@/lib/supabase-pedidos';
import { Order, User, PedidoTest, OrderStatus } from '@/lib/types';
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
  const [orders, setOrders] = useState<PedidoTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [messengerFilter, setMessengerFilter] = useState<string>('all');
  const [distritoFilter, setDistritoFilter] = useState<string>('all');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter, messengerFilter, distritoFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Cargando pedidos de Supabase para admin orders...');
      
      // Cargar pedidos de Supabase
      const pedidosDataResult = await getPedidos(1, 200); // Página 1, 200 pedidos por página
      const pedidosData = pedidosDataResult.data;
      console.log('Pedidos cargados:', pedidosData.length);
      
      setOrders(pedidosData);
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

  // Función para obtener el status basado en los datos de PedidoTest
  const getStatusForOrder = (order: PedidoTest): OrderStatus => {
    if (order.mensajero_concretado) {
      return 'entregado';
    } else if (order.mensajero_asignado) {
      return 'en_ruta';
    } else {
      return 'pendiente';
    }
  };

  const getMessengerName = (order: PedidoTest) => {
    return order.mensajero_asignado || 'Sin asignar';
  };

  const getDeliveryMethodName = () => {
    return 'Mensajería Propia'; // Por defecto para PedidoTest
  };

  // Función para actualizar el estado de un pedido
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrder(orderId);
      
      const updates: Partial<PedidoTest> = {};
      
      if (newStatus === 'entregado') {
        // Para marcar como entregado, necesitamos el mensajero asignado
        const order = orders.find(o => o.id_pedido === orderId);
        if (order?.mensajero_asignado) {
          updates.mensajero_concretado = order.mensajero_asignado;
        }
      } else if (newStatus === 'en_ruta') {
        // Para marcar como en ruta, asignamos un mensajero genérico
        updates.mensajero_asignado = 'Mensajero Admin';
      }
      
      // Añadir usuario que realiza la acción
      updates.usuario = 'Admin';
      
      const success = await updatePedido(orderId, updates);
      
      if (success) {
        await loadData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdatingOrder(null);
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
    // Filtrar pedidos que no tengan id_pedido
    if (!order.id_pedido) {
      return false;
    }

    const matchesSearch = 
      (order.id_pedido?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (order.distrito?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (order.productos?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || getStatusForOrder(order) === statusFilter;
    const matchesMessenger = messengerFilter === 'all' || order.mensajero_asignado === messengerFilter;
    const matchesDistrito = distritoFilter === 'all' || order.distrito === distritoFilter;

    return matchesSearch && matchesStatus && matchesMessenger && matchesDistrito;
  });

  // Obtener listas únicas para filtros
  const distritos = Array.from(new Set(orders.map(o => o.distrito).filter(Boolean))).sort() as string[];
  const mensajeros = Array.from(new Set(orders.map(o => o.mensajero_asignado).filter(Boolean))).sort() as string[];

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
                placeholder="Buscar por ID, distrito o productos..."
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
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_ruta">En Ruta</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={messengerFilter} onValueChange={setMessengerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por mensajero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los mensajeros</SelectItem>
                {mensajeros.map(mensajero => (
                  <SelectItem key={mensajero} value={mensajero}>
                    {mensajero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={distritoFilter} onValueChange={setDistritoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los distritos</SelectItem>
                {distritos.map(distrito => (
                  <SelectItem key={distrito} value={distrito}>
                    {distrito}
                  </SelectItem>
                ))}
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
              <div key={order.id_pedido} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">{order.id_pedido || 'Sin ID'}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.distrito || 'Sin distrito'}
                    </p>
                  </div>
                  </div>

                  <div>
                    <p className="font-medium text-sm">{order.productos || 'Sin productos'}</p>
                    <p className="text-xs text-muted-foreground">{order.nota_asesor || 'Sin nota'}</p>
                  </div>

                  <div>
                    <p className="font-bold text-sm">{formatCurrency(order.valor_total || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      Efectivo
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{order.distrito || 'Sin distrito'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{getMessengerName(order)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚚</span>
                    <span className="text-sm">{getDeliveryMethodName()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={getStatusForOrder(order)} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/admin/orders/${order.id_pedido}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const currentStatus = getStatusForOrder(order);
                      const newStatus = currentStatus === 'pendiente' ? 'en_ruta' : 
                                      currentStatus === 'en_ruta' ? 'entregado' : 'pendiente';
                      handleStatusUpdate(order.id_pedido, newStatus);
                    }}
                    disabled={updatingOrder === order.id_pedido}
                  >
                    {updatingOrder === order.id_pedido ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )}
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
