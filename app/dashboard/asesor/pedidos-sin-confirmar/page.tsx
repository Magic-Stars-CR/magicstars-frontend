'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Search, Package, Clock, CheckCircle, AlertCircle, Edit, Save, X } from 'lucide-react';
import { 
  getAllPedidosByTiendaPreconfirmacion, 
  getPedidosCountByTiendaPreconfirmacion,
  getTotalPedidosPreconfirmacionCount,
  updatePedidoPreconfirmacion 
} from '@/lib/supabase-pedidos';
import { Order } from '@/lib/types';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

// Función para obtener la tienda del asesor (igual que en dashboard)
const getAsesorTienda = (email: string): string => {
  const emailLower = email.toLowerCase();
  if (emailLower.includes('allstars') || emailLower.includes('all_stars')) {
    return 'ALL STARS';
  }
  return 'ALL STARS'; // Por defecto
};

// Función helper para obtener la fecha actual en zona horaria de Costa Rica
const getCostaRicaDate = () => {
  const now = new Date();
  const costaRicaOffset = -6 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const costaRicaTime = new Date(utc + (costaRicaOffset * 60000));
  return costaRicaTime;
};

// Función helper para obtener la fecha ISO en zona horaria de Costa Rica
const getCostaRicaDateISO = () => {
  const costaRicaDate = getCostaRicaDate();
  const year = costaRicaDate.getFullYear();
  const month = String(costaRicaDate.getMonth() + 1).padStart(2, '0');
  const day = String(costaRicaDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PedidosSinConfirmarPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessenger, setSelectedMessenger] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [recordsPerPage] = useState(20);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>('');
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<string>('');
  const [editingConfirmado, setEditingConfirmado] = useState<boolean>(false);
  
  // Estados para editar todos los campos
  const [editingCustomerName, setEditingCustomerName] = useState<string>('');
  const [editingCustomerPhone, setEditingCustomerPhone] = useState<string>('');
  const [editingCustomerAddress, setEditingCustomerAddress] = useState<string>('');
  const [editingProvince, setEditingProvince] = useState<string>('');
  const [editingCanton, setEditingCanton] = useState<string>('');
  const [editingDistrict, setEditingDistrict] = useState<string>('');
  const [editingProductos, setEditingProductos] = useState<string>('');
  const [editingPrice, setEditingPrice] = useState<number>(0);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [asesorTienda, setAsesorTienda] = useState<string>('ALL STARS');
  
  // Estados para filtros de fecha (igual que en dashboard)
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({from: undefined, to: undefined});
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Estado para filtro de tipo de carrito
  const [cartTypeFilter, setCartTypeFilter] = useState<string>('all'); // 'all', 'abandonados', 'finalizados'

  // Función para cargar datos (igual que en dashboard)
  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Determinar la tienda del asesor (igual que en dashboard)
      const tienda = getAsesorTienda(user.email);
      setAsesorTienda(tienda);
      console.log('🏪 Tienda del asesor:', tienda);
      
      // Obtener todos los pedidos de la tienda (igual que en dashboard)
      console.log('🔍 Buscando pedidos para tienda:', tienda);
      const ordersRes = await getAllPedidosByTiendaPreconfirmacion(tienda);
      
      console.log('✅ Pedidos obtenidos de Supabase:', ordersRes.length);
      console.log('📋 Primeros pedidos:', ordersRes.slice(0, 3));
      
      // Mapear los datos al formato Order (igual que en dashboard)
      const ordersWithStoreAndMessenger = ordersRes.map((pedido, index) => ({
        id: pedido.id_pedido,
        customerName: pedido.cliente_nombre,
        customerPhone: pedido.cliente_telefono,
        customerAddress: pedido.direccion,
        customerProvince: pedido.provincia,
        customerCanton: pedido.canton,
        customerDistrict: pedido.distrito,
        totalAmount: pedido.valor_total,
        productos: pedido.productos,
        items: [],
        status: pedido.estado_pedido as any || 'pendiente',
        paymentMethod: pedido.metodo_pago as any || 'efectivo',
        origin: 'shopify' as any,
        deliveryMethod: 'mensajeria_propia' as any,
        createdAt: pedido.fecha_creacion,
        updatedAt: pedido.fecha_creacion,
        fecha_creacion: pedido.fecha_creacion,
        scheduledDate: pedido.fecha_entrega || undefined,
        deliveryDate: pedido.fecha_entrega || undefined,
        customerLocationLink: pedido.link_ubicacion || undefined,
        notes: pedido.notas || undefined,
        asesorNotes: pedido.nota_asesor || undefined,
        numero_sinpe: pedido.numero_sinpe || undefined,
        confirmado: pedido.confirmado !== undefined ? pedido.confirmado : false,
        assignedMessengerId: pedido.mensajero_asignado || undefined,
        assignedMessenger: pedido.mensajero_asignado ? {
          id: pedido.mensajero_asignado,
          name: pedido.mensajero_asignado,
          phone: undefined
        } : undefined,
        concretedMessengerId: pedido.mensajero_concretado || undefined,
        concretedMessenger: pedido.mensajero_concretado ? {
          id: pedido.mensajero_concretado,
          name: pedido.mensajero_concretado,
          phone: undefined
        } : undefined,
        store: tienda,
        jornadaRuta: pedido.jornada_ruta || undefined,
      }));

      // Establecer los pedidos (igual que en dashboard)
      setOrders(ordersWithStoreAndMessenger);
      setTotalRecords(ordersWithStoreAndMessenger.length);
      
      console.log(`✅ Todos los pedidos cargados: ${ordersWithStoreAndMessenger.length}`);
      console.log(`📊 Pedidos abandonados (#): ${ordersWithStoreAndMessenger.filter(o => o.id.startsWith('#')).length}`);
      console.log(`📊 Pedidos finalizados (A-Z): ${ordersWithStoreAndMessenger.filter(o => /^[A-Z]/.test(o.id)).length}`);
      
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Filtrar pedidos (igual que en dashboard)
  useEffect(() => {
    console.log('🔄 Filtrando pedidos...', { 
      totalOrders: orders.length, 
      searchTerm, 
      selectedMessenger,
      cartTypeFilter
    });
    
    let filtered = orders;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone?.includes(searchTerm) ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 Después de filtrar por búsqueda:', filtered.length);
    }

    // Filtrar por mensajero
    if (selectedMessenger !== 'all') {
      filtered = filtered.filter(order => {
        if (selectedMessenger === 'sin_asignar') {
          return !order.assignedMessengerId;
        }
        return order.assignedMessengerId === selectedMessenger;
      });
      console.log('🔍 Después de filtrar por mensajero:', filtered.length);
    }

    // Filtrar por tipo de carrito
    if (cartTypeFilter !== 'all') {
      filtered = filtered.filter(order => {
        if (cartTypeFilter === 'abandonados') {
          return order.id.startsWith('#');
        } else if (cartTypeFilter === 'finalizados') {
          return /^[A-Z]/.test(order.id);
        }
        return true;
      });
      console.log('🔍 Después de filtrar por tipo de carrito:', filtered.length);
    }

    console.log('✅ Pedidos filtrados finales:', filtered.length);
    setFilteredOrders(filtered);
    setFilteredRecords(filtered.length);
    setCurrentPage(1);
  }, [orders, searchTerm, selectedMessenger, cartTypeFilter]);

  // Obtener mensajeros únicos
  const uniqueMessengers = Array.from(
    new Set(
      orders
        .map(order => order.assignedMessengerId)
        .filter((m): m is string => typeof m === 'string' && m.length > 0)
    )
  );

  // Calcular paginación
  const totalPages = Math.ceil(filteredRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  console.log('📄 Paginación:', {
    filteredRecords,
    recordsPerPage,
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    currentOrdersLength: currentOrders.length
  });

  // Función para manejar la edición
  const handleEdit = (order: Order) => {
    setEditingOrder(order.id);
    setEditingStatus(order.status);
    setEditingPaymentMethod(order.paymentMethod);
    setEditingConfirmado(order.confirmado || false);
    setEditingCustomerName(order.customerName || '');
    setEditingCustomerPhone(order.customerPhone || '');
    setEditingCustomerAddress(order.customerAddress || '');
    setEditingProvince(order.customerProvince || '');
    setEditingCanton(order.customerCanton || '');
    setEditingDistrict(order.customerDistrict || '');
    setEditingProductos(order.productos || '');
    setEditingPrice(order.totalAmount || 0);
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditingStatus('');
    setEditingPaymentMethod('');
    setEditingConfirmado(false);
    setEditingCustomerName('');
    setEditingCustomerPhone('');
    setEditingCustomerAddress('');
    setEditingProvince('');
    setEditingCanton('');
    setEditingDistrict('');
    setEditingProductos('');
    setEditingPrice(0);
  };

  // Función para guardar cambios
  const handleSaveEdit = async () => {
    if (!editingOrder) return;

    try {
      setIsUpdating(true);
      
      const orderToUpdate = orders.find(o => o.id === editingOrder);
      if (!orderToUpdate) return;

      await updatePedidoPreconfirmacion(editingOrder, {
        estado_pedido: editingStatus,
        metodo_pago: editingPaymentMethod,
        confirmado: editingConfirmado,
      });

      // Actualizar el estado local
      setOrders(prev => prev.map(order => 
        order.id === editingOrder 
          ? { 
              ...order, 
              status: editingStatus as any,
              paymentMethod: editingPaymentMethod as any,
              confirmado: editingConfirmado,
              customerName: editingCustomerName,
              customerPhone: editingCustomerPhone,
              customerAddress: editingCustomerAddress,
              customerProvince: editingProvince,
              customerCanton: editingCanton,
              customerDistrict: editingDistrict,
              productos: editingProductos,
              totalAmount: editingPrice
            }
          : order
      ));

      toast.success('Pedido actualizado correctamente');
      handleCancelEdit();
    } catch (error) {
      console.error('❌ Error al actualizar pedido:', error);
      toast.error('Error al actualizar el pedido');
    } finally {
      setIsUpdating(false);
    }
  };

  // Función para verificar si un pedido está siendo editado
  const isOrderBeingEdited = (orderId: string) => editingOrder === orderId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carritos Abandonados y Finalizados</h1>
          <p className="text-gray-600">Gestiona carritos abandonados (#) y finalizados (letra mayúscula)</p>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carritos Abandonados</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-800">
              {filteredOrders.filter(o => o.id.startsWith('#')).length}
            </p>
            <p className="text-xs text-muted-foreground">
              Pedidos que empiezan con #
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carritos Finalizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-800">
              {filteredOrders.filter(o => /^[A-Z]/.test(o.id)).length}
            </p>
            <p className="text-xs text-muted-foreground">
              Pedidos que empiezan con letra mayúscula
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros por período */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Período</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('all');
                  setSelectedDate(undefined);
                  setSelectedDateRange({from: undefined, to: undefined});
                  setSelectedMonth('');
                }}
                className={`${dateFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
              >
                Todos
              </Button>
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('today');
                  setSelectedDate(undefined);
                  setSelectedDateRange({from: undefined, to: undefined});
                  setSelectedMonth('');
                }}
                className={`${dateFilter === 'today' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              >
                Hoy
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('yesterday');
                  setSelectedDate(undefined);
                  setSelectedDateRange({from: undefined, to: undefined});
                  setSelectedMonth('');
                }}
                className={`${dateFilter === 'yesterday' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
              >
                Ayer
              </Button>
              <Button
                variant={dateFilter === 'thisWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('thisWeek');
                  setSelectedDate(undefined);
                  setSelectedDateRange({from: undefined, to: undefined});
                  setSelectedMonth('');
                }}
                className={`${dateFilter === 'thisWeek' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
              >
                Esta Semana
              </Button>
            </div>
          </div>

          {/* Filtros por tipo de carrito */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Tipo de Carrito</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={cartTypeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCartTypeFilter('all')}
                className={`${cartTypeFilter === 'all' ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''}`}
              >
                Todos
              </Button>
              <Button
                variant={cartTypeFilter === 'abandonados' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCartTypeFilter('abandonados')}
                className={`${cartTypeFilter === 'abandonados' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
              >
                🛒 Abandonados
              </Button>
              <Button
                variant={cartTypeFilter === 'finalizados' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCartTypeFilter('finalizados')}
                className={`${cartTypeFilter === 'finalizados' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
              >
                ✅ Finalizados
              </Button>
            </div>
          </div>

          {/* Filtros por fecha específica */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fecha específica */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Fecha Específica</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !selectedDate && "text-muted-foreground"
                    }`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      selectedDate.toLocaleDateString('es-CR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setDateFilter('custom');
                      setSelectedDateRange({from: undefined, to: undefined});
                      setSelectedMonth('');
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Rango de fechas */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Rango de Fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !selectedDateRange.from && "text-muted-foreground"
                    }`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDateRange.from ? (
                      selectedDateRange.to ? (
                        `${selectedDateRange.from.toLocaleDateString('es-CR')} - ${selectedDateRange.to.toLocaleDateString('es-CR')}`
                      ) : (
                        `Desde ${selectedDateRange.from.toLocaleDateString('es-CR')}`
                      )
                    ) : (
                      <span>Seleccionar rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    defaultMonth={selectedDateRange.from}
                    selected={selectedDateRange as DateRange}
                    onSelect={(range) => {
                      setSelectedDateRange(range || {from: undefined, to: undefined});
                      setDateFilter('custom');
                      setSelectedDate(undefined);
                      setSelectedMonth('');
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Búsqueda */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, teléfono o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Filtro por mensajero */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Mensajero</Label>
            <Select value={selectedMessenger} onValueChange={setSelectedMessenger}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mensajero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                {uniqueMessengers.map(messenger => (
                  <SelectItem key={messenger} value={messenger}>
                    {messenger}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pedidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Carritos Abandonados y Finalizados ({filteredRecords} de {totalRecords})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-gray-800 min-w-[120px] px-2 py-2 text-xs">Cliente</TableHead>
                  <TableHead className="font-bold text-gray-800 min-w-[100px] px-2 py-2 text-xs">Teléfono</TableHead>
                  <TableHead className="font-bold text-gray-800 min-w-[150px] px-2 py-2 text-xs">Dirección</TableHead>
                  <TableHead className="font-bold text-gray-800 min-w-[100px] px-2 py-2 text-xs">Monto</TableHead>
                  <TableHead className="font-bold text-gray-800 min-w-[100px] px-2 py-2 text-xs">Método de Pago</TableHead>
                  <TableHead className="font-bold text-gray-800 min-w-[100px] px-2 py-2 text-xs">Tipo</TableHead>
                  <TableHead className="font-bold text-gray-800 min-w-[100px] px-2 py-2 text-xs">Mensajero</TableHead>
                  <TableHead className="font-bold text-gray-800 min-w-[100px] px-2 py-2 text-xs">Fecha</TableHead>
                  <TableHead className="font-bold text-gray-800 min-w-[100px] px-2 py-2 text-xs">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {orders.length === 0 ? 'No hay pedidos disponibles' : 'No hay pedidos que coincidan con los filtros'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    {/* Cliente */}
                    <TableCell className="px-2 py-1">
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {order.id}
                        </div>
                      </div>
                    </TableCell>

                    {/* Teléfono */}
                    <TableCell className="px-2 py-1">
                      <div className="text-sm text-gray-700">
                        {order.customerPhone}
                      </div>
                    </TableCell>

                    {/* Dirección */}
                    <TableCell className="px-2 py-1">
                      <div className="text-sm text-gray-700 max-w-[150px] truncate">
                        {order.customerAddress}
                      </div>
                    </TableCell>

                    {/* Monto */}
                    <TableCell className="px-2 py-1">
                      <div className="text-sm font-semibold text-gray-900">
                        ₡{order.totalAmount.toLocaleString()}
                      </div>
                    </TableCell>

                    {/* Método de Pago */}
                    <TableCell className="px-2 py-1">
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            order.paymentMethod === 'efectivo' ? 'bg-green-50 text-green-700 border-green-200' :
                            order.paymentMethod === 'sinpe' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.paymentMethod === 'tarjeta' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-orange-50 text-orange-700 border-orange-200'
                          }`}
                        >
                          {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Tipo de Carrito */}
                    <TableCell className="px-2 py-1">
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            order.id.startsWith('#') ? 'bg-red-50 text-red-700 border-red-200' :
                            /^[A-Z]/.test(order.id) ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {order.id.startsWith('#') ? '🛒 Abandonado' :
                           /^[A-Z]/.test(order.id) ? '⏳ Sin Confirmar' :
                           '❓ Otro'}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Mensajero */}
                    <TableCell className="px-2 py-1">
                      <div className="text-sm text-gray-700">
                        {order.assignedMessengerId ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {order.assignedMessengerId}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Sin asignar
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Fecha */}
                    <TableCell className="px-2 py-1">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Calendar className="w-3 h-3" />
                        {order.fecha_creacion ? 
                          new Date(order.fecha_creacion).toLocaleDateString('es-CR') : 
                          'Sin fecha'
                        }
                      </div>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="px-2 py-1">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(order)}
                          className="text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredRecords)} de {filteredRecords} pedidos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 py-1 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={!!editingOrder} onOpenChange={handleCancelEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Información del Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Cliente</Label>
                <Input
                  value={editingCustomerName}
                  onChange={(e) => setEditingCustomerName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={editingCustomerPhone}
                  onChange={(e) => setEditingCustomerPhone(e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Textarea
                value={editingCustomerAddress}
                onChange={(e) => setEditingCustomerAddress(e.target.value)}
                placeholder="Dirección completa"
                rows={2}
              />
            </div>

            {/* Provincia, Cantón, Distrito */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Provincia</Label>
                <Input
                  value={editingProvince}
                  onChange={(e) => setEditingProvince(e.target.value)}
                  placeholder="Provincia"
                />
              </div>

              <div className="space-y-2">
                <Label>Cantón</Label>
                <Input
                  value={editingCanton}
                  onChange={(e) => setEditingCanton(e.target.value)}
                  placeholder="Cantón"
                />
              </div>

              <div className="space-y-2">
                <Label>Distrito</Label>
                <Input
                  value={editingDistrict}
                  onChange={(e) => setEditingDistrict(e.target.value)}
                  placeholder="Distrito"
                />
              </div>
            </div>

            {/* Productos y Precio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Productos</Label>
                <Textarea
                  value={editingProductos}
                  onChange={(e) => setEditingProductos(e.target.value)}
                  placeholder="Productos del pedido"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={editingPrice}
                  onChange={(e) => setEditingPrice(Number(e.target.value))}
                  placeholder="Precio total"
                />
              </div>
            </div>

            {/* Estado, Método de Pago y Confirmación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={editingStatus} onValueChange={setEditingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="en_ruta">En Ruta</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="devolucion">Devolución</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={editingPaymentMethod} onValueChange={setEditingPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="sinpe">SINPE</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="2pagos">2 Pagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Confirmación</Label>
                <Select 
                  value={editingConfirmado ? 'true' : 'false'} 
                  onValueChange={(value) => setEditingConfirmado(value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Sin Confirmar</SelectItem>
                    <SelectItem value="true">Confirmado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
