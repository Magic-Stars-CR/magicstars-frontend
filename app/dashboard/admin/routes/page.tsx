'use client';

import { useState, useEffect } from 'react';
import { mockMessengers } from '@/lib/mock-messengers';
import { Order, User } from '@/lib/types';
import { API_URLS, apiRequest } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';
import { getPedidosByFecha, getCostaRicaDateISO, supabasePedidos } from '@/lib/supabase-pedidos';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Search,
  Filter,
  Plus,
  Download,
  MapPin,
  Route,
  UserCheck,
  Clock,
  Package,
  Navigation,
  Zap,
  Edit,
  Calendar,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminRoutesPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [unassignedAllDates, setUnassignedAllDates] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messengerFilter, setMessengerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Nuevo: Estado para fecha seleccionada (por defecto día actual)
  const [selectedDate, setSelectedDate] = useState(getCostaRicaDateISO());

  // Estados para generar rutas
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateRouteDate, setGenerateRouteDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados para reasignación masiva de mensajero
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [oldMessengerId, setOldMessengerId] = useState<string>('');
  const [newMessengerId, setNewMessengerId] = useState<string>('');
  const [reassignRouteDate, setReassignRouteDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados para asignar pedido individual - mapa de pedido ID a mensajero ID
  const [messengerSelections, setMessengerSelections] = useState<Record<string, string>>({});

  // Auto-refresh cuando el componente se monta
  useEffect(() => {
    loadData();
    loadUnassignedAllDates();
  }, []);

  // Recargar cuando cambia la fecha
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Función para convertir PedidoTest de Supabase a Order del frontend
  const convertPedidoToOrder = (pedido: any): Order => {
    // IMPORTANTE: Solo mirar mensajero_asignado para determinar si está asignado
    // Si mensajero_asignado es null -> pedido SIN asignar
    // Si mensajero_asignado tiene valor -> pedido ASIGNADO
    const mensajeroAsignado = pedido.mensajero_asignado;

    let assignedMessenger = undefined;

    // Si hay un valor en mensajero_asignado, SIEMPRE tratarlo como asignado
    if (mensajeroAsignado && mensajeroAsignado.trim()) {
      const mensajeroNameTrimmed = mensajeroAsignado.trim();
      const mensajeroNameUpper = mensajeroNameTrimmed.toUpperCase();

      // Intentar encontrar el mensajero en mockMessengers (por nombre o ID)
      assignedMessenger = mockMessengers.find(m =>
        m.name.toUpperCase() === mensajeroNameUpper || m.id === mensajeroNameTrimmed
      );

      // Si NO está en mockMessengers, crear un objeto User temporal
      // Esto garantiza que CUALQUIER mensajero en Supabase se muestre como asignado
      if (!assignedMessenger) {
        assignedMessenger = {
          id: `temp-${mensajeroNameUpper}`,
          name: mensajeroNameTrimmed,
          email: `${mensajeroNameUpper.toLowerCase()}@magicstars.com`,
          role: 'mensajero' as const,
          phone: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          company: {
            id: 'company-1',
            name: 'Magic Stars',
            taxId: '123456789',
            address: 'San José, Costa Rica',
            phone: '+506 0000-0000',
            email: 'info@magicstars.com',
            isActive: true,
            createdAt: '2024-01-01T08:00:00Z',
            updatedAt: '2024-01-01T08:00:00Z',
          }
        };
      }
    }

    return {
      id: pedido.id_pedido,
      customerName: pedido.cliente_nombre,
      customerPhone: pedido.cliente_telefono,
      customerAddress: pedido.direccion || '',
      customerProvince: pedido.provincia || '',
      customerCanton: pedido.canton || '',
      customerDistrict: pedido.distrito,
      customerLocationLink: pedido.link_ubicacion || undefined,
      items: [],
      productos: pedido.productos,
      totalAmount: Number(pedido.valor_total),
      status: pedido.estado_pedido?.toLowerCase() as any || 'pendiente',
      paymentMethod: pedido.metodo_pago?.toLowerCase() as any || 'efectivo',
      createdAt: pedido.fecha_creacion,
      updatedAt: pedido.fecha_creacion,
      origin: 'manual' as const,
      assignedMessenger: assignedMessenger,
      deliveryAddress: pedido.direccion || '',
      notes: pedido.notas || undefined
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando pedidos para fecha:', selectedDate);

      // Consultar pedidos desde Supabase por fecha
      const pedidosSupabase = await getPedidosByFecha(selectedDate);
      console.log('📦 Pedidos obtenidos de Supabase para fecha ' + selectedDate + ':', pedidosSupabase.length);

      // Log de muestra de estados originales con información detallada de mensajero
      if (pedidosSupabase.length > 0) {
        console.log('📋 Primeros 10 pedidos (RAW de Supabase) para ' + selectedDate + ':');
        pedidosSupabase.slice(0, 10).forEach((p: any, index: number) => {
          console.log(`  ${index + 1}. ${p.id_pedido}:`, {
            mensajero_asignado: p.mensajero_asignado,
            mensajero_concretado: p.mensajero_concretado,
            estado_pedido: p.estado_pedido,
            fecha_creacion: p.fecha_creacion,
            cliente: p.cliente_nombre
          });
        });
      }

      // Convertir a formato Order
      const ordersConverted = pedidosSupabase.map(convertPedidoToOrder);
      setOrders(ordersConverted);

      // Log después de conversión con detalles completos
      console.log('📊 Pedidos convertidos para fecha ' + selectedDate + ':', ordersConverted.length);
      if (ordersConverted.length > 0) {
        console.log('📋 Primeros 10 pedidos convertidos:');
        ordersConverted.slice(0, 10).forEach((o: Order, index: number) => {
          console.log(`  ${index + 1}. ${o.id}:`, {
            assignedMessenger: o.assignedMessenger?.name || null,
            hasMessenger: !!o.assignedMessenger,
            status: o.status,
            customerName: o.customerName,
            createdAt: o.createdAt
          });
        });
      }

      // Usar mockMessengers como fuente de usuarios mensajeros
      setUsers(mockMessengers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error al cargar pedidos",
        description: "No se pudieron cargar los pedidos desde la base de datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar pedidos sin asignar de todas las fechas
  const loadUnassignedAllDates = async () => {
    try {
      setLoadingUnassigned(true);
      console.log('🔍 Cargando pedidos sin asignar de todas las fechas');

      // Consultar todos los pedidos sin mensajero asignado
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .is('mensajero_asignado', null)
        .in('estado_pedido', ['PENDIENTE', 'CONFIRMADO', 'REAGENDADO'])
        .order('fecha_creacion', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error al cargar pedidos sin asignar:', error);
        return;
      }

      console.log('📦 Pedidos sin asignar obtenidos de Supabase:', data?.length || 0);

      // Log detallado de los primeros 5 pedidos sin asignar
      if (data && data.length > 0) {
        console.log('📋 Primeros 5 pedidos sin asignar (RAW de Supabase):');
        data.slice(0, 5).forEach((pedido: any, index: number) => {
          console.log(`  ${index + 1}. ${pedido.id_pedido}:`, {
            mensajero_asignado: pedido.mensajero_asignado,
            mensajero_concretado: pedido.mensajero_concretado,
            estado_pedido: pedido.estado_pedido,
            fecha_creacion: pedido.fecha_creacion,
            cliente: pedido.cliente_nombre
          });
        });
      }

      // Convertir a formato Order
      const ordersConverted = (data || []).map(convertPedidoToOrder);

      // Log después de conversión
      console.log('📊 Pedidos sin asignar después de conversión:', ordersConverted.length);
      if (ordersConverted.length > 0) {
        console.log('📋 Primeros 5 pedidos convertidos:');
        ordersConverted.slice(0, 5).forEach((order: Order, index: number) => {
          console.log(`  ${index + 1}. ${order.id}:`, {
            assignedMessenger: order.assignedMessenger?.name || null,
            hasMessenger: !!order.assignedMessenger,
            status: order.status,
            customerName: order.customerName
          });
        });
      }

      setUnassignedAllDates(ordersConverted);
    } catch (error) {
      console.error('❌ Error loading unassigned orders:', error);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  // Función para refrescar toda la vista
  const handleRefreshAll = async () => {
    console.log('🔄 ==================== INICIO REFRESH ====================');
    console.log('🔄 Refrescando vista completa de rutas...');
    await Promise.all([
      loadData(),
      loadUnassignedAllDates()
    ]);
    console.log('✅ ==================== FIN REFRESH ====================');
    toast({
      title: "Vista actualizada",
      description: "Los datos se han recargado correctamente",
    });
  };

  // 1. Función para generar rutas automáticamente
  const handleGenerateRoutes = () => {
    setShowGenerateDialog(true);
  };

  const confirmGenerateRoutes = async () => {
    try {
      setLoading(true);
      setShowGenerateDialog(false);

      console.log('🚀 ==================== GENERAR RUTAS ====================');
      console.log('🚀 Fecha:', generateRouteDate);
      console.log('🚀 Endpoint:', API_URLS.GENERAR_RUTAS);

      // Mostrar toast de "procesando"
      toast({
        title: "Procesando...",
        description: "Generando rutas automáticamente. Por favor espere...",
      });

      const response = await apiRequest(API_URLS.GENERAR_RUTAS, {
        method: 'POST',
        body: JSON.stringify({ fecha: generateRouteDate })
      });

      console.log('📡 Status de respuesta:', response.status, response.statusText);

      // Intentar parsear la respuesta como JSON
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      console.log('📡 Respuesta del servidor:', result);
      console.log('📡 Tipo de respuesta:', typeof result);

      if (response.ok) {
        // Respuesta exitosa
        let successMessage = '';

        // Intentar extraer información útil de la respuesta
        if (typeof result === 'string') {
          successMessage = result;
        } else if (result && typeof result === 'object') {
          successMessage = result.message || result.status || JSON.stringify(result);
        }

        console.log('✅ Rutas generadas exitosamente');
        console.log('✅ Mensaje:', successMessage);

        toast({
          title: "✅ ¡Rutas generadas exitosamente!",
          description: successMessage || `Las rutas para ${generateRouteDate} se han generado correctamente.`,
        });

        // Recargar datos
        console.log('🔄 Recargando datos...');
        await loadData();
        console.log('✅ ==================== FIN GENERAR RUTAS ====================');
      } else {
        // Error del servidor
        let errorMessage = 'Error al generar rutas';

        if (typeof result === 'string') {
          errorMessage = result;
        } else if (result && typeof result === 'object') {
          errorMessage = result.message || result.error || JSON.stringify(result);
        }

        console.error('❌ Error del servidor:', errorMessage);

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error al generar rutas:', error);
      console.error('❌ ==================== FIN GENERAR RUTAS (ERROR) ====================');

      toast({
        title: "❌ Error al generar rutas",
        description: error instanceof Error ? error.message : 'Error desconocido al procesar la solicitud',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Función para asignar pedido individual
  const handleAssignOrder = async (orderId: string, messengerId: string) => {
    try {
      setLoading(true);

      // Encontrar el mensajero seleccionado para obtener su nombre
      const selectedMessenger = messengers.find((m: User) => m.id === messengerId);
      const messengerName = selectedMessenger?.name;

      console.log('🚀 ==================== ASIGNACIÓN INDIVIDUAL ====================');
      console.log('🚀 Asignando pedido:', {
        id_pedido: orderId,
        mensajero_id: messengerId,
        mensajero_nombre: messengerName
      });
      console.log('⚠️  IMPORTANTE: El endpoint recibe ID pero Supabase almacena NOMBRE');

      const response = await apiRequest(API_URLS.ASIGNAR_PEDIDO_INDIVIDUAL, {
        method: 'POST',
        body: JSON.stringify({
          id_pedido: orderId,
          mensajero_asignado: messengerId
        })
      });

      const result = await response.json();
      console.log('📡 Respuesta del servidor:', result);

      if (response.ok && result === 'generado exitosamente') {
        console.log('✅ Asignación exitosa según servidor');
        toast({
          title: "¡Pedido asignado exitosamente!",
          description: `El pedido ${orderId} ha sido asignado correctamente.`,
        });
        console.log('🔄 Recargando datos desde Supabase...');
        await loadData();
        console.log('✅ ==================== FIN ASIGNACIÓN ====================');
      } else {
        throw new Error(result.message || 'Error al asignar pedido');
      }
    } catch (error) {
      console.error('❌ Error al asignar pedido:', error);
      toast({
        title: "Error al asignar pedido",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Función para reasignar todos los pedidos de un mensajero a otro
  const confirmReassignMessenger = async () => {
    try {
      setLoading(true);
      setShowReassignDialog(false);

      console.log('🚀 Reasignando pedidos masivamente:', {
        mensajero_antiguo: oldMessengerId,
        mensajero_actual: newMessengerId,
        fecha_ruta: reassignRouteDate
      });

      const response = await apiRequest(API_URLS.REASIGNAR_PEDIDOS_MENSAJERO, {
        method: 'POST',
        body: JSON.stringify({
          mensajero_antiguo: oldMessengerId,
          mensajero_actual: newMessengerId,
          fecha_ruta: reassignRouteDate
        })
      });

      const result = await response.json();
      console.log('📡 Respuesta del servidor:', result);

      if (response.ok && result === 'generado exitosamente') {
        const oldMessengerName = messengers.find((m: User) => m.id === oldMessengerId)?.name || oldMessengerId;
        const newMessengerName = messengers.find((m: User) => m.id === newMessengerId)?.name || newMessengerId;

        toast({
          title: "¡Pedidos reasignados exitosamente!",
          description: `Todos los pedidos de ${oldMessengerName} han sido reasignados a ${newMessengerName}.`,
        });

        // Limpiar selecciones
        setOldMessengerId('');
        setNewMessengerId('');

        await loadData();
      } else {
        throw new Error(result.message || 'Error al reasignar pedidos');
      }
    } catch (error) {
      console.error('❌ Error al reasignar pedidos:', error);
      toast({
        title: "Error al reasignar pedidos",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
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

  const getUnassignedOrders = () => {
    const filtered = orders.filter((order: Order) => {
      const hasNoMessenger = !order.assignedMessenger;
      const status = order.status.toLowerCase();
      // Excluir solo estados finales (entregado, devolucion) o eliminados
      const excludedStatuses = ['entregado', 'devolucion', 'cancelado', 'eliminado'];
      const isNotExcluded = !excludedStatuses.includes(status);

      return hasNoMessenger && isNotExcluded;
    });

    // Log detallado de los pedidos sin asignar del día actual
    console.log('🔍 getUnassignedOrders() - Filtrando pedidos sin asignar del día actual');
    console.log(`  - Total orders en estado: ${orders.length}`);
    console.log(`  - Pedidos sin asignar filtrados: ${filtered.length}`);

    if (filtered.length > 0) {
      console.log('📋 Primeros 5 pedidos sin asignar (día actual):');
      filtered.slice(0, 5).forEach((order: Order, index: number) => {
        console.log(`  ${index + 1}. ${order.id}:`, {
          assignedMessenger: order.assignedMessenger?.name || null,
          hasMessenger: !!order.assignedMessenger,
          status: order.status,
          customerName: order.customerName,
          createdAt: order.createdAt
        });
      });
    }

    return filtered;
  };

  const getAssignedOrders = () => {
    const filtered = orders.filter((order: Order) => {
      const hasMessenger = !!order.assignedMessenger;
      // Mostrar todos los pedidos asignados, sin importar el estado
      // Esto permite ver pedidos en cualquier etapa del proceso
      return hasMessenger;
    });

    // Log detallado de los pedidos asignados del día actual
    console.log('🔍 getAssignedOrders() - Filtrando pedidos asignados del día actual');
    console.log(`  - Total orders en estado: ${orders.length}`);
    console.log(`  - Pedidos asignados filtrados: ${filtered.length}`);

    if (filtered.length > 0) {
      console.log('📋 Primeros 5 pedidos asignados (día actual):');
      filtered.slice(0, 5).forEach((order: Order, index: number) => {
        console.log(`  ${index + 1}. ${order.id}:`, {
          assignedMessenger: order.assignedMessenger?.name || null,
          hasMessenger: !!order.assignedMessenger,
          status: order.status,
          customerName: order.customerName,
          createdAt: order.createdAt
        });
      });
    }

    return filtered;
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

  const messengers = users.filter(u => u.role === 'mensajero' && u.isActive);
  const unassignedOrders = getUnassignedOrders();
  const assignedOrders = getAssignedOrders();

  // Log para depuración
  useEffect(() => {
    console.log('📊 Estado actual de pedidos:');
    console.log('  - Total orders:', orders.length);
    console.log('  - Unassigned orders:', unassignedOrders.length);
    console.log('  - Assigned orders:', assignedOrders.length);

    if (orders.length > 0 && unassignedOrders.length === 0 && assignedOrders.length === 0) {
      console.warn('⚠️ Hay pedidos pero ninguno aparece en las listas!');
      console.log('📋 Muestra de pedidos disponibles:',
        orders.slice(0, 3).map((o: Order) => ({
          id: o.id,
          status: o.status,
          statusType: typeof o.status,
          hasMessenger: !!o.assignedMessenger,
          messenger: o.assignedMessenger?.name
        }))
      );
    }
  }, [orders, unassignedOrders, assignedOrders]);

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
          <h1 className="text-3xl font-bold">Asignación de Rutas</h1>
          <p className="text-muted-foreground">
            Optimiza y asigna rutas a mensajeros para máxima eficiencia
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshAll}
            disabled={loading || loadingUnassigned}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loading || loadingUnassigned) ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleGenerateRoutes} disabled={loading}>
            <Route className="w-4 h-4 mr-2" />
            Generar Rutas
          </Button>
          <Button onClick={() => setShowReassignDialog(true)} disabled={loading} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reasignar Mensajero
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Selector de Fecha */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Label htmlFor="date-filter" className="font-semibold">Fecha de rutas:</Label>
            <Input
              id="date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(getCostaRicaDateISO())}
            >
              Hoy
            </Button>
            <span className="text-sm text-muted-foreground">
              Mostrando {orders.length} pedidos
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sin Asignar</p>
                <p className="text-2xl font-bold">{unassignedOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Asignados</p>
                <p className="text-2xl font-bold">{assignedOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensajeros Activos</p>
                <p className="text-2xl font-bold">{messengers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Navigation className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Ruta</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'en_ruta').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-600" />
            Pedidos Sin Asignar ({unassignedOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {unassignedOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
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

                  <div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select
                    value={messengerSelections[order.id] || ''}
                    onValueChange={(value) => setMessengerSelections(prev => ({ ...prev, [order.id]: value }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Asignar a..." />
                    </SelectTrigger>
                    <SelectContent>
                      {messengers.map(messenger => (
                        <SelectItem key={messenger.id} value={messenger.id}>
                          {messenger.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => handleAssignOrder(order.id, messengerSelections[order.id])}
                    disabled={!messengerSelections[order.id] || loading}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Asignar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Pedidos Asignados ({assignedOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignedOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
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

                  <div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select
                    value={messengerSelections[order.id] || order.assignedMessenger?.id || ''}
                    onValueChange={(value) => setMessengerSelections(prev => ({ ...prev, [order.id]: value }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Cambiar a..." />
                    </SelectTrigger>
                    <SelectContent>
                      {messengers.map(messenger => (
                        <SelectItem key={messenger.id} value={messenger.id}>
                          {messenger.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleAssignOrder(order.id, messengerSelections[order.id])}
                    disabled={!messengerSelections[order.id] || messengerSelections[order.id] === order.assignedMessenger?.id || loading}
                  >
                    Reasignar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pedidos Sin Asignar - Todas las Fechas */}
      {unassignedAllDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Pedidos Sin Asignar - Historial ({unassignedAllDates.length})
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadUnassignedAllDates}
                disabled={loadingUnassigned}
              >
                {loadingUnassigned ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                  </>
                )}
              </Button>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Pedidos pendientes de asignación de fechas anteriores
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unassignedAllDates.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-semibold text-sm">{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt}
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
                        {order.paymentMethod === 'sinpe' ? 'SINPE' :
                         order.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate">{order.customerDistrict}</span>
                    </div>

                    <div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={messengerSelections[order.id] || ''}
                        onValueChange={(value) => setMessengerSelections(prev => ({ ...prev, [order.id]: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Asignar a..." />
                        </SelectTrigger>
                        <SelectContent>
                          {messengers.map(messenger => (
                            <SelectItem key={messenger.id} value={messenger.id}>
                              {messenger.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="ml-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        handleAssignOrder(order.id, messengerSelections[order.id]);
                        // Recargar la lista después de asignar
                        setTimeout(loadUnassignedAllDates, 1000);
                      }}
                      disabled={!messengerSelections[order.id] || loading}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Asignar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para generar rutas */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Rutas Automáticamente</DialogTitle>
            <DialogDescription>
              Selecciona la fecha para la cual deseas generar las rutas de los mensajeros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="route-date">Fecha de Ruta</Label>
              <Input
                id="route-date"
                type="date"
                value={generateRouteDate}
                onChange={(e) => setGenerateRouteDate(e.target.value)}
                className="w-full"
              />
            </div>
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Se generarán automáticamente las rutas con 30 pedidos por mensajero para la fecha seleccionada.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmGenerateRoutes}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generar Rutas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para reasignar pedidos masivamente de un mensajero a otro */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reasignar Pedidos de Mensajero</DialogTitle>
            <DialogDescription>
              Reasigna todos los pedidos de un mensajero a otro para una fecha específica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-messenger">Mensajero Origen</Label>
              <Select value={oldMessengerId} onValueChange={setOldMessengerId}>
                <SelectTrigger id="old-messenger">
                  <SelectValue placeholder="Selecciona mensajero origen..." />
                </SelectTrigger>
                <SelectContent>
                  {messengers.map((messenger: User) => (
                    <SelectItem key={messenger.id} value={messenger.id}>
                      {messenger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-messenger">Mensajero Destino</Label>
              <Select value={newMessengerId} onValueChange={setNewMessengerId}>
                <SelectTrigger id="new-messenger">
                  <SelectValue placeholder="Selecciona mensajero destino..." />
                </SelectTrigger>
                <SelectContent>
                  {messengers.map((messenger: User) => (
                    <SelectItem key={messenger.id} value={messenger.id}>
                      {messenger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reassign-date">Fecha de Ruta</Label>
              <Input
                id="reassign-date"
                type="date"
                value={reassignRouteDate}
                onChange={(e) => setReassignRouteDate(e.target.value)}
                className="w-full"
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta acción reasignará TODOS los pedidos del mensajero origen al mensajero destino para la fecha seleccionada.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReassignDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReassignMessenger}
              disabled={!oldMessengerId || !newMessengerId || oldMessengerId === newMessengerId || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reasignando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reasignar Pedidos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
