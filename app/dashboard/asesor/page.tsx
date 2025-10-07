'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { mockApi } from '@/lib/mock-api';
import { getPedidosDelDiaByTienda, getPedidosCountByTienda, getTotalPedidosCount, getPedidosByDateRange, getPedidosByMonth, getAllPedidosByTienda } from '@/lib/supabase-pedidos';
import { Order, Stats } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { mockMessengers } from '@/lib/mock-messengers';
import { 
  Plus,
  Upload,
  Download,
  Loader2,
  Package,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  Truck,
  Search,
  Filter,
  MapPin,
  Phone,
  User,
  Calendar,
  FileText,
  Edit3,
  MessageSquare,
  X,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Edit,
  Save,
  Trash2,
  CheckSquare,
  Square,
  MoreHorizontal,
  Copy,
  Clipboard
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';

// Interfaces para datos de gráficos
interface PaymentMethodData {
  name: string;
  value: number;
  amount: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

export default function AsesorDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [asesorTienda, setAsesorTienda] = useState<string>('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  // Filtros de fecha y mensajero
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined});
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedMessenger, setSelectedMessenger] = useState<string>('all');
  
  // Conteos de registros
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [filteredRecords, setFilteredRecords] = useState<number>(0);
  
  // Estados para edición masiva
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [editingOrders, setEditingOrders] = useState<Map<string, Partial<Order>>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<string>('');
  const [bulkEditValue, setBulkEditValue] = useState<string>('');
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  // Obtener mensajeros del mock-messengers
  const availableMessengers = mockMessengers.filter(user => user.role === 'mensajero');

  // Asesores de Beauty Fan y All Stars
  const asesores = [
    { id: '1', name: 'Ana García', store: 'BEAUTY FAN', email: 'ana@beautyfan.com' },
    { id: '2', name: 'Carlos López', store: 'BEAUTY FAN', email: 'carlos@beautyfan.com' },
    { id: '3', name: 'María Rodríguez', store: 'ALL STARS', email: 'maria@allstars.com' },
    { id: '4', name: 'José Martínez', store: 'ALL STARS', email: 'jose@allstars.com' },
    { id: '5', name: 'Laura Sánchez', store: 'BEAUTY FAN', email: 'laura@beautyfan.com' },
    { id: '6', name: 'Roberto Vega', store: 'ALL STARS', email: 'roberto@allstars.com' },
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateFilter, selectedDate, selectedDateRange, selectedMonth]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, selectedStore, selectedMessenger]);

  // Función para determinar la tienda del asesor basada en su email
  const getAsesorTienda = (email: string): string => {
    if (email.includes('allstars')) return 'ALL STARS';
    if (email.includes('beautyfan')) return 'BEAUTY FAN';
    return 'ALL STARS'; // Default
  };

  // Función helper para obtener la fecha actual en zona horaria de Costa Rica
  const getCostaRicaDate = () => {
    const now = new Date();
    // Costa Rica está en GMT-6 (UTC-6)
    const costaRicaOffset = -6 * 60; // -6 horas en minutos
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
    const isoDate = `${year}-${month}-${day}`;
    return isoDate;
  };

  const loadData = async () => {
    console.log('🔍 Cargando datos para asesor:', user);
    if (!user?.company?.id) {
      console.log('❌ No hay company.id en el usuario');
      return;
    }
    
    try {
      setLoading(true);
      
      // Determinar la tienda del asesor
      const asesorTienda = getAsesorTienda(user.email);
      setAsesorTienda(asesorTienda);
      console.log('🏪 Tienda del asesor:', asesorTienda);
      
      // Determinar la fecha objetivo basada en el filtro activo
      let targetDateISO: string | null = null;
      
      if (selectedDate) {
        // Si hay una fecha específica seleccionada, usar esa
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        targetDateISO = `${year}-${month}-${day}`;
        console.log('📅 Usando selectedDate:', targetDateISO);
      } else if (selectedDateRange.from && selectedDateRange.to) {
        // Si hay un rango de fechas seleccionado, usar el rango
        targetDateISO = null; // Se manejará en la consulta
        console.log('📅 Usando rango de fechas:', selectedDateRange);
      } else if (selectedMonth) {
        // Si hay un mes seleccionado, usar ese mes
        targetDateISO = null; // Se manejará en la consulta
        console.log('📅 Usando mes seleccionado:', selectedMonth);
      } else {
        // Usar el filtro de período por defecto con zona horaria de Costa Rica
        const costaRicaNow = getCostaRicaDate();
        switch (dateFilter) {
          case 'today':
            targetDateISO = getCostaRicaDateISO();
            console.log('📅 Filtro TODAY (Costa Rica):', targetDateISO);
            break;
          case 'yesterday':
            const yesterday = new Date(costaRicaNow);
            yesterday.setDate(yesterday.getDate() - 1);
            targetDateISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            console.log('📅 Filtro YESTERDAY (Costa Rica):', targetDateISO);
            break;
          case 'thisWeek':
            targetDateISO = getCostaRicaDateISO();
            console.log('📅 Filtro THIS WEEK (Costa Rica):', targetDateISO);
            break;
          case 'thisMonth':
            targetDateISO = getCostaRicaDateISO();
            console.log('📅 Filtro THIS MONTH (Costa Rica):', targetDateISO);
            break;
          case 'all':
          default:
            targetDateISO = null; // Mostrar todos los pedidos
            console.log('📅 Filtro ALL - Mostrando todos los pedidos');
            break;
        }
      }

      // Obtener conteos de registros
      console.log('🔢 Obteniendo conteos de registros...');
      const [totalCount, filteredCount] = await Promise.all([
        getTotalPedidosCount(),
        getPedidosCountByTienda(asesorTienda, targetDateISO || undefined)
      ]);
      
      setTotalRecords(totalCount);
      setFilteredRecords(filteredCount);
      
      console.log(`📊 Total de registros en BD: ${totalCount}`);
      console.log(`📊 Registros filtrados (${asesorTienda}, ${targetDateISO}): ${filteredCount}`);

      // Obtener pedidos de Supabase filtrados por tienda y fecha
      console.log('🔍 Buscando pedidos para tienda:', asesorTienda, 'fecha:', targetDateISO);
      let ordersRes;
      
      if (targetDateISO) {
        // Filtro por fecha específica
        ordersRes = await getPedidosDelDiaByTienda(asesorTienda, targetDateISO);
      } else if (selectedDateRange.from && selectedDateRange.to) {
        // Filtro por rango de fechas
        ordersRes = await getPedidosByDateRange(asesorTienda, selectedDateRange.from, selectedDateRange.to);
      } else if (selectedMonth) {
        // Filtro por mes
        ordersRes = await getPedidosByMonth(asesorTienda, selectedMonth);
      } else {
        // Mostrar todos los pedidos
        ordersRes = await getAllPedidosByTienda(asesorTienda);
      }
      
      console.log('✅ Pedidos obtenidos de Supabase:', ordersRes.length);
      console.log('📋 Primeros pedidos:', ordersRes.slice(0, 3));
      
      // Obtener estadísticas mock
      const statsRes = await mockApi.getStats({ userCompanyId: user.company.id });
      
      console.log('✅ Datos obtenidos:', { orders: ordersRes.length, stats: statsRes });
      
      // Asignar mensajeros y asesor a los pedidos
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
        status: pedido.estado_pedido as any || 'pendiente',
        paymentMethod: pedido.metodo_pago as any || 'efectivo',
        origin: 'shopify' as any,
        deliveryMethod: 'mensajeria_propia' as any,
        createdAt: pedido.fecha_creacion,
        updatedAt: pedido.fecha_creacion,
        scheduledDate: pedido.fecha_entrega || undefined,
        deliveryDate: pedido.fecha_entrega || undefined,
        customerLocationLink: pedido.link_ubicacion || undefined,
        notes: pedido.notas || undefined,
        asesorNotes: pedido.nota_asesor || undefined,
        numero_sinpe: pedido.numero_sinpe || undefined,
        tienda: asesorTienda,
        assignedMessenger: availableMessengers[index % availableMessengers.length],
        asesor: asesores.find(a => a.store === asesorTienda) || asesores[0],
        items: [], // Array vacío para compatibilidad con Order interface
      }));

      // Ordenar por ubicación (provincia, cantón, distrito) y estado
      const sortedOrders = ordersWithStoreAndMessenger.sort((a, b) => {
        // Función helper para normalizar texto
        const normalizeText = (text: string) => {
          return text
            .toLowerCase()
            .trim()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n');
        };
        
        // Primero por provincia
        const provinciaA = normalizeText(a.customerProvince || 'zzz sin provincia');
        const provinciaB = normalizeText(b.customerProvince || 'zzz sin provincia');
        const provinciaCompare = provinciaA.localeCompare(provinciaB, 'es-CR');
        
        if (provinciaCompare !== 0) {
          return provinciaCompare;
        }
        
        // Luego por cantón
        const cantonA = normalizeText(a.customerCanton || 'zzz sin canton');
        const cantonB = normalizeText(b.customerCanton || 'zzz sin canton');
        const cantonCompare = cantonA.localeCompare(cantonB, 'es-CR');
        
        if (cantonCompare !== 0) {
          return cantonCompare;
        }
        
        // Después por distrito
        const distritoA = normalizeText(a.customerDistrict || 'zzz sin distrito');
        const distritoB = normalizeText(b.customerDistrict || 'zzz sin distrito');
        const distritoCompare = distritoA.localeCompare(distritoB, 'es-CR');
        
        if (distritoCompare !== 0) {
          return distritoCompare;
        }
        
        // Finalmente por estado (pendientes primero)
        const statusOrder = { 'pendiente': 0, 'en_ruta': 1, 'entregado': 2, 'reagendado': 3, 'devolucion': 4 };
        const statusA = statusOrder[a.status as keyof typeof statusOrder] || 5;
        const statusB = statusOrder[b.status as keyof typeof statusOrder] || 5;
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // Por último por ID
        return a.id.localeCompare(b.id, 'es-CR');
      });

      setOrders(sortedOrders);
      setStats(statsRes);
      console.log('✅ Datos cargados exitosamente:', { orders: sortedOrders.length, stats: statsRes });
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
      console.log('🏁 Finalizando carga de datos');
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone?.includes(searchTerm) ||
        order.customerAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tienda (solo la tienda del asesor)
    if (selectedStore !== 'all' && asesorTienda) {
      filtered = filtered.filter(order => order.tienda === selectedStore);
    }

    // Filtrar por mensajero
    if (selectedMessenger !== 'all') {
      filtered = filtered.filter(order => 
        order.assignedMessenger?.name?.toLowerCase().includes(selectedMessenger.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
    setFilteredRecords(filtered.length);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusRowColor = (status: string) => {
    switch (status) {
      case 'entregado':
        return 'bg-green-50 border-l-8 border-green-500';
      case 'en_ruta':
        return 'bg-blue-50 border-l-8 border-blue-500';
      case 'devolucion':
        return 'bg-red-50 border-l-8 border-red-500';
      case 'reagendado':
        return 'bg-orange-50 border-l-8 border-orange-500';
      default:
        return 'bg-gray-50 border-l-8 border-gray-500';
    }
  };

  const getStatusIndicatorColor = (status: string) => {
    switch (status) {
      case 'entregado':
        return 'bg-green-500';
      case 'en_ruta':
        return 'bg-blue-500';
      case 'devolucion':
        return 'bg-red-500';
      case 'reagendado':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrderForDetails(order);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedOrderForDetails(null);
    setIsDetailsModalOpen(false);
  };

  const handleAddNote = async () => {
    if (!selectedOrderForDetails || !newNote.trim()) return;
    
    setIsAddingNote(true);
    
    // Simular guardado de nota
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Actualizar el pedido con la nueva nota
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === selectedOrderForDetails.id
          ? { ...order, notes: (order.notes || '') + '\n' + newNote }
          : order
      )
    );
    
    setNewNote('');
    setIsAddingNote(false);
  };

  // Funciones para datos de gráficos
  const getPaymentMethodData = (): PaymentMethodData[] => {
    const completedOrders = filteredOrders.filter(order => order.status === 'entregado');
    const paymentMethods = completedOrders.reduce((acc, order) => {
      const method = order.paymentMethod || 'otro';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(paymentMethods).map(([method, count]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: count,
      amount: completedOrders
        .filter(order => (order.paymentMethod || 'otro') === method)
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    }));
  };

  const getStatusData = (): StatusData[] => {
    const statusCounts = {
      'entregado': filteredOrders.filter(order => order.status === 'entregado').length,
      'reagendado': filteredOrders.filter(order => order.status === 'reagendado').length,
      'devolucion': filteredOrders.filter(order => order.status === 'devolucion').length,
      'en_ruta': filteredOrders.filter(order => order.status === 'en_ruta').length,
      'pendiente': filteredOrders.filter(order => order.status === 'pendiente').length
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count,
      color: getStatusColor(status)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregado': return '#10b981';
      case 'reagendado': return '#f59e0b';
      case 'devolucion': return '#ef4444';
      case 'en_ruta': return '#3b82f6';
      case 'pendiente': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Funciones para edición masiva
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setSelectedOrders(new Set());
      setEditingOrders(new Map());
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const selectAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    }
  };

  const updateOrderField = (orderId: string, field: keyof Order, value: any) => {
    const newEditingOrders = new Map(editingOrders);
    const currentEdit = newEditingOrders.get(orderId) || {};
    newEditingOrders.set(orderId, { ...currentEdit, [field]: value });
    setEditingOrders(newEditingOrders);
  };

  const getOrderValue = (order: Order, field: keyof Order) => {
    const editData = editingOrders.get(order.id);
    return editData?.[field] ?? order[field];
  };

  const saveOrderChanges = async (orderId: string) => {
    const editData = editingOrders.get(orderId);
    if (!editData) return;

    setIsSaving(true);
    try {
      // Simular guardado en backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar el pedido en el estado local
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, ...editData } : order
        )
      );
      
      // Remover de edición
      const newEditingOrders = new Map(editingOrders);
      newEditingOrders.delete(orderId);
      setEditingOrders(newEditingOrders);
      
      console.log('✅ Pedido guardado:', orderId, editData);
    } catch (error) {
      console.error('❌ Error guardando pedido:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      // Simular guardado masivo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actualizar todos los pedidos editados
      setOrders(prevOrders => 
        prevOrders.map(order => {
          const editData = editingOrders.get(order.id);
          return editData ? { ...order, ...editData } : order;
        })
      );
      
      // Limpiar ediciones
      setEditingOrders(new Map());
      setSelectedOrders(new Set());
      
      console.log('✅ Todos los cambios guardados');
    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const applyBulkEdit = () => {
    if (!bulkEditField || !bulkEditValue) return;
    
    const newEditingOrders = new Map(editingOrders);
    
    selectedOrders.forEach(orderId => {
      const currentEdit = newEditingOrders.get(orderId) || {};
      newEditingOrders.set(orderId, { ...currentEdit, [bulkEditField]: bulkEditValue });
    });
    
    setEditingOrders(newEditingOrders);
    setShowBulkEditModal(false);
    setBulkEditField('');
    setBulkEditValue('');
  };

  const cancelEdit = (orderId: string) => {
    const newEditingOrders = new Map(editingOrders);
    newEditingOrders.delete(orderId);
    setEditingOrders(newEditingOrders);
  };

  const isOrderBeingEdited = (orderId: string) => {
    return editingOrders.has(orderId);
  };

  const hasUnsavedChanges = () => {
    return editingOrders.size > 0;
  };

  // Función para copiar al portapapeles
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Mostrar notificación de éxito (puedes usar toast si tienes)
      console.log(`${type} copiado:`, text);
      // Aquí podrías añadir un toast de éxito
    } catch (err) {
      console.error('Error al copiar:', err);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log(`${type} copiado (fallback):`, text);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos del asesor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Dashboard Asesor</h1>
            <p className="opacity-90">
              Gestiona pedidos y supervisa las métricas de ventas por tienda
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Tienda asignada</p>
            <p className="text-lg font-semibold">{asesorTienda}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pedidos */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-700">Total Pedidos</span>
                </div>
                <p className="text-3xl font-bold text-blue-800">{filteredOrders.length}</p>
                <p className="text-xs text-blue-600">Pedidos filtrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entregados */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-700">Entregados</span>
                </div>
                <p className="text-3xl font-bold text-green-800">
                  {filteredOrders.filter(o => o.status === 'entregado').length}
                </p>
                <p className="text-xs text-green-600">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* En Ruta */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-orange-700">En Ruta</span>
                </div>
                <p className="text-3xl font-bold text-orange-800">
                  {filteredOrders.filter(o => o.status === 'en_ruta').length}
                </p>
                <p className="text-xs text-orange-600">En proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reagendados */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <RotateCcw className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-red-700">Reagendados</span>
                </div>
                <p className="text-3xl font-bold text-red-800">
                  {filteredOrders.filter(o => o.status === 'reagendado').length}
                </p>
                <p className="text-xs text-red-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Mejorados */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800">Filtros y Búsqueda</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{filteredRecords}</span> de{' '}
              <span className="font-semibold text-gray-800">{totalRecords}</span> registros
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros de fecha mejorados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Filtros rápidos */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Filtros rápidos</Label>
                <div className="grid grid-cols-2 gap-2">
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

              {/* Fecha específica */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Fecha específica</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        selectedDate.toLocaleDateString('es-CR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        "Seleccionar fecha"
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
                        setIsDatePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Rango de fechas */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Rango de fechas</Label>
                <Popover open={isDateRangePickerOpen} onOpenChange={setIsDateRangePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDateRange.from && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDateRange.from ? (
                        selectedDateRange.to ? (
                          `${selectedDateRange.from.toLocaleDateString('es-CR')} - ${selectedDateRange.to.toLocaleDateString('es-CR')}`
                        ) : (
                          `Desde ${selectedDateRange.from.toLocaleDateString('es-CR')}`
                        )
                      ) : (
                        "Seleccionar rango"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={selectedDateRange}
                      onSelect={(range) => {
                        setSelectedDateRange({
                          from: range?.from,
                          to: range?.to
                        });
                        setDateFilter('range');
                        setSelectedDate(undefined);
                        setSelectedMonth('');
                        if (range?.from && range?.to) {
                          setIsDateRangePickerOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Filtro por mes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Filtrar por mes</Label>
                <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedMonth && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedMonth ? (
                        new Date(selectedMonth + '-01').toLocaleDateString('es-CR', {
                          year: 'numeric',
                          month: 'long'
                        })
                      ) : (
                        "Seleccionar mes"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({length: 12}, (_, i) => {
                          const date = new Date(2024, i, 1);
                          const monthValue = `2024-${String(i + 1).padStart(2, '0')}`;
                          return (
                            <Button
                              key={monthValue}
                              variant={selectedMonth === monthValue ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedMonth(monthValue);
                                setDateFilter('month');
                                setSelectedDate(undefined);
                                setSelectedDateRange({from: undefined, to: undefined});
                                setIsMonthPickerOpen(false);
                              }}
                              className="text-xs"
                            >
                              {date.toLocaleDateString('es-CR', { month: 'short' })}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Filtrar por mensajero</Label>
                <Select value={selectedMessenger} onValueChange={setSelectedMessenger}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mensajero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los mensajeros</SelectItem>
                    {availableMessengers.map((mensajero) => (
                      <SelectItem key={mensajero.id} value={mensajero.name}>
                        {mensajero.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Filtrar por tienda</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Pedidos</SelectItem>
                    {asesorTienda && (
                      <SelectItem value={asesorTienda}>{asesorTienda}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Búsqueda y limpiar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">Buscar pedidos</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="ID, cliente, teléfono, dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStore('all');
                    setSelectedMessenger('all');
                    setDateFilter('all');
                    setSelectedDate(undefined);
                    setSelectedDateRange({from: undefined, to: undefined});
                    setSelectedMonth('');
                  }}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Pedidos Mejorada */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-purple-800">Pedidos {selectedStore !== 'all' ? `- ${selectedStore}` : ''}</h2>
                <p className="text-sm text-purple-600">Gestiona y supervisa todos los pedidos</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-4 py-2 text-lg font-semibold">
                {filteredOrders.length} pedidos
              </Badge>
              
              {/* Botones de edición masiva */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleEditMode}
                  variant={isEditMode ? "default" : "outline"}
                  className={`${isEditMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-purple-300 text-purple-700 hover:bg-purple-50'}`}
                >
                  {isEditMode ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar Edición
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Pedidos
                    </>
                  )}
                </Button>
                
                {isEditMode && (
                  <>
                    <Button
                      onClick={selectAllOrders}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      {selectedOrders.size === filteredOrders.length ? (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          Deseleccionar Todo
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4 mr-1" />
                          Seleccionar Todo
                        </>
                      )}
                    </Button>
                    
                    {selectedOrders.size > 0 && (
                      <Button
                        onClick={() => setShowBulkEditModal(true)}
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <MoreHorizontal className="w-4 h-4 mr-1" />
                        Editar Seleccionados ({selectedOrders.size})
                      </Button>
                    )}
                    
                    {hasUnsavedChanges() && (
                      <Button
                        onClick={saveAllChanges}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios ({editingOrders.size})
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay pedidos para mostrar</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || selectedStore !== 'all' 
                  ? 'No se encontraron pedidos con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                  : 'Los pedidos aparecerán aquí cuando estén disponibles para tu tienda.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1600px]">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    {isEditMode && (
                      <TableHead className="font-bold text-gray-800 min-w-[50px] px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                          onChange={selectAllOrders}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </TableHead>
                    )}
                    <TableHead className="font-bold text-gray-800 min-w-[120px] px-6 py-4">ID Pedido</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[200px] px-6 py-4">Cliente</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[300px] px-6 py-4">Dirección</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[250px] px-6 py-4">Productos</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[120px] px-6 py-4">Estado</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[150px] px-6 py-4">Mensajero</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[120px] px-6 py-4">Asesor</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[100px] px-6 py-4">Monto</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[120px] px-6 py-4">Fecha</TableHead>
                    <TableHead className="font-bold text-gray-800 min-w-[160px] px-6 py-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow 
                      key={order.id} 
                      className={`hover:bg-gray-50 transition-all duration-200 ${getStatusRowColor(order.status)} ${isOrderBeingEdited(order.id) ? 'bg-yellow-50 border-l-8 border-yellow-500' : ''}`}
                    >
                      {/* Checkbox para selección */}
                      {isEditMode && (
                        <TableCell className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </TableCell>
                      )}
                      
                      {/* ID Pedido */}
                      <TableCell className="font-medium px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${getStatusIndicatorColor(order.status)} shadow-md border-2 border-white`} />
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-bold text-gray-900">{order.id}</span>
                            <span className="text-xs text-gray-500 font-medium">Pedido</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Cliente */}
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{order.customerPhone || 'Sin teléfono'}</span>
                            {order.customerPhone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(order.customerPhone!, 'Número de teléfono')}
                                className="h-6 w-6 p-0 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                                title="Copiar número de teléfono"
                              >
                                <Clipboard className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Dirección */}
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700 leading-relaxed" title={order.customerAddress}>
                            {order.customerAddress || 'Sin dirección'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {order.customerDistrict}, {order.customerCanton}
                          </div>
                        </div>
                      </TableCell>

                      {/* Productos */}
                      <TableCell className="px-6 py-4">
                        <div className="max-w-[300px] space-y-2">
                          {/* Tienda */}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-md border border-purple-200">
                              {order.tienda || 'Sin tienda'}
                            </span>
                          </div>
                          {/* Productos */}
                          <div className="text-sm text-gray-700 leading-relaxed" title={order.productos || 'No especificados'}>
                            {order.productos || 'No especificados'}
                          </div>
                          {/* Monto */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-bold text-green-700">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                          {/* Número SINPE */}
                          {order.numero_sinpe && (
                            <div className="flex items-center gap-2 pt-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                SINPE: {order.numero_sinpe}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(order.numero_sinpe!, 'Número SINPE')}
                                className="h-6 w-6 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                                title="Copiar número SINPE"
                              >
                                <Clipboard className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="px-6 py-4">
                        {isOrderBeingEdited(order.id) ? (
                          <div className="space-y-2">
                            <Select
                              value={getOrderValue(order, 'status') as string}
                              onValueChange={(value) => updateOrderField(order.id, 'status', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendiente">📝 Pendiente</SelectItem>
                                <SelectItem value="en_ruta">🚚 En Ruta</SelectItem>
                                <SelectItem value="entregado">✅ Entregado</SelectItem>
                                <SelectItem value="reagendado">📅 Reagendado</SelectItem>
                                <SelectItem value="devolucion">❌ Devolución</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => saveOrderChanges(order.id)}
                                disabled={isSaving}
                                className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => cancelEdit(order.id)}
                                variant="outline"
                                className="h-6 px-2 text-xs"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Badge 
                              variant="outline" 
                              className={`text-sm font-semibold px-3 py-2 rounded-lg shadow-sm flex items-center gap-2 w-fit ${
                                order.status === 'entregado' ? 'bg-green-50 text-green-700 border-green-200' :
                                order.status === 'en_ruta' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                order.status === 'devolucion' ? 'bg-red-50 text-red-700 border-red-200' :
                                order.status === 'reagendado' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {order.status === 'entregado' ? '✅ Entregado' :
                               order.status === 'en_ruta' ? '🚚 En Ruta' :
                               order.status === 'devolucion' ? '❌ Devolución' :
                               order.status === 'reagendado' ? '📅 Reagendado' :
                               '📝 Pendiente'}
                            </Badge>
                            {isEditMode && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderField(order.id, 'status', order.status)}
                                variant="outline"
                                className="h-6 px-2 text-xs w-full"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Mensajero */}
                      <TableCell className="px-6 py-4">
                        {isOrderBeingEdited(order.id) ? (
                          <div className="space-y-2">
                            <Select
                              value={typeof getOrderValue(order, 'assignedMessenger') === 'object' && getOrderValue(order, 'assignedMessenger') !== null ? (getOrderValue(order, 'assignedMessenger') as any)?.name || '' : ''}
                              onValueChange={(value) => {
                                const messenger = availableMessengers.find(m => m.name === value);
                                updateOrderField(order.id, 'assignedMessenger', messenger);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar mensajero" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableMessengers.map((messenger) => (
                                  <SelectItem key={messenger.id} value={messenger.name}>
                                    {messenger.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-blue-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {order.assignedMessenger?.name || 'Sin asignar'}
                              </span>
                            </div>
                            {order.assignedMessenger?.phone && (
                              <div className="text-xs text-gray-500">
                                {order.assignedMessenger.phone}
                              </div>
                            )}
                            {isEditMode && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderField(order.id, 'assignedMessenger', order.assignedMessenger)}
                                variant="outline"
                                className="h-6 px-2 text-xs w-full"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Asesor */}
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-purple-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {order.asesor?.name || 'Sin asignar'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.asesor?.store || 'Sin tienda'}
                          </div>
                        </div>
                      </TableCell>

                      {/* Monto */}
                      <TableCell className="px-6 py-4">
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                          </div>
                        </div>
                      </TableCell>

                      {/* Fecha */}
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString('es-CR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString('es-CR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(order)}
                            className="h-10 w-10 p-0 bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700 hover:scale-105 transition-transform"
                            title="Ver Detalles"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 w-10 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700 hover:scale-105 transition-transform"
                            title="Editar Pedido"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edición Masiva */}
      <Dialog open={showBulkEditModal} onOpenChange={setShowBulkEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-600" />
              Edición Masiva de Pedidos
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>{selectedOrders.size}</strong> pedidos seleccionados para edición masiva.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulkField">Campo a editar</Label>
              <Select value={bulkEditField} onValueChange={setBulkEditField}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Estado</SelectItem>
                  <SelectItem value="assignedMessenger">Mensajero</SelectItem>
                  <SelectItem value="paymentMethod">Método de Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {bulkEditField === 'status' && (
              <div className="space-y-2">
                <Label htmlFor="bulkValue">Nuevo estado</Label>
                <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">📝 Pendiente</SelectItem>
                    <SelectItem value="en_ruta">🚚 En Ruta</SelectItem>
                    <SelectItem value="entregado">✅ Entregado</SelectItem>
                    <SelectItem value="reagendado">📅 Reagendado</SelectItem>
                    <SelectItem value="devolucion">❌ Devolución</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {bulkEditField === 'assignedMessenger' && (
              <div className="space-y-2">
                <Label htmlFor="bulkValue">Nuevo mensajero</Label>
                <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mensajero" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMessengers.map((messenger) => (
                      <SelectItem key={messenger.id} value={messenger.name}>
                        {messenger.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {bulkEditField === 'paymentMethod' && (
              <div className="space-y-2">
                <Label htmlFor="bulkValue">Nuevo método de pago</Label>
                <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="sinpe">SINPE</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkEditField('');
                  setBulkEditValue('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={applyBulkEdit}
                disabled={!bulkEditField || !bulkEditValue}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Aplicar a {selectedOrders.size} pedidos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
