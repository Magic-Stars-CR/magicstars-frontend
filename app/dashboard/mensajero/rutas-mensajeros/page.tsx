'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { PedidoTest } from '@/lib/types';
import { getCostaRicaDateISO, getMensajerosUnicos, getPedidosByFecha } from '@/lib/supabase-pedidos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  Calendar, 
  User, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  DollarSign,
  MapPin,
  Eye,
  Loader2,
  TrendingUp,
  Users,
  Phone,
  MessageCircle,
  Navigation,
  Clipboard,
  Building2,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessengerRouteStats {
  messengerId: string;
  messengerName: string;
  totalOrders: number;
  entregadoOrders: number;
  pendingOrders: number;
  devolucionOrders: number;
  reagendadoOrders: number;
  totalValue: number;
  cashCollected: number;
  sinpeCollected: number;
  tarjetaCollected: number;
  orders: PedidoTest[];
}

export default function RutasMensajerosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [messengersStats, setMessengersStats] = useState<MessengerRouteStats[]>([]);
  const [expandedMessenger, setExpandedMessenger] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<PedidoTest[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Verificar que el usuario sea líder de mensajeros
  useEffect(() => {
    if (user && user.role === 'mensajero' && !user.isMessengerLeader) {
      router.push('/dashboard/mensajero');
    }
  }, [user, router]);

  // Inicializar fecha al cargar el componente
  useEffect(() => {
    const initializeDate = async () => {
      if (!selectedDate) {
        const costaRicaDate = getCostaRicaDateISO();
        setSelectedDate(costaRicaDate);
        console.log('📅 Fecha inicializada para Costa Rica:', costaRicaDate);
      }
    };

    initializeDate();
  }, []);

  // Cargar datos cuando cambia la fecha
  useEffect(() => {
    if (selectedDate) {
      loadRoutesData();
    }
  }, [selectedDate]);

  const loadRoutesData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando rutas para fecha:', selectedDate);

      // Obtener todos los pedidos del día
      const pedidos = await getPedidosByFecha(selectedDate);
      setAllOrders(pedidos);
      
      console.log('📦 Total de pedidos obtenidos:', pedidos.length);

      // Obtener mensajeros únicos
      const mensajeros = await getMensajerosUnicos();
      console.log('👥 Mensajeros encontrados:', mensajeros.length);

      // Calcular estadísticas por mensajero
      const stats: MessengerRouteStats[] = mensajeros.map(mensajero => {
        // Filtrar pedidos del mensajero
        const messengerOrders = pedidos.filter(
          p => p.mensajero_asignado?.toLowerCase() === mensajero.toLowerCase() ||
               p.mensajero_concretado?.toLowerCase() === mensajero.toLowerCase()
        );

        // Contar estados
        const entregados = messengerOrders.filter(p => p.estado_pedido?.toUpperCase() === 'ENTREGADO').length;
        const pendientes = messengerOrders.filter(p => 
          !p.estado_pedido || 
          p.estado_pedido?.toUpperCase() === 'PENDIENTE' ||
          p.estado_pedido?.toUpperCase() === 'EN_RUTA'
        ).length;
        const devoluciones = messengerOrders.filter(p => p.estado_pedido?.toUpperCase() === 'DEVOLUCION').length;
        const reagendados = messengerOrders.filter(p => p.estado_pedido?.toUpperCase() === 'REAGENDADO').length;

        // Calcular valores monetarios (solo pedidos entregados)
        const entregadosOrders = messengerOrders.filter(p => p.estado_pedido?.toUpperCase() === 'ENTREGADO');
        const totalValue = messengerOrders.reduce((sum, p) => sum + (p.valor_total || 0), 0);
        
        const cashCollected = entregadosOrders
          .filter(p => p.metodo_pago?.toLowerCase() === 'efectivo')
          .reduce((sum, p) => sum + (p.valor_total || 0), 0);
        
        const sinpeCollected = entregadosOrders
          .filter(p => p.metodo_pago?.toLowerCase() === 'sinpe')
          .reduce((sum, p) => sum + (p.valor_total || 0), 0);
        
        const tarjetaCollected = entregadosOrders
          .filter(p => p.metodo_pago?.toLowerCase() === 'tarjeta')
          .reduce((sum, p) => sum + (p.valor_total || 0), 0);

        return {
          messengerId: mensajero,
          messengerName: mensajero,
          totalOrders: messengerOrders.length,
          entregadoOrders: entregados,
          pendingOrders: pendientes,
          devolucionOrders: devoluciones,
          reagendadoOrders: reagendados,
          totalValue,
          cashCollected,
          sinpeCollected,
          tarjetaCollected,
          orders: messengerOrders,
        };
      });

      // Ordenar por cantidad de pedidos
      stats.sort((a, b) => b.totalOrders - a.totalOrders);

      // Filtrar mensajeros con al menos un pedido
      const statsWithOrders = stats.filter(s => s.totalOrders > 0);

      setMessengersStats(statsWithOrders);
      console.log('✅ Estadísticas calculadas para', statsWithOrders.length, 'mensajeros');
    } catch (error) {
      console.error('❌ Error cargando rutas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado: string | null) => {
    const estadoUpper = estado?.toUpperCase() || 'PENDIENTE';
    
    const statusConfig = {
      'ENTREGADO': { color: 'bg-green-500', icon: CheckCircle, label: 'Entregado' },
      'PENDIENTE': { color: 'bg-yellow-500', icon: Clock, label: 'Pendiente' },
      'EN_RUTA': { color: 'bg-blue-500', icon: Truck, label: 'En Ruta' },
      'DEVOLUCION': { color: 'bg-red-500', icon: XCircle, label: 'Devolución' },
      'REAGENDADO': { color: 'bg-orange-500', icon: AlertCircle, label: 'Reagendado' },
    };

    const config = statusConfig[estadoUpper as keyof typeof statusConfig] || statusConfig['PENDIENTE'];
    const Icon = config.icon;

    return (
      <Badge className={cn('text-white', config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Función para copiar al portapapeles
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${label} copiado:`, text);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Función para obtener el color de la fila según el estado
  const getStatusRowColor = (estado: string | null) => {
    const estadoUpper = estado?.toUpperCase() || 'PENDIENTE';
    
    switch (estadoUpper) {
      case 'ENTREGADO':
        return 'bg-green-50 hover:bg-green-100';
      case 'EN_RUTA':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'DEVOLUCION':
        return 'bg-red-50 hover:bg-red-100';
      case 'REAGENDADO':
        return 'bg-orange-50 hover:bg-orange-100';
      default:
        return 'bg-yellow-50 hover:bg-yellow-100';
    }
  };

  // Función para obtener el color del indicador según el estado
  const getStatusIndicatorColor = (estado: string | null) => {
    const estadoUpper = estado?.toUpperCase() || 'PENDIENTE';
    
    switch (estadoUpper) {
      case 'ENTREGADO':
        return 'bg-green-500';
      case 'EN_RUTA':
        return 'bg-blue-500';
      case 'DEVOLUCION':
        return 'bg-red-500';
      case 'REAGENDADO':
        return 'bg-orange-500';
      default:
        return 'bg-yellow-500';
    }
  };

  // Función para obtener el estilo sticky según el estado
  const getStatusStickyStyle = (estado: string | null) => {
    const estadoUpper = estado?.toUpperCase() || 'PENDIENTE';
    
    switch (estadoUpper) {
      case 'ENTREGADO':
        return 'bg-green-50';
      case 'EN_RUTA':
        return 'bg-blue-50';
      case 'DEVOLUCION':
        return 'bg-red-50';
      case 'REAGENDADO':
        return 'bg-orange-50';
      default:
        return 'bg-yellow-50';
    }
  };

  // Filtrar pedidos según el término de búsqueda y estado
  const getFilteredOrders = (orders: PedidoTest[]) => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.id_pedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.direccion?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'entregado' && order.estado_pedido?.toUpperCase() === 'ENTREGADO') ||
        (statusFilter === 'en_ruta' && order.estado_pedido?.toUpperCase() === 'EN_RUTA') ||
        (statusFilter === 'pendiente' && (!order.estado_pedido || order.estado_pedido?.toUpperCase() === 'PENDIENTE')) ||
        (statusFilter === 'devolucion' && order.estado_pedido?.toUpperCase() === 'DEVOLUCION') ||
        (statusFilter === 'reagendado' && order.estado_pedido?.toUpperCase() === 'REAGENDADO');
      
      return matchesSearch && matchesStatus;
    });
  };

  // Calcular totales generales
  const totalGeneralOrders = messengersStats.reduce((sum, m) => sum + m.totalOrders, 0);
  const totalGeneralEntregados = messengersStats.reduce((sum, m) => sum + m.entregadoOrders, 0);
  const totalGeneralPendientes = messengersStats.reduce((sum, m) => sum + m.pendingOrders, 0);
  const totalGeneralDevoluciones = messengersStats.reduce((sum, m) => sum + m.devolucionOrders, 0);
  const totalGeneralValue = messengersStats.reduce((sum, m) => sum + m.totalValue, 0);
  const totalGeneralCash = messengersStats.reduce((sum, m) => sum + m.cashCollected, 0);
  const totalGeneralSinpe = messengersStats.reduce((sum, m) => sum + m.sinpeCollected, 0);
  const totalGeneralTarjeta = messengersStats.reduce((sum, m) => sum + m.tarjetaCollected, 0);
  const efectividadGeneral = totalGeneralOrders > 0 
    ? ((totalGeneralEntregados / totalGeneralOrders) * 100).toFixed(1) 
    : '0';

  if (!user || user.role !== 'mensajero' || !user.isMessengerLeader) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permiso para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Rutas de Mensajeros</h1>
          <p className="text-muted-foreground">Vista general de todas las rutas del día</p>
        </div>

        {/* Filtro de fecha */}
        <div className="flex items-center gap-2">
          <Label htmlFor="date-filter" className="whitespace-nowrap">
            <Calendar className="w-4 h-4 inline mr-2" />
            Fecha:
          </Label>
          <Input
            id="date-filter"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mensajeros Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messengersStats.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Con rutas asignadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGeneralOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">{totalGeneralEntregados} entregados</span> • 
              <span className="text-yellow-600 ml-1">{totalGeneralPendientes} pendientes</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Efectividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efectividadGeneral}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa de entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Recaudado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGeneralCash + totalGeneralSinpe + totalGeneralTarjeta)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {totalGeneralEntregados} entregas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de mensajeros */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Cargando rutas...</span>
          </CardContent>
        </Card>
      ) : messengersStats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay rutas para esta fecha</p>
            <p className="text-sm text-muted-foreground">Selecciona otra fecha para ver las rutas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messengersStats.map((messenger) => (
            <Card key={messenger.messengerId} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{messenger.messengerName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {messenger.totalOrders} pedidos • {((messenger.entregadoOrders / messenger.totalOrders) * 100).toFixed(1)}% efectividad
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedMessenger(
                      expandedMessenger === messenger.messengerId ? null : messenger.messengerId
                    )}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {expandedMessenger === messenger.messengerId ? 'Ocultar' : 'Ver'} Detalles
                  </Button>
                </div>

                {/* Estadísticas del mensajero */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Entregados</span>
                    </div>
                    <div className="text-xl font-bold mt-1">{messenger.entregadoOrders}</div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">Pendientes</span>
                    </div>
                    <div className="text-xl font-bold mt-1">{messenger.pendingOrders}</div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Devoluciones</span>
                    </div>
                    <div className="text-xl font-bold mt-1">{messenger.devolucionOrders}</div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium">Recaudado</span>
                    </div>
                    <div className="text-lg font-bold mt-1">
                      {formatCurrency(messenger.cashCollected + messenger.sinpeCollected + messenger.tarjetaCollected)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Detalles expandibles */}
              {expandedMessenger === messenger.messengerId && (
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <h4 className="font-semibold mb-4">Resumen Financiero</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-sm text-muted-foreground">Efectivo</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(messenger.cashCollected)}</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-sm text-muted-foreground">SINPE</p>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(messenger.sinpeCollected)}</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <p className="text-sm text-muted-foreground">Tarjeta</p>
                        <p className="text-lg font-bold text-purple-600">{formatCurrency(messenger.tarjetaCollected)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Filtros y búsqueda para los pedidos del mensajero */}
                  <div className="mb-4 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Pedidos de {messenger.messengerName}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {messenger.messengerName} • {selectedDate}
                      </p>
                    </div>

                    {/* Barra de búsqueda */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por ID, cliente o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Filtros de estado */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                        className="text-xs"
                      >
                        <Package className="w-3 h-3 mr-1" />
                        Todos ({messenger.orders.length})
                      </Button>
                      <Button
                        variant={statusFilter === 'en_ruta' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('en_ruta')}
                        className="text-xs"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        En Ruta ({messenger.orders.filter(o => o.estado_pedido?.toUpperCase() === 'EN_RUTA').length})
                      </Button>
                      <Button
                        variant={statusFilter === 'entregado' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('entregado')}
                        className="text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completados ({messenger.entregadoOrders})
                      </Button>
                      <Button
                        variant={statusFilter === 'reagendado' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('reagendado')}
                        className="text-xs"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Reagendados ({messenger.reagendadoOrders})
                      </Button>
                      <Button
                        variant={statusFilter === 'devolucion' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('devolucion')}
                        className="text-xs"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Devoluciones ({messenger.devolucionOrders})
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                      Mostrando {getFilteredOrders(messenger.orders).length} de {messenger.orders.length} pedidos
                    </div>
                  </div>

                  {/* Tabla de pedidos con el mismo diseño que mi-ruta-hoy */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-1 text-xs text-gray-500 text-center">
                      💡 Haz clic en cualquier fila para fijar la columna ID y verla siempre visible
                    </div>
                    <Table className="min-w-[1000px] text-[10px]">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 h-4">
                          <TableHead className="min-w-[100px] px-1 py-0.5">
                            <div className="flex items-center gap-0.5">
                              <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                              <span className="font-bold text-gray-800 text-[10px]">ID y Cliente</span>
                            </div>
                          </TableHead>
                          <TableHead className="min-w-[80px] px-1 py-0.5 font-bold text-gray-800 text-[10px]">Contacto</TableHead>
                          <TableHead className="min-w-[150px] px-1 py-0.5 font-bold text-gray-800 text-[10px]">Dirección</TableHead>
                          <TableHead className="min-w-[120px] px-1 py-0.5 font-bold text-gray-800 text-[10px]">Productos</TableHead>
                          <TableHead className="min-w-[60px] px-1 py-0.5 font-bold text-gray-800 text-[10px]">Fecha Creación</TableHead>
                          <TableHead className="min-w-[60px] px-1 py-0.5 font-bold text-gray-800 text-[10px]">Fecha Entrega</TableHead>
                          <TableHead className="min-w-[60px] px-1 py-0.5 font-bold text-gray-800 text-[10px]">Pago</TableHead>
                          <TableHead className="min-w-[60px] px-1 py-0.5 font-bold text-gray-800 text-[10px]">Estado</TableHead>
                          <TableHead className="min-w-[80px] px-1 py-0.5 font-bold text-gray-800 text-[10px]">Notas Asesor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredOrders(messenger.orders).map((order, index) => (
                          <TableRow 
                            key={order.idx} 
                            className={`hover:bg-gray-50 ${getStatusRowColor(order.estado_pedido)} cursor-pointer transition-all duration-200 h-5 ${
                              selectedRowId === order.id_pedido 
                                ? 'ring-1 ring-blue-500 ring-opacity-50 bg-blue-50/20 shadow-sm' 
                                : ''
                            }`}
                            onClick={() => setSelectedRowId(selectedRowId === order.id_pedido ? null : order.id_pedido)}
                          >
                            <TableCell className={`font-medium px-1 py-0.5 ${
                              selectedRowId === order.id_pedido 
                                ? `sticky left-0 z-30 border-r border-gray-300 ${getStatusStickyStyle(order.estado_pedido)}` 
                                : ''
                            }`}>
                              <div className="flex items-center gap-0.5">
                                <div className={`w-1 h-1 rounded-full ${getStatusIndicatorColor(order.estado_pedido)} shadow-sm border border-white ${
                                  selectedRowId === order.id_pedido ? 'ring-1 ring-white ring-opacity-50' : ''
                                }`} />
                                <div className="flex flex-col space-y-0">
                                  <span className="font-mono text-[10px] font-bold text-gray-900">{order.id_pedido}</span>
                                  <span className="text-[9px] text-gray-500 font-medium">Pedido</span>
                                  <div className="font-medium text-gray-800 text-[9px]">{order.cliente_nombre}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-1 py-0.5">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[9px] font-medium text-gray-700">{order.cliente_telefono}</span>
                                  {order.cliente_telefono && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(order.cliente_telefono!, 'Número de teléfono')}
                                      className="h-3 w-3 p-0 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                                      title="Copiar número de teléfono"
                                    >
                                      <Clipboard className="w-1.5 h-1.5" />
                                    </Button>
                                  )}
                                </div>

                                {/* Botones de contacto */}
                                <div className="flex gap-0.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => order.cliente_telefono && window.open(`tel:${order.cliente_telefono}`)}
                                    className="h-3 px-1 text-[8px] bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                                    disabled={!order.cliente_telefono}
                                    title="Llamar"
                                  >
                                    <Phone className="w-1.5 h-1.5 mr-0.5" />
                                    Llamar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (order.cliente_telefono) {
                                        const messengerName = messenger.messengerName;
                                        const tiendaName = order.tienda || 'ALL STARS';
                                        const products = order.productos || 'Productos no especificados';
                                        
                                        const message = `Buen día *${order.cliente_nombre}* 📍 Soy el mensajero que va entregar tu pedido de *${products}* de la tienda *${tiendaName}* Y me dirijo a la dirección *${order.direccion}* en *${order.canton}* en el distrito *${order.distrito}* en la provincia *${order.provincia}* 📍. Por favor confirmame que te encuentras ahí.`;

                                        // Limpiar el número de teléfono para WhatsApp
                                        let cleanPhone = order.cliente_telefono;
                                        cleanPhone = cleanPhone.replace(/^(\+506|506)/, '');
                                        const whatsappPhone = `506${cleanPhone}`;
                                        const encodedMessage = encodeURIComponent(message);
                                        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
                                        window.open(whatsappUrl);
                                      }
                                    }}
                                    className="h-3 px-1 text-[8px] bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700"
                                    disabled={!order.cliente_telefono}
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-1.5 h-1.5 mr-0.5" />
                                    WhatsApp
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-1 py-0.5">
                              <div className="space-y-0.5">
                                {/* Dirección principal */}
                                <div className="space-y-0">
                                  <div className="text-[9px] font-medium text-gray-900">
                                    {order.direccion || 'Dirección no especificada'}
                                  </div>
                                  <div className="text-[8px] text-gray-600">
                                    <span className="font-medium">Prov:</span> {order.provincia || 'No especificada'}
                                  </div>
                                  <div className="text-[8px] text-gray-600">
                                    <span className="font-medium">Cantón:</span> {order.canton || 'No especificado'}
                                  </div>
                                  <div className="text-[8px] text-gray-600">
                                    <span className="font-medium">Dist:</span> {order.distrito || 'No especificado'}
                                  </div>
                                </div>
                                
                                {/* Botón de Maps */}
                                {order.link_ubicacion && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (order.link_ubicacion) {
                                        window.open(order.link_ubicacion, '_blank');
                                      }
                                    }}
                                    className="h-3 px-1 text-[8px] bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                                    title="Abrir en Maps"
                                  >
                                    <Navigation className="w-1.5 h-1.5 mr-0.5" />
                                    Maps
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-1 py-0.5">
                              <div className="max-w-[120px] space-y-0.5">
                                {/* Tienda */}
                                <div className="flex items-center gap-0.5">
                                  <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                                  <span className="text-[8px] font-bold text-purple-700 bg-purple-100 px-0.5 py-0 rounded border border-purple-200">
                                    {order.tienda || 'ALL STARS'}
                                  </span>
                                </div>
                                {/* Productos */}
                                <div className="text-[8px] text-gray-700 leading-tight" title={order.productos || 'No especificados'}>
                                  {order.productos || 'No especificados'}
                                </div>
                                {/* Monto */}
                                <div className="flex items-center gap-0.5">
                                  <div className="w-1 h-1 rounded-full bg-green-500"></div>
                                  <span className="text-[8px] font-bold text-green-700">
                                    {formatCurrency(order.valor_total)}
                                  </span>
                                </div>
                                {/* Número SINPE */}
                                {order.numero_sinpe && (
                                  <div className="flex items-center gap-0.5">
                                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                    <span className="text-[8px] text-blue-700 font-mono bg-blue-50 px-0.5 py-0 rounded border border-blue-200">
                                      SINPE: {order.numero_sinpe}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(order.numero_sinpe!, 'Número SINPE')}
                                      className="h-3 w-3 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                                      title="Copiar número SINPE"
                                    >
                                      <Clipboard className="w-1.5 h-1.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-1 py-0.5">
                              <div className="space-y-0">
                                <div className="text-[8px] text-gray-500 font-medium">Creación</div>
                                <div className="text-[8px] font-semibold text-gray-800">
                                  {order.fecha_creacion ? (() => {
                                    if (order.fecha_creacion.includes('T')) {
                                      const datePart = order.fecha_creacion.split('T')[0];
                                      const parts = datePart.split('-');
                                      if (parts.length === 3) {
                                        const year = parts[0];
                                        const month = parts[1];
                                        const day = parts[2];
                                        return `${day}/${month}/${year}`;
                                      }
                                    }
                                    return new Date(order.fecha_creacion).toLocaleDateString('es-CR', {
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric'
                                    });
                                  })() : 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-1 py-0.5">
                              <div className="space-y-0">
                                <div className="text-[8px] text-gray-500 font-medium">Entrega</div>
                                <div className="text-[8px] font-semibold text-gray-800">
                                  {order.fecha_entrega ? (() => {
                                    if (order.fecha_entrega.includes('T')) {
                                      const datePart = order.fecha_entrega.split('T')[0];
                                      const parts = datePart.split('-');
                                      if (parts.length === 3) {
                                        const year = parts[0];
                                        const month = parts[1];
                                        const day = parts[2];
                                        return `${day}/${month}/${year}`;
                                      }
                                    }
                                    return new Date(order.fecha_entrega).toLocaleDateString('es-CR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    });
                                  })() : 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-1 py-0.5">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-0.5">
                                  {order.metodo_pago?.toLowerCase() === 'efectivo' && <Banknote className="w-3 h-3 text-green-600" />}
                                  {order.metodo_pago?.toLowerCase() === 'sinpe' && <Smartphone className="w-3 h-3 text-blue-600" />}
                                  {order.metodo_pago?.toLowerCase() === 'tarjeta' && <CreditCard className="w-3 h-3 text-purple-600" />}
                                  <span className="text-[8px] font-medium text-gray-700">
                                    {order.metodo_pago || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-1 py-0.5">
                              {getStatusBadge(order.estado_pedido)}
                            </TableCell>
                            <TableCell className="px-1 py-0.5">
                              <div className="text-[8px] text-gray-600 max-w-[80px] truncate" title={order.nota_asesor || ''}>
                                {order.nota_asesor || 'Sin notas'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

