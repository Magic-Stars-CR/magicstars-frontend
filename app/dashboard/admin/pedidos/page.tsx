'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PedidoTest, OrderStatus } from '@/lib/types';
import { getPedidos, getAllPedidos, updatePedido } from '@/lib/supabase-pedidos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import {
  Package,
  CheckCircle,
  RotateCcw,
  Truck,
  Clock,
  DollarSign,
  Search,
  Filter,
  MapPin,
  User,
  Eye,
  Edit3,
  Save,
  Download,
  RefreshCw,
  Calendar,
  Building2,
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  BarChart3,
  Users,
  Activity,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Navigation,
  PieChart,
  Phone,
  Store,
  Map as MapIcon,
  Banknote
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Link from 'next/link';

export default function AdminPedidosPage() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoTest[]>([]);
  const [allPedidos, setAllPedidos] = useState<PedidoTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [distritoFilter, setDistritoFilter] = useState('all');
  const [mensajeroFilter, setMensajeroFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [tiendaFilter, setTiendaFilter] = useState('all');
  const [metodoPagoFilter, setMetodoPagoFilter] = useState('all');
  const [selectedPedido, setSelectedPedido] = useState<PedidoTest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingPedido, setUpdatingPedido] = useState<string | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);

  // Estados para edición
  const [editForm, setEditForm] = useState({
    estado: '',
    mensajero: '',
    fecha: '',
    notas: '',
    metodo_pago: '',
    nota_asesor: ''
  });

  // Estados para actualización rápida de estado
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [selectedPedidoForStatus, setSelectedPedidoForStatus] = useState<PedidoTest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPedidoForDetail, setSelectedPedidoForDetail] = useState<PedidoTest | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isDualPayment, setIsDualPayment] = useState(false);
  const [dualPaymentAmounts, setDualPaymentAmounts] = useState({ efectivo: '', sinpe: '' });
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (user) {
      loadPedidos();
      loadAllPedidosForFilters();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPedidos();
    }
  }, [currentPage, pageSize]);

  // Recargar datos cuando cambien los filtros del servidor
  useEffect(() => {
    if (user && hasServerSideFilters) {
      // Resetear a la primera página cuando cambien los filtros
      setCurrentPage(1);
      loadPedidos();
    }
  }, [statusFilter, distritoFilter, mensajeroFilter, dateFilter, specificDate, dateRange, tiendaFilter, metodoPagoFilter]);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      console.log('Cargando pedidos con paginación...');
      
      // Si hay filtros activos, usar todos los pedidos y filtrar del lado del cliente
      if (hasServerSideFilters) {
        console.log('Filtros activos detectados, usando filtrado del lado del cliente');
        const allData = await getAllPedidos();
        
        // Aplicar filtros del servidor
        const filtered = allData.filter(pedido => {
          if (!pedido.id_pedido) return false;

          const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'asignado' && pedido.mensajero_asignado && !pedido.mensajero_concretado) ||
            (statusFilter === 'entregado' && pedido.mensajero_concretado) ||
            (statusFilter === 'sin_asignar' && !pedido.mensajero_asignado);

          const matchesDistrito = distritoFilter === 'all' || pedido.distrito === distritoFilter;
          const matchesMensajero = mensajeroFilter === 'all' || pedido.mensajero_asignado === mensajeroFilter;
          const matchesTienda = tiendaFilter === 'all' || pedido.tienda === tiendaFilter;
          const matchesMetodoPago = metodoPagoFilter === 'all' || pedido.metodo_pago === metodoPagoFilter;

          let matchesDate = true;
          if (dateFilter !== 'all') {
            const orderDate = new Date(pedido.fecha_creacion);
            const today = new Date();
            
            switch (dateFilter) {
              case 'today':
                matchesDate = orderDate.toDateString() === today.toDateString();
                break;
              case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                matchesDate = orderDate.toDateString() === yesterday.toDateString();
                break;
              case 'week':
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesDate = orderDate >= weekAgo;
                break;
              case 'month':
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                matchesDate = orderDate >= monthAgo;
                break;
              case 'specific':
                if (specificDate) {
                  const selectedDate = new Date(specificDate);
                  matchesDate = orderDate.toDateString() === selectedDate.toDateString();
                }
                break;
              case 'range':
                if (dateRange.start && dateRange.end) {
                  const startDate = new Date(dateRange.start);
                  const endDate = new Date(dateRange.end);
                  endDate.setHours(23, 59, 59, 999); // Incluir todo el día final
                  matchesDate = orderDate >= startDate && orderDate <= endDate;
                }
                break;
              case 'last_month':
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                matchesDate = orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
                break;
              case 'year':
                const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
                matchesDate = orderDate >= yearAgo;
                break;
            }
          }

          return matchesStatus && matchesDistrito && matchesMensajero && matchesDate && matchesTienda && matchesMetodoPago;
        });

        // Aplicar paginación a los datos filtrados
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filtered.slice(startIndex, endIndex);
        
        setPedidos(paginatedData);
        setTotalPages(Math.ceil(filtered.length / pageSize));
        setTotalPedidos(filtered.length);
      } else {
        // Sin filtros, usar paginación del servidor
        const result = await getPedidos(currentPage, pageSize);
        setPedidos(result.data);
        setTotalPages(result.totalPages);
        setTotalPedidos(result.total);
      }
    } catch (error) {
      console.error('Error loading pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPedidosForFilters = async () => {
    try {
      setLoadingFilters(true);
      console.log('Cargando todos los pedidos para filtros...');
      
      const allData = await getAllPedidos();
      setAllPedidos(allData);
    } catch (error) {
      console.error('Error loading all pedidos for filters:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const updatePedidoStatus = async (pedidoId: string, updates: Partial<PedidoTest>) => {
    try {
      setUpdatingPedido(pedidoId);
      
      const success = await updatePedido(pedidoId, updates);
      if (success) {
        setPedidos(prevPedidos => 
          prevPedidos.map(pedido => 
            pedido.id_pedido === pedidoId 
              ? { ...pedido, ...updates }
              : pedido
          )
        );
        setIsEditModalOpen(false);
        // Recargar todos los pedidos para actualizar filtros
        loadAllPedidosForFilters();
      }
    } catch (error) {
      console.error('Error updating pedido:', error);
    } finally {
      setUpdatingPedido(null);
    }
  };

  const handleEditPedido = (pedido: PedidoTest) => {
    setSelectedPedido(pedido);
    setEditForm({
      estado: pedido.estado_pedido || '',
      mensajero: pedido.mensajero_asignado || '',
      fecha: pedido.fecha_entrega || '',
      notas: pedido.notas || '',
      metodo_pago: pedido.metodo_pago || '',
      nota_asesor: pedido.nota_asesor || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPedido) return;

    const updates: Partial<PedidoTest> = {};
    
    if (editForm.estado) {
      updates.estado_pedido = editForm.estado;
    }
    if (editForm.mensajero) {
      updates.mensajero_asignado = editForm.mensajero;
    }
    if (editForm.fecha) {
      updates.fecha_entrega = editForm.fecha;
    }
    if (editForm.notas) {
      updates.notas = editForm.notas;
    }
    if (editForm.metodo_pago) {
      updates.metodo_pago = editForm.metodo_pago;
    }
    if (editForm.nota_asesor) {
      updates.nota_asesor = editForm.nota_asesor;
    }

    await updatePedidoStatus(selectedPedido.id_pedido, updates);
  };

  const handleQuickStatusUpdate = (pedido: PedidoTest) => {
    setSelectedPedidoForStatus(pedido);
    setNewStatus(pedido.estado_pedido || 'pendiente');
    setPaymentMethod(pedido.metodo_pago || 'efectivo');
    setIsDualPayment(pedido.metodo_pago === '2pagos');
    setDualPaymentAmounts({
      efectivo: pedido.efectivo_2_pagos || '',
      sinpe: pedido.sinpe_2_pagos || ''
    });
    setStatusNotes('');
    setIsStatusUpdateModalOpen(true);
  };

  const handleViewPedidoDetail = (pedido: PedidoTest) => {
    setSelectedPedidoForDetail(pedido);
    setShowDetailModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedPedidoForStatus || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const updates: Partial<PedidoTest> = {
        estado_pedido: newStatus
      };

      // Si es entregado, actualizar método de pago
      if (newStatus === 'entregado') {
        updates.metodo_pago = paymentMethod;
        
        if (isDualPayment && paymentMethod === '2pagos') {
          updates.efectivo_2_pagos = dualPaymentAmounts.efectivo;
          updates.sinpe_2_pagos = dualPaymentAmounts.sinpe;
        }
      }

      // Si hay notas, añadirlas
      if (statusNotes) {
        updates.notas = statusNotes;
      }

      // Si es entregado, marcar como concretado
      if (newStatus === 'entregado') {
        updates.mensajero_concretado = selectedPedidoForStatus.mensajero_asignado || 'Admin';
      }

      const success = await updatePedido(selectedPedidoForStatus.id_pedido, updates);
      if (success) {
        // Actualizar la lista local
        setPedidos(prevPedidos => 
          prevPedidos.map(pedido => 
            pedido.id_pedido === selectedPedidoForStatus.id_pedido 
              ? { ...pedido, ...updates }
              : pedido
          )
        );
        
        // Recargar todos los pedidos para actualizar filtros
        loadAllPedidosForFilters();
        
        setIsStatusUpdateModalOpen(false);
        setSelectedPedidoForStatus(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filtrar pedidos basado en los filtros activos (solo para mostrar, no afecta paginación)
  const filteredPedidos = pedidos.filter(pedido => {
    if (!pedido.id_pedido) return false;

    const matchesSearch = 
      (pedido.id_pedido?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.cliente_nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.cliente_telefono?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.distrito?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.productos?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.mensajero_asignado && pedido.mensajero_asignado.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'asignado' && pedido.mensajero_asignado && !pedido.mensajero_concretado) ||
      (statusFilter === 'entregado' && pedido.mensajero_concretado) ||
      (statusFilter === 'sin_asignar' && !pedido.mensajero_asignado);

    const matchesDistrito = distritoFilter === 'all' || pedido.distrito === distritoFilter;
    const matchesMensajero = mensajeroFilter === 'all' || pedido.mensajero_asignado === mensajeroFilter;
    const matchesTienda = tiendaFilter === 'all' || pedido.tienda === tiendaFilter;
    const matchesMetodoPago = metodoPagoFilter === 'all' || pedido.metodo_pago === metodoPagoFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(pedido.fecha_creacion);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          matchesDate = orderDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= monthAgo;
          break;
        case 'specific':
          if (specificDate) {
            const selectedDate = new Date(specificDate);
            matchesDate = orderDate.toDateString() === selectedDate.toDateString();
          }
          break;
        case 'range':
          if (dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999); // Incluir todo el día final
            matchesDate = orderDate >= startDate && orderDate <= endDate;
          }
          break;
        case 'last_month':
          const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
          matchesDate = orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
          break;
        case 'year':
          const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= yearAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDistrito && matchesMensajero && matchesDate && matchesTienda && matchesMetodoPago;
  });

  // Verificar si hay filtros activos que requieren recarga de datos
  const hasServerSideFilters = statusFilter !== 'all' || distritoFilter !== 'all' || 
    mensajeroFilter !== 'all' || dateFilter !== 'all' || specificDate !== '' || 
    (dateRange.start !== '' && dateRange.end !== '') || tiendaFilter !== 'all' || metodoPagoFilter !== 'all';

  // Calcular estadísticas basadas en filtros activos
  const getFilteredStats = () => {
    // Usar allPedidos si está disponible, sino usar pedidos de la página actual
    const dataSource = allPedidos.length > 0 ? allPedidos : pedidos;
    console.log('📊 Fuente de datos para estadísticas:', dataSource === allPedidos ? 'allPedidos' : 'pedidos', 'Longitud:', dataSource.length);
    
    // Si no hay filtros activos, usar todos los datos disponibles
    if (!hasServerSideFilters && !searchTerm) {
      return {
        total: dataSource.length,
        asignados: dataSource.filter(p => p.mensajero_asignado && !p.mensajero_concretado).length,
        entregados: dataSource.filter(p => p.mensajero_concretado).length,
        sinAsignar: dataSource.filter(p => !p.mensajero_asignado).length,
        devoluciones: dataSource.filter(p => p.estado_pedido === 'devolucion').length,
        reagendados: dataSource.filter(p => p.estado_pedido === 'reagendado').length,
        valorTotal: dataSource.reduce((sum, p) => sum + p.valor_total, 0),
        efectivo: dataSource.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'efectivo').length,
        sinpe: dataSource.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'sinpe').length,
        tarjeta: dataSource.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'tarjeta').length,
        dosPagos: dataSource.filter(p => p.metodo_pago && (p.metodo_pago.toLowerCase() === '2pagos' || p.metodo_pago.toLowerCase() === '2 pagos')).length
      };
    }

    // Si hay filtros activos, usar todos los datos para cálculos precisos
    const filtered = dataSource.filter(pedido => {
      if (!pedido.id_pedido) return false;

      const matchesSearch = 
        (pedido.id_pedido?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (pedido.cliente_nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (pedido.cliente_telefono?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (pedido.distrito?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (pedido.productos?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (pedido.mensajero_asignado && pedido.mensajero_asignado.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'asignado' && pedido.mensajero_asignado && !pedido.mensajero_concretado) ||
        (statusFilter === 'entregado' && pedido.mensajero_concretado) ||
        (statusFilter === 'sin_asignar' && !pedido.mensajero_asignado) ||
        (statusFilter === 'devolucion' && pedido.estado_pedido === 'devolucion') ||
        (statusFilter === 'reagendado' && pedido.estado_pedido === 'reagendado');

      const matchesDistrito = distritoFilter === 'all' || pedido.distrito === distritoFilter;
      const matchesMensajero = mensajeroFilter === 'all' || pedido.mensajero_asignado === mensajeroFilter;
      const matchesTienda = tiendaFilter === 'all' || pedido.tienda === tiendaFilter;
      const matchesMetodoPago = metodoPagoFilter === 'all' || 
        (pedido.metodo_pago && pedido.metodo_pago.toLowerCase() === metodoPagoFilter.toLowerCase()) ||
        (metodoPagoFilter === '2pagos' && pedido.metodo_pago && 
         (pedido.metodo_pago.toLowerCase() === '2pagos' || pedido.metodo_pago.toLowerCase() === '2 pagos'));

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(pedido.fecha_creacion);
        const today = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = orderDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            matchesDate = orderDate.toDateString() === yesterday.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = orderDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = orderDate >= monthAgo;
            break;
          case 'last_month':
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            matchesDate = orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
            break;
          case 'year':
            const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
            matchesDate = orderDate >= yearAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDistrito && matchesMensajero && matchesDate && matchesTienda && matchesMetodoPago;
    });

    return {
      total: filtered.length,
      asignados: filtered.filter(p => p.mensajero_asignado && !p.mensajero_concretado).length,
      entregados: filtered.filter(p => p.mensajero_concretado).length,
      sinAsignar: filtered.filter(p => !p.mensajero_asignado).length,
      devoluciones: filtered.filter(p => p.estado_pedido === 'devolucion').length,
      reagendados: filtered.filter(p => p.estado_pedido === 'reagendado').length,
      valorTotal: filtered.reduce((sum, p) => sum + p.valor_total, 0),
      efectivo: filtered.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'efectivo').length,
      sinpe: filtered.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'sinpe').length,
      tarjeta: filtered.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'tarjeta').length,
      dosPagos: filtered.filter(p => p.metodo_pago && (p.metodo_pago.toLowerCase() === '2pagos' || p.metodo_pago.toLowerCase() === '2 pagos')).length
    };
  };

  const stats = getFilteredStats();
  
  // Debug: Log para verificar las estadísticas
  console.log('📊 Estadísticas calculadas:', stats);
  console.log('📋 Total pedidos cargados:', pedidos.length);
  console.log('📋 Total pedidos completos:', allPedidos.length);
  console.log('💳 Métodos de pago únicos encontrados:', Array.from(new Set(allPedidos.map(p => p.metodo_pago).filter(Boolean))));
  console.log('🔍 Filtros activos:', { 
    hasServerSideFilters, 
    searchTerm, 
    statusFilter, 
    distritoFilter, 
    mensajeroFilter, 
    tiendaFilter, 
    metodoPagoFilter, 
    dateFilter 
  });

  // Obtener listas únicas para filtros
  const distritos = Array.from(new Set(allPedidos.map(p => p.distrito).filter(Boolean))).sort() as string[];
  const mensajeros = Array.from(new Set(allPedidos.map(p => p.mensajero_asignado).filter(Boolean))).sort() as string[];
  const tiendas = Array.from(new Set(allPedidos.map(p => p.tienda).filter(Boolean))).sort() as string[];
  const metodosPago = Array.from(new Set(allPedidos.map(p => p.metodo_pago).filter(Boolean))).sort() as string[];

  const getStatusForBadge = (pedido: PedidoTest): OrderStatus => {
    if (pedido.mensajero_concretado) {
      return 'entregado';
    } else if (pedido.mensajero_asignado) {
      return 'en_ruta';
    } else {
      return 'pendiente';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'entregado': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'en_ruta': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'pendiente': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'devolucion': return <RotateCcw className="w-4 h-4 text-red-600" />;
      case 'reagendado': return <Calendar className="w-4 h-4 text-orange-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'efectivo': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'sinpe': return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'tarjeta': return <CreditCard className="w-4 h-4 text-purple-600" />;
      case '2pagos': return <FileText className="w-4 h-4 text-orange-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDistritoFilter('all');
    setMensajeroFilter('all');
    setDateFilter('all');
    setSpecificDate('');
    setDateRange({ start: '', end: '' });
    setTiendaFilter('all');
    setMetodoPagoFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || distritoFilter !== 'all' || 
    mensajeroFilter !== 'all' || dateFilter !== 'all' || specificDate !== '' || 
    (dateRange.start !== '' && dateRange.end !== '') || tiendaFilter !== 'all' || metodoPagoFilter !== 'all';

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
            Administra todos los pedidos del sistema con capacidades de edición avanzadas
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasServerSideFilters ? (
              <>Mostrando {filteredPedidos.length} de {totalPedidos} pedidos filtrados</>
            ) : (
              <>Mostrando {filteredPedidos.length} de {totalPedidos} pedidos totales</>
            )}
          </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={loadPedidos} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
                  <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
                  <p className="text-xs text-green-600">
                    {hasActiveFilters ? 'Filtrados' : `${totalPedidos.toLocaleString()} totales`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+12%</span>
                </div>
                <p className="text-xs text-muted-foreground">vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
          
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entregados</p>
                  <p className="text-xl font-bold text-green-600">{stats.entregados.toLocaleString()}</p>
                  <p className="text-xs text-green-600">
                    {stats.total > 0 ? `${Math.round((stats.entregados / stats.total) * 100)}% del total` : '0%'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+5%</span>
                </div>
                <p className="text-xs text-muted-foreground">vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sin Asignar</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.sinAsignar.toLocaleString()}</p>
                  <p className="text-xs text-yellow-600">Requieren atención</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Urgente</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${Math.round((stats.sinAsignar / stats.total) * 100)}% del total` : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-purple-600 break-words" title={formatCurrency(stats.valorTotal)}>
                    {formatCurrency(stats.valorTotal)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {hasActiveFilters ? 'Filtrado' : 'Todos los pedidos'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">+8%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">vs mes anterior</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métodos de Pago Stats con Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Efectivo</p>
                  <p className="text-lg font-bold">{stats.efectivo.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600 font-medium">
                  {stats.total > 0 ? `${Math.round((stats.efectivo / stats.total) * 100)}%` : '0%'}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.total > 0 ? Math.min((stats.efectivo / stats.total) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span className="font-medium">{stats.efectivo}</span>
              </div>
            </CardContent>
          </Card>
          
        <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SINPE</p>
                  <p className="text-lg font-bold">{stats.sinpe.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600 font-medium">
                  {stats.total > 0 ? `${Math.round((stats.sinpe / stats.total) * 100)}%` : '0%'}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.total > 0 ? Math.min((stats.sinpe / stats.total) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span className="font-medium">{stats.sinpe}</span>
              </div>
            </CardContent>
          </Card>
          
        <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tarjeta</p>
                  <p className="text-lg font-bold">{stats.tarjeta.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-purple-600 font-medium">
                  {stats.total > 0 ? `${Math.round((stats.tarjeta / stats.total) * 100)}%` : '0%'}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.total > 0 ? Math.min((stats.tarjeta / stats.total) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span className="font-medium">{stats.tarjeta}</span>
              </div>
            </CardContent>
          </Card>
          
        <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">2 Pagos</p>
                  <p className="text-lg font-bold">{stats.dosPagos.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-orange-600 font-medium">
                  {stats.total > 0 ? `${Math.round((stats.dosPagos / stats.total) * 100)}%` : '0%'}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.total > 0 ? Math.min((stats.dosPagos / stats.total) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span className="font-medium">{stats.dosPagos}</span>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Gráficas de Comparación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Barras - Pedidos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Distribución de Pedidos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Entregados', value: stats.entregados, color: '#10b981' },
                { name: 'Sin Asignar', value: stats.sinAsignar, color: '#f59e0b' },
                { name: 'Asignados', value: stats.asignados, color: '#3b82f6' },
                { name: 'Devoluciones', value: stats.devoluciones, color: '#ef4444' },
                { name: 'Reagendados', value: stats.reagendados, color: '#f97316' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Pedidos']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de Pie - Métodos de Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribución de Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Efectivo', value: stats.efectivo, color: '#10b981' },
                    { name: 'SINPE', value: stats.sinpe, color: '#3b82f6' },
                    { name: 'Tarjeta', value: stats.tarjeta, color: '#8b5cf6' },
                    { name: '2 Pagos', value: stats.dosPagos, color: '#f59e0b' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Efectivo', value: stats.efectivo, color: '#10b981' },
                    { name: 'SINPE', value: stats.sinpe, color: '#3b82f6' },
                    { name: 'Tarjeta', value: stats.tarjeta, color: '#8b5cf6' },
                    { name: '2 Pagos', value: stats.dosPagos, color: '#f59e0b' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de Línea - Tendencias por Día */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tendencias de Pedidos por Día (Últimos 7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { name: 'Lun', pedidos: 120, entregados: 115 },
                { name: 'Mar', pedidos: 150, entregados: 142 },
                { name: 'Mié', pedidos: 180, entregados: 168 },
                { name: 'Jue', pedidos: 200, entregados: 185 },
                { name: 'Vie', pedidos: 220, entregados: 210 },
                { name: 'Sáb', pedidos: 180, entregados: 175 },
                { name: 'Dom', pedidos: 160, entregados: 155 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pedidos" stroke="#3b82f6" strokeWidth={2} name="Total Pedidos" />
                <Line type="monotone" dataKey="entregados" stroke="#10b981" strokeWidth={2} name="Entregados" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Rápidos con Botones */}
        <Card>
          <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Rápidos
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  {[searchTerm, statusFilter, distritoFilter, mensajeroFilter, dateFilter, specificDate, 
                    dateRange.start, dateRange.end, tiendaFilter, metodoPagoFilter]
                    .filter(f => f !== 'all' && f !== '').length} activos
                </Badge>
              )}
            </CardTitle>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllFilters}
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <FilterX className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
            )}
          </div>
          </CardHeader>
          <CardContent>
          {/* Botones de Filtros Rápidos */}
          <div className="space-y-4">
            {/* Filtros por Estado */}
              <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Estado del Pedido</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}
                >
                  <Package className="w-4 h-4 mr-1" />
                  Todos ({totalPedidos.toLocaleString()})
                </Button>
                <Button
                  variant={statusFilter === 'sin_asignar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('sin_asignar')}
                  className={statusFilter === 'sin_asignar' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Sin Asignar ({stats.sinAsignar.toLocaleString()})
                </Button>
                <Button
                  variant={statusFilter === 'asignado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('asignado')}
                  className={statusFilter === 'asignado' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}
                >
                  <Truck className="w-4 h-4 mr-1" />
                  Asignados ({stats.asignados.toLocaleString()})
                </Button>
                <Button
                  variant={statusFilter === 'entregado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('entregado')}
                  className={statusFilter === 'entregado' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Entregados ({stats.entregados.toLocaleString()})
                </Button>
                <Button
                  variant={statusFilter === 'devolucion' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('devolucion')}
                  className={statusFilter === 'devolucion' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Devoluciones ({stats.devoluciones?.toLocaleString() || '0'})
                </Button>
                <Button
                  variant={statusFilter === 'reagendado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('reagendado')}
                  className={statusFilter === 'reagendado' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reagendados ({stats.reagendados?.toLocaleString() || '0'})
                </Button>
              </div>
            </div>

            {/* Filtros por Fecha */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Período de Tiempo</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={dateFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDateFilter('all');
                    setSpecificDate('');
                    setDateRange({ start: '', end: '' });
                  }}
                  className={dateFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Todas las fechas
                </Button>
                <Button
                  type="button"
                  variant={dateFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDateFilter('today');
                    setSpecificDate('');
                    setDateRange({ start: '', end: '' });
                  }}
                  className={dateFilter === 'today' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}
                >
                  <Activity className="w-4 h-4 mr-1" />
                  Hoy
                </Button>
                <Button
                  type="button"
                  variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDateFilter('yesterday');
                    setSpecificDate('');
                    setDateRange({ start: '', end: '' });
                  }}
                  className={dateFilter === 'yesterday' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Ayer
                </Button>
                <Button
                  type="button"
                  variant={dateFilter === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDateFilter('week');
                    setSpecificDate('');
                    setDateRange({ start: '', end: '' });
                  }}
                  className={dateFilter === 'week' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Última semana
                </Button>
                <Button
                  type="button"
                  variant={dateFilter === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDateFilter('month');
                    setSpecificDate('');
                    setDateRange({ start: '', end: '' });
                  }}
                  className={dateFilter === 'month' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Último mes
                </Button>
              </div>
              
              {/* Filtros de Fecha Específica y Rango */}
              <div className="flex flex-wrap gap-4 mt-4">
                {/* Fecha Específica */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={dateFilter === 'specific' ? 'default' : 'outline'}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setDateFilter('specific');
                      setDateRange({ start: '', end: '' }); // Limpiar rango cuando se selecciona fecha específica
                    }}
                    className={dateFilter === 'specific' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Fecha específica
                  </Button>
                  {dateFilter === 'specific' && (
                    <Input
                      type="date"
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                      className="w-40"
                    />
                  )}
                </div>
                
                {/* Rango de Fechas */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={dateFilter === 'range' ? 'default' : 'outline'}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setDateFilter('range');
                      setSpecificDate(''); // Limpiar fecha específica cuando se selecciona rango
                    }}
                    className={dateFilter === 'range' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Rango de fechas
                  </Button>
                  {dateFilter === 'range' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        placeholder="Desde"
                        className="w-40"
                      />
                      <span className="text-sm text-muted-foreground">hasta</span>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        placeholder="Hasta"
                        className="w-40"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filtros por Método de Pago */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Método de Pago</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={metodoPagoFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetodoPagoFilter('all')}
                  className={metodoPagoFilter === 'all' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Todos los métodos
                </Button>
                <Button
                  variant={metodoPagoFilter === 'efectivo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetodoPagoFilter('efectivo')}
                  className={metodoPagoFilter === 'efectivo' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Efectivo ({stats.efectivo.toLocaleString()})
                </Button>
                <Button
                  variant={metodoPagoFilter === 'sinpe' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetodoPagoFilter('sinpe')}
                  className={metodoPagoFilter === 'sinpe' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  SINPE ({stats.sinpe.toLocaleString()})
                </Button>
                <Button
                  variant={metodoPagoFilter === 'tarjeta' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetodoPagoFilter('tarjeta')}
                  className={metodoPagoFilter === 'tarjeta' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Tarjeta ({stats.tarjeta.toLocaleString()})
                </Button>
                <Button
                  variant={metodoPagoFilter === '2pagos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetodoPagoFilter('2pagos')}
                  className={metodoPagoFilter === '2pagos' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  2 Pagos ({stats.dosPagos.toLocaleString()})
                </Button>
              </div>
            </div>

            {/* Filtros Avanzados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                  placeholder="Buscar por ID, cliente, teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
              </div>
              
                <Select value={distritoFilter} onValueChange={setDistritoFilter}>
                  <SelectTrigger>
                  <SelectValue placeholder="Filtrar por distrito" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all">Todos los distritos</SelectItem>
                    {distritos.map(distrito => (
                      <SelectItem key={distrito} value={distrito}>{distrito}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              
                <Select value={mensajeroFilter} onValueChange={setMensajeroFilter}>
                  <SelectTrigger>
                  <SelectValue placeholder="Filtrar por mensajero" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all">Todos los mensajeros</SelectItem>
                    {mensajeros.map(mensajero => (
                      <SelectItem key={mensajero} value={mensajero}>{mensajero}</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={tiendaFilter} onValueChange={setTiendaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tienda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tiendas</SelectItem>
                  {tiendas.map(tienda => (
                    <SelectItem key={tienda} value={tienda}>{tienda}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Label htmlFor="pageSize" className="text-sm font-medium">Registros por página:</Label>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Orders Table */}
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
              Pedidos ({filteredPedidos.length})
            </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Métricas
            </Button>
          </div>
          </CardHeader>
          <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">ID Pedido</TableHead>
                    <TableHead className="min-w-[180px]">Cliente</TableHead>
                    <TableHead className="min-w-[100px]">Valor</TableHead>
                    <TableHead className="min-w-[120px]">Método Pago</TableHead>
                    <TableHead className="min-w-[200px]">Dirección Completa</TableHead>
                    <TableHead className="min-w-[120px]">Tienda</TableHead>
                    <TableHead className="min-w-[120px]">Mensajero</TableHead>
                    <TableHead className="min-w-[150px]">Fecha Entrega</TableHead>
                    <TableHead className="min-w-[120px]">Estado</TableHead>
                    <TableHead className="min-w-[200px]">Notas</TableHead>
                    <TableHead className="min-w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {filteredPedidos.map((pedido) => (
                    <TableRow key={pedido.id_pedido} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold">{pedido.id_pedido}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{pedido.cliente_nombre || 'Sin nombre'}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">📞</span>
                            <span className="text-xs text-muted-foreground">{pedido.cliente_telefono || 'Sin teléfono'}</span>
                        </div>
                      </div>
                      </TableCell>
                      
                      <TableCell>
                        <p className="font-bold text-sm">{formatCurrency(pedido.valor_total)}</p>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(pedido.metodo_pago || 'efectivo')}
                          <span className="text-xs capitalize">{pedido.metodo_pago || 'Efectivo'}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium">{pedido.distrito || 'Sin distrito'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{pedido.canton || 'Sin cantón'}</p>
                          <p className="text-xs text-muted-foreground">{pedido.provincia || 'Sin provincia'}</p>
                          {pedido.direccion && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={pedido.direccion}>
                              {pedido.direccion}
                            </p>
                          )}
                          </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-500" />
                          <span className="text-xs">{pedido.tienda || 'Sin tienda'}</span>
                      </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {pedido.mensajero_asignado ? (
                              <>
                                <User className="w-3 h-3 text-blue-600" />
                                <span className="text-xs">{pedido.mensajero_asignado}</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin asignar</span>
                            )}
                          </div>
                          {pedido.mensajero_concretado && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600">Concretado: {pedido.mensajero_concretado}</span>
                            </div>
                          )}
                          {pedido.jornada_ruta && (
                            <div className="flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-orange-600" />
                              <span className="text-xs text-orange-600">{pedido.jornada_ruta}</span>
                        </div>
                      )}
                    </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-xs">{formatDate(pedido.fecha_creacion)}</span>
                          </div>
                          {pedido.fecha_entrega && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600">{formatDate(pedido.fecha_entrega)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(getStatusForBadge(pedido))}
                          <OrderStatusBadge status={getStatusForBadge(pedido)} />
                      <Button disabled
                        variant="outline"
                        size="sm"
                            onClick={() => handleQuickStatusUpdate(pedido)}
                            className="h-6 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Actualizar
                      </Button>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2 max-w-[180px]">
                          {pedido.notas && (
                            <div className="bg-blue-50 p-2 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                                <span className="font-medium text-blue-800">Notas:</span>
                              </div>
                              <p className="text-blue-700 truncate" title={pedido.notas}>
                                {pedido.notas}
                              </p>
                            </div>
                          )}
                          {pedido.nota_asesor && (
                            <div className="bg-green-50 p-2 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <Users className="w-3 h-3 text-green-600" />
                                <span className="font-medium text-green-800">Asesor:</span>
                              </div>
                              <p className="text-green-700 truncate" title={pedido.nota_asesor}>
                                {pedido.nota_asesor}
                              </p>
                            </div>
                          )}
                          {pedido.productos && (
                            <div className="bg-gray-50 p-2 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <Package className="w-3 h-3 text-gray-600" />
                                <span className="font-medium text-gray-800">Productos:</span>
                              </div>
                              <p className="text-gray-700 truncate" title={pedido.productos}>
                                {pedido.productos}
                              </p>
                            </div>
                          )}
                          {pedido.numero_sinpe && (
                            <div className="bg-blue-50 p-2 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <CreditCard className="w-3 h-3 text-blue-600" />
                                <span className="font-medium text-blue-800">SINPE:</span>
                              </div>
                              <p className="text-blue-700 font-mono">{pedido.numero_sinpe}</p>
                            </div>
                          )}
                          {pedido.comprobante_sinpe && (
                            <div className="bg-blue-50 p-2 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <FileText className="w-3 h-3 text-blue-600" />
                                <span className="font-medium text-blue-800">Comprobante:</span>
                              </div>
                              <p className="text-blue-700 truncate" title={pedido.comprobante_sinpe}>
                                {pedido.comprobante_sinpe}
                              </p>
                            </div>
                          )}
                          {pedido.efectivo_2_pagos && (
                            <div className="bg-orange-50 p-2 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <DollarSign className="w-3 h-3 text-orange-600" />
                                <span className="font-medium text-orange-800">Efectivo 2P:</span>
                              </div>
                              <p className="text-orange-700">{formatCurrency(parseFloat(pedido.efectivo_2_pagos) || 0)}</p>
                            </div>
                          )}
                          {pedido.sinpe_2_pagos && (
                            <div className="bg-orange-50 p-2 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <CreditCard className="w-3 h-3 text-orange-600" />
                                <span className="font-medium text-orange-800">SINPE 2P:</span>
                              </div>
                              <p className="text-orange-700">{formatCurrency(parseFloat(pedido.sinpe_2_pagos) || 0)}</p>
                            </div>
                          )}
                          {pedido.link_ubicacion && (
                            <div className="flex items-center gap-1">
                              <a 
                                href={pedido.link_ubicacion} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3" />
                                Ver ubicación
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewPedidoDetail(pedido)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        <Button
                          variant="outline"
                          size="sm"
                            onClick={() => handleEditPedido(pedido)}
                          disabled={updatingPedido === pedido.id_pedido}
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
                </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {hasServerSideFilters ? (
                  <>Mostrando página {currentPage} de {totalPages} ({totalPedidos} pedidos filtrados)</>
                ) : (
                  <>Mostrando página {currentPage} de {totalPages} ({totalPedidos} pedidos totales)</>
                )}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle>Editar Pedido</DialogTitle>
            </DialogHeader>
            
          {selectedPedido && (
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID del Pedido</Label>
                  <p className="font-semibold">{selectedPedido.id_pedido}</p>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <p className="font-semibold">{selectedPedido.cliente_nombre || 'Sin nombre'}</p>
                </div>
                </div>
                
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={editForm.estado} onValueChange={(value) => setEditForm(prev => ({ ...prev, estado: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_ruta">En Ruta</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                      <SelectItem value="devolucion">Devolución</SelectItem>
                      <SelectItem value="reagendado">Reagendado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mensajero">Mensajero</Label>
                  <Select value={editForm.mensajero} onValueChange={(value) => setEditForm(prev => ({ ...prev, mensajero: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mensajero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {mensajeros.map(mensajero => (
                        <SelectItem key={mensajero} value={mensajero}>{mensajero}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>
                
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">Fecha de Entrega</Label>
                  <Input
                    id="fecha"
                    type="datetime-local"
                    value={editForm.fecha}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fecha: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="metodo_pago">Método de Pago</Label>
                  <Select value={editForm.metodo_pago} onValueChange={(value) => setEditForm(prev => ({ ...prev, metodo_pago: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="sinpe">SINPE</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="2pagos">2 Pagos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={editForm.notas}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div>
                <Label htmlFor="nota_asesor">Nota del Asesor</Label>
                <Textarea
                  id="nota_asesor"
                  value={editForm.nota_asesor}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nota_asesor: e.target.value }))}
                  placeholder="Nota del asesor..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                  onClick={handleSaveEdit}
                  disabled={updatingPedido === selectedPedido.id_pedido}
                >
                  {updatingPedido === selectedPedido.id_pedido ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                      </>
                    ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      {/* Modal de Actualización Rápida de Estado */}
      <Dialog open={isStatusUpdateModalOpen} onOpenChange={setIsStatusUpdateModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="flex-shrink-0 p-6 pb-4">
              <DialogTitle>Actualizar Estado del Pedido</DialogTitle>
            </DialogHeader>
            {selectedPedidoForStatus && (
              <div className="flex-1 overflow-y-auto px-6 space-y-4 min-h-0">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Pedido: {selectedPedidoForStatus.id_pedido}</p>
                  <p className="text-sm text-gray-600">{selectedPedidoForStatus.cliente_nombre}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(selectedPedidoForStatus.valor_total)}</p>
                </div>
                
                <div className="space-y-3">
                  <Label>Nuevo Estado *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant={newStatus === 'entregado' ? 'default' : 'outline'}
                      onClick={() => setNewStatus('entregado')}
                      className={`h-12 text-sm font-medium ${
                        newStatus === 'entregado' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700'
                      }`}
                    >
                      ✅ Entregado
                    </Button>
                    <Button
                      variant={newStatus === 'devolucion' ? 'default' : 'outline'}
                      onClick={() => setNewStatus('devolucion')}
                      className={`h-12 text-sm font-medium ${
                        newStatus === 'devolucion' 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'border-red-200 hover:border-red-300 hover:bg-red-50 text-red-700'
                      }`}
                    >
                      ❌ Devolución
                    </Button>
                    <Button
                      variant={newStatus === 'reagendado' ? 'default' : 'outline'}
                      onClick={() => setNewStatus('reagendado')}
                      className={`h-12 text-sm font-medium ${
                        newStatus === 'reagendado' 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-700'
                      }`}
                    >
                      📅 Reagendado
                    </Button>
                  </div>
                  </div>

                {/* Sección de método de pago para entregado */}
                {newStatus === 'entregado' && (
                  <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold">Confirmar Método de Pago *</Label>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {selectedPedidoForStatus.metodo_pago === 'efectivo' ? '💵 Efectivo' :
                         selectedPedidoForStatus.metodo_pago === 'sinpe' ? '📱 SINPE' :
                         selectedPedidoForStatus.metodo_pago === 'tarjeta' ? '💳 Tarjeta' :
                         '🔄 Cambio'}
                      </Badge>
                  </div>
                    <p className="text-xs text-gray-600">
                      Confirma el método de pago que el cliente está utilizando para esta entrega
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button
                        variant={paymentMethod === 'efectivo' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('efectivo')}
                        className={`h-10 text-xs font-medium ${
                          paymentMethod === 'efectivo' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700'
                        }`}
                      >
                        💵 Efectivo
                      </Button>
                      <Button
                        variant={paymentMethod === 'sinpe' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('sinpe')}
                        className={`h-10 text-xs font-medium ${
                          paymentMethod === 'sinpe' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700'
                        }`}
                      >
                        📱 SINPE
                      </Button>
                      <Button
                        variant={paymentMethod === 'tarjeta' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('tarjeta')}
                        className={`h-10 text-xs font-medium ${
                          paymentMethod === 'tarjeta' 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700'
                        }`}
                      >
                        💳 Tarjeta
                      </Button>
                      <Button
                        variant={paymentMethod === '2pagos' ? 'default' : 'outline'}
                        onClick={() => {
                          setPaymentMethod('2pagos');
                          setIsDualPayment(true);
                        }}
                        className={`h-10 text-xs font-medium ${
                          paymentMethod === '2pagos' 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                            : 'border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-700'
                        }`}
                      >
                        🔄 2 Pagos
                      </Button>
                </div>
                
                    {/* Campos para 2 pagos */}
                    {isDualPayment && paymentMethod === '2pagos' && (
                      <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <Label className="text-sm font-semibold">Detalles de 2 Pagos</Label>
                        <div className="grid grid-cols-2 gap-3">
                <div>
                            <Label htmlFor="efectivo-amount" className="text-xs">Efectivo (₡)</Label>
                            <Input
                              id="efectivo-amount"
                              type="number"
                              value={dualPaymentAmounts.efectivo}
                              onChange={(e) => setDualPaymentAmounts(prev => ({ ...prev, efectivo: e.target.value }))}
                              placeholder="0"
                              className="h-8 text-xs"
                            />
                </div>
                  <div>
                            <Label htmlFor="sinpe-amount" className="text-xs">SINPE (₡)</Label>
                            <Input
                              id="sinpe-amount"
                              type="number"
                              value={dualPaymentAmounts.sinpe}
                              onChange={(e) => setDualPaymentAmounts(prev => ({ ...prev, sinpe: e.target.value }))}
                              placeholder="0"
                              className="h-8 text-xs"
                            />
                  </div>
                        </div>
                  </div>
                )}
                  </div>
                )}
                
                {/* Campo de notas */}
                <div className="space-y-2">
                  <Label htmlFor="status-notes">Notas del Estado (Opcional)</Label>
                  <Textarea
                    id="status-notes"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Añade notas sobre el cambio de estado..."
                    className="min-h-[80px] text-sm"
                  />
                  </div>
                  </div>
            )}
                
            <div className="flex-shrink-0 p-6 pt-4 border-t">
              <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                  onClick={() => setIsStatusUpdateModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || !newStatus}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Actualizar Estado
                    </>
                  )}
                  </Button>
                </div>
              </div>
          </div>
          </DialogContent>
        </Dialog>

      {/* Modal de Detalles del Pedido */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="flex-shrink-0 p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalles del Pedido #{selectedPedidoForDetail?.id_pedido}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6 pt-0">
              {selectedPedidoForDetail && (
                <div className="space-y-6">
                  {/* Información Principal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información Principal</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">ID Pedido:</span>
                          <span className="text-sm bg-blue-100 px-2 py-1 rounded">#{selectedPedidoForDetail.id_pedido}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Cliente:</span>
                          <span>{selectedPedidoForDetail.cliente_nombre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Valor:</span>
                          <span className="font-bold text-green-600">{formatCurrency(selectedPedidoForDetail.valor_total)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={getStatusForBadge(selectedPedidoForDetail)} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">Fecha Creación:</span>
                          <span>{new Date(selectedPedidoForDetail.fecha_creacion).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">Fecha Entrega:</span>
                          <span>{selectedPedidoForDetail.fecha_entrega ? new Date(selectedPedidoForDetail.fecha_entrega).toLocaleDateString() : 'No asignada'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium">Método Pago:</span>
                          <span className="capitalize">{selectedPedidoForDetail.metodo_pago}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Mensajero:</span>
                          <span>{selectedPedidoForDetail.mensajero_asignado || 'Sin asignar'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información de Ubicación */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ubicación y Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="font-medium">Dirección:</span>
                        </div>
                        <div className="ml-6 text-sm text-muted-foreground">
                          {selectedPedidoForDetail.direccion}
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">Distrito:</span>
                          <span>{selectedPedidoForDetail.distrito}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Teléfono:</span>
                          <span>{selectedPedidoForDetail.cliente_telefono}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Tienda:</span>
                          <span>{selectedPedidoForDetail.tienda}</span>
                        </div>
                        {selectedPedidoForDetail.link_ubicacion && (
                          <div className="flex items-center gap-2">
                            <MapIcon className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Mapa:</span>
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedPedidoForDetail.link_ubicacion} target="_blank" rel="noopener noreferrer">
                                Ver en Mapa
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información de Pago */}
                  {selectedPedidoForDetail.metodo_pago === '2pagos' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detalles de Pago Dual</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Efectivo:</span>
                            <span className="font-bold text-green-600">{formatCurrency(Number(selectedPedidoForDetail.efectivo_2_pagos || 0))}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">SINPE:</span>
                            <span className="font-bold text-blue-600">{formatCurrency(Number(selectedPedidoForDetail.sinpe_2_pagos || 0))}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Productos */}
                  {selectedPedidoForDetail.productos && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Productos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <pre className="text-sm whitespace-pre-wrap">{selectedPedidoForDetail.productos}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notas */}
                  {(selectedPedidoForDetail.nota_asesor || selectedPedidoForDetail.notas) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Notas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedPedidoForDetail.nota_asesor && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Nota del Asesor:</h4>
                            <div className="bg-blue-50 p-3 rounded-md">
                              <p className="text-sm">{selectedPedidoForDetail.nota_asesor}</p>
                            </div>
                          </div>
                        )}
                        {selectedPedidoForDetail.notas && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Notas Generales:</h4>
                            <div className="bg-green-50 p-3 rounded-md">
                              <p className="text-sm">{selectedPedidoForDetail.notas}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Información del Mensajero */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información del Mensajero</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Asignado:</span>
                          <span>{selectedPedidoForDetail.mensajero_asignado || 'Sin asignar'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Concretado:</span>
                          <span>{selectedPedidoForDetail.mensajero_concretado || 'Sin concretar'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">Jornada:</span>
                          <span>{selectedPedidoForDetail.jornada_ruta || 'No especificada'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0 p-6 pt-4 border-t">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                {selectedPedidoForDetail && (
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleQuickStatusUpdate(selectedPedidoForDetail);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Actualizar Estado
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}