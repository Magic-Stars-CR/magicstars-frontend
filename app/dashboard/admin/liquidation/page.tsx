'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { mockApi } from '@/lib/mock-api';
import { RouteLiquidation, RouteLiquidationStats, RouteLiquidationFilters, PedidoTest, TiendaLiquidationCalculation } from '@/lib/types';
import { getLiquidacionesReales, getMensajerosUnicos, debugTablaPedidos, debugFechasConDatos, getLiquidacionesRealesByTienda } from '@/lib/supabase-pedidos';
import { supabasePedidos } from '@/lib/supabase-pedidos';
import { ProgressLoader, useProgressLoader } from '@/components/ui/progress-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Loader2,
  Building2,
  Calculator,
  Edit3,
  Save,
  X,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Fuel,
  Wrench,
  Car,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LiquidationCalculation {
  messengerId: string;
  messengerName: string;
  routeDate: string;
  initialAmount: number; // Plata entregada en la mañana
  totalCollected: number; // Total recaudado
  totalSpent: number; // Gastos del mensajero
  sinpePayments: number; // Pagos en SINPE
  cashPayments: number; // Pagos en efectivo
  tarjetaPayments: number; // Pagos en tarjeta
  finalAmount: number; // Monto final a entregar
  orders: PedidoTest[];
  isLiquidated: boolean;
  canEdit: boolean;
}

export default function AdminLiquidationPage() {
  const { user } = useAuth();
  const [liquidations, setLiquidations] = useState<RouteLiquidation[]>([]);
  const [stats, setStats] = useState<RouteLiquidationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [filters, setFilters] = useState<RouteLiquidationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [liquidating, setLiquidating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Estados para el módulo de liquidación mejorado
  const [calculations, setCalculations] = useState<LiquidationCalculation[]>([]);
  const [tiendaCalculations, setTiendaCalculations] = useState<TiendaLiquidationCalculation[]>([]);
  const [activeTab, setActiveTab] = useState<'mensajeros' | 'tiendas'>('mensajeros');
  
  // Estados para filtros y paginación de tiendas
  const [tiendaStatusFilter, setTiendaStatusFilter] = useState<string>('TODOS');
  const [tiendaCurrentPage, setTiendaCurrentPage] = useState<{ [key: string]: number }>({});
  
  
  // Estados para el loader de progreso
  const { isVisible, steps, currentStep, overallProgress, startLoader, updateStep, setStepStatus, closeLoader } = useProgressLoader();
  
  // Estados para modales y formularios
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationCalculation | null>(null);
  const [showRouteDetailModal, setShowRouteDetailModal] = useState(false);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<LiquidationCalculation | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedOrderNotes, setSelectedOrderNotes] = useState<PedidoTest | null>(null);
  const [showViewAndLiquidateModal, setShowViewAndLiquidateModal] = useState(false);
  const [selectedViewAndLiquidate, setSelectedViewAndLiquidate] = useState<LiquidationCalculation | null>(null);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<any>(null);
  
  // Estados para modales adicionales
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  const [showSinpeModal, setShowSinpeModal] = useState(false);
  const [showTarjetaModal, setShowTarjetaModal] = useState(false);
  
  // Estados para datos de modales
  const [selectedPendingOrders, setSelectedPendingOrders] = useState<{
    mensajero: string;
    pedidos: PedidoTest[];
  } | null>(null);
  
  const [selectedSinpeOrders, setSelectedSinpeOrders] = useState<PedidoTest[]>([]);
  const [selectedTarjetaOrders, setSelectedTarjetaOrders] = useState<PedidoTest[]>([]);
  
  // Estados para modal de cambio de estado
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState<PedidoTest | null>(null);
  const [newStatus, setNewStatus] = useState<string>('ENTREGADO');
  const [statusComment, setStatusComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  
  // Estados para fecha de reagendación
  const [fechaReagendacion, setFechaReagendacion] = useState('');
  
  // Estados para detalles de pedidos
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<PedidoTest | null>(null);
  
  // Estados para liquidación
  const [liquidatingRoute, setLiquidatingRoute] = useState<string | null>(null);
  const [isLiquidationCompleted, setIsLiquidationCompleted] = useState(false);
  const [initialAmountInput, setInitialAmountInput] = useState<number>(0);
  
  // Estados para filtros de pedidos
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');
  
  // Estados para fecha y restricciones
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isEditingRestricted, setIsEditingRestricted] = useState(false);
  
  // Estados para filtro de rango de fechas de tiendas
  const [tiendaFechaInicio, setTiendaFechaInicio] = useState<string>('');
  const [tiendaFechaFin, setTiendaFechaFin] = useState<string>('');
  const [usarRangoFechas, setUsarRangoFechas] = useState(false);
  const [loadingRangoFechas, setLoadingRangoFechas] = useState(false);

  // Inicializar fecha al cargar el componente
  useEffect(() => {
    const initializeDate = async () => {
      if (!selectedDate) {
        const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
        const costaRicaDate = getCostaRicaDateISO();
        setSelectedDate(costaRicaDate);
        console.log('📅 Fecha inicializada para Costa Rica:', costaRicaDate);
        return;
      }
    }

    initializeDate();
  }, []);

  // Recargar datos cuando cambie la fecha
  useEffect(() => {
    if (selectedDate) {
      console.log('📅 Fecha cambiada, recargando datos:', selectedDate);
      loadData();
      loadCalculations();
      loadTiendaCalculations();
    }
  }, [selectedDate]);

  // Recargar tiendas cuando cambien las fechas del rango
  useEffect(() => {
    if (usarRangoFechas && tiendaFechaInicio && tiendaFechaFin) {
      console.log('📅 Rango de fechas de tiendas cambiado, recargando:', tiendaFechaInicio, 'a', tiendaFechaFin);
      loadTiendaCalculations();
    }
  }, [tiendaFechaInicio, tiendaFechaFin, usarRangoFechas]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [liquidationsData, statsData] = await Promise.all([
        mockApi.getRouteLiquidations(filters),
        mockApi.getRouteLiquidationStats(),
      ]);
      setLiquidations(liquidationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalculations = async (isReload = false) => {
    try {
      console.log('🚀 Iniciando loadCalculations para fecha:', selectedDate, isReload ? '(recarga)' : '');
      
      setIsLoadingData(true);
      
      // Iniciar loader solo si no es una recarga
      if (!isReload) {
        startLoader('Procesando Liquidaciones', [
          { id: 'mensajeros', label: 'Obteniendo mensajeros únicos', status: 'pending' },
          { id: 'pedidos', label: 'Cargando pedidos del día', status: 'pending' },
          { id: 'calculations', label: 'Calculando liquidaciones', status: 'pending' },
          { id: 'finalization', label: 'Finalizando proceso', status: 'pending' }
        ]);
      }
      
      // Paso 1: Obtener liquidaciones reales
      if (!isReload) {
        updateStep('mensajeros', { status: 'loading' });
      }
      
      let fechaParaUsar = selectedDate;
      if (!fechaParaUsar) {
        const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
        fechaParaUsar = getCostaRicaDateISO();
        console.log('📅 Usando fecha de Costa Rica por defecto:', fechaParaUsar);
      }
      
      const liquidacionesReales = await getLiquidacionesReales(fechaParaUsar);
      console.log('✅ Liquidaciones reales obtenidas:', liquidacionesReales.length);
      
      if (liquidacionesReales.length > 0) {
        console.log('📋 Primeros 3 pedidos de ejemplo:');
        liquidacionesReales[0].pedidos.slice(0, 3).forEach((pedido, index) => {
          console.log(`  ${index + 1}. ID: ${pedido.id_pedido}, Fecha: ${pedido.fecha_creacion}`);
        });
      }
      
      // Log básico de liquidaciones cargadas
      console.log(`✅ Liquidaciones cargadas: ${liquidacionesReales.length} mensajeros`);
      
      // Paso 2: Procesar pedidos
      if (!isReload) {
        updateStep('mensajeros', { status: 'completed' });
        updateStep('pedidos', { status: 'loading' });
      }
      
      // Convertir a formato LiquidationCalculation
      const calculationsData: LiquidationCalculation[] = liquidacionesReales.map(liquidacion => ({
        messengerId: liquidacion.mensajero,
        messengerName: liquidacion.mensajero,
        routeDate: selectedDate,
        initialAmount: 0, // Se puede editar después
        totalCollected: liquidacion.totalCollected || 0,
        totalSpent: liquidacion.totalSpent || 0,
        sinpePayments: liquidacion.sinpePayments || 0,
        cashPayments: liquidacion.cashPayments || 0,
        tarjetaPayments: liquidacion.tarjetaPayments || 0,
        finalAmount: (liquidacion.totalCollected || 0) - (liquidacion.totalSpent || 0),
        orders: liquidacion.pedidos || [],
        isLiquidated: liquidacion.isLiquidated || false,
        canEdit: !liquidacion.isLiquidated
      }));
      
      // Paso 3: Finalizar cálculos
      if (!isReload) {
        updateStep('pedidos', { status: 'completed' });
        updateStep('calculations', { status: 'loading' });
      }
      
      setCalculations(calculationsData);
      
      // Paso 4: Finalización
      if (!isReload) {
        updateStep('calculations', { status: 'completed' });
        updateStep('finalization', { status: 'loading' });
      }
      
      // Simular un pequeño delay para mostrar el progreso
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isReload) {
        updateStep('finalization', { status: 'completed' });
        
        // Cerrar el loader automáticamente después de un pequeño delay
        setTimeout(() => {
          closeLoader();
        }, 1000);
      }
      
      setIsLoadingData(false);
      
      if (isReload) {
        console.log('✅ Datos actualizados correctamente');
      }
      
    } catch (error) {
      console.error('❌ Error en loadCalculations:', error);
      setIsLoadingData(false);
      setCalculations([]);
      
      // Cerrar el loader en caso de error
      if (!isReload) {
        closeLoader();
      }
    }
  };

  const loadTiendaCalculations = async () => {
    try {
      console.log('🚀 Iniciando loadTiendaCalculations para fecha:', selectedDate);
      
      let liquidacionesReales = [];
      
      // Si está habilitado el rango de fechas para tiendas, obtener datos del rango
      if (usarRangoFechas && tiendaFechaInicio && tiendaFechaFin) {
        console.log('📅 Usando rango de fechas para tiendas:', tiendaFechaInicio, 'a', tiendaFechaFin);
        setLoadingRangoFechas(true);
        
        // Obtener datos de cada fecha en el rango y consolidarlos
        const fechas: string[] = [];
        const fechaInicio = new Date(tiendaFechaInicio + 'T00:00:00');
        const fechaFin = new Date(tiendaFechaFin + 'T23:59:59');
        
        for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha = new Date(fecha.getTime() + 24 * 60 * 60 * 1000)) {
          fechas.push(fecha.toISOString().split('T')[0]);
        }
        
        console.log('📅 Fechas a procesar:', fechas);
        
        // Obtener datos de cada fecha
        const promesasFechas = fechas.map(fecha => getLiquidacionesRealesByTienda(fecha));
        const resultadosFechas = await Promise.all(promesasFechas);
        
        // Consolidar datos por tienda
        const tiendasConsolidadas = new Map();
        
        resultadosFechas.forEach((liquidacionesFecha, index) => {
          liquidacionesFecha.forEach(liquidacion => {
            // Validar y limpiar datos
            const tiendaKey = typeof liquidacion.tienda === 'string' ? liquidacion.tienda.trim() : String(liquidacion.tienda || '').trim();
            
            if (!tiendaKey) {
              console.warn('⚠️ Liquidación sin tienda válida:', liquidacion);
              return;
            }
            
            if (tiendasConsolidadas.has(tiendaKey)) {
              const existente = tiendasConsolidadas.get(tiendaKey);
              existente.totalOrders += Number(liquidacion.orders?.length || 0);
              existente.totalValue += Number(liquidacion.totalValue || 0);
              existente.totalCollected += Number(liquidacion.totalCollected || 0);
              existente.sinpePayments += Number(liquidacion.sinpePayments || 0);
              existente.cashPayments += Number(liquidacion.cashPayments || 0);
              existente.tarjetaPayments += Number(liquidacion.tarjetaPayments || 0);
              existente.totalSpent += Number(liquidacion.totalSpent || 0);
              existente.finalAmount += Number(liquidacion.finalAmount || 0);
              existente.deliveredOrders += Number(liquidacion.deliveredOrders || 0);
              existente.pendingOrders += Number(liquidacion.pendingOrders || 0);
              existente.returnedOrders += Number(liquidacion.returnedOrders || 0);
              existente.rescheduledOrders += Number(liquidacion.rescheduledOrders || 0);
              existente.orders = [...existente.orders, ...(liquidacion.orders || [])];
            } else {
              // Mapear el tipo de la función al tipo esperado
              tiendasConsolidadas.set(tiendaKey, {
                tienda: tiendaKey,
                routeDate: fechas[index] || '',
                totalOrders: Number(liquidacion.orders?.length || 0),
                totalValue: Number(liquidacion.totalValue || 0),
                totalCollected: Number(liquidacion.totalCollected || 0),
                totalSpent: Number(liquidacion.totalSpent || 0),
                sinpePayments: Number(liquidacion.sinpePayments || 0),
                cashPayments: Number(liquidacion.cashPayments || 0),
                tarjetaPayments: Number(liquidacion.tarjetaPayments || 0),
                finalAmount: Number(liquidacion.finalAmount || 0),
                orders: liquidacion.orders || [],
                isLiquidated: false,
                canEdit: true,
                deliveredOrders: Number(liquidacion.deliveredOrders || 0),
                pendingOrders: Number(liquidacion.pendingOrders || 0),
                returnedOrders: Number(liquidacion.returnedOrders || 0),
                rescheduledOrders: Number(liquidacion.rescheduledOrders || 0),
                averageOrderValue: Number(liquidacion.averageOrderValue || 0),
                topMessenger: String(liquidacion.topMessenger || ''),
                topDistrict: String(liquidacion.topDistrict || ''),
                gastos: liquidacion.gastos || []
              });
            }
          });
        });
        
        liquidacionesReales = Array.from(tiendasConsolidadas.values());
        
      } else {
        // Usar fecha simple
        let fechaParaUsar = selectedDate;
        if (!fechaParaUsar) {
          const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
          fechaParaUsar = getCostaRicaDateISO();
          console.log('📅 Usando fecha de Costa Rica por defecto:', fechaParaUsar);
        }
        
        liquidacionesReales = await getLiquidacionesRealesByTienda(fechaParaUsar);
      }
      
      console.log('✅ Liquidaciones por tienda obtenidas:', liquidacionesReales.length);
      console.log('📊 Datos de liquidaciones por tienda:', liquidacionesReales);
      
      setTiendaCalculations(liquidacionesReales as unknown as TiendaLiquidationCalculation[]);
      
    } catch (error) {
      console.error('❌ Error en loadTiendaCalculations:', error);
      setTiendaCalculations([]);
    } finally {
      setLoadingRangoFechas(false);
    }
  };

  const handleViewExpenses = async (calculation: LiquidationCalculation | TiendaLiquidationCalculation) => {
    try {
      const { getGastosMensajeros } = await import('@/lib/supabase-pedidos');
      const gastosData = await getGastosMensajeros(calculation.routeDate);
      
      const nombre = 'messengerName' in calculation ? calculation.messengerName : calculation.tienda;
      const gastosDelMensajero = gastosData.find(g => g.mensajero === nombre);
      
      setSelectedExpenses({
        mensajero: nombre,
        gastos: gastosDelMensajero?.gastos || []
      });
      setShowExpensesModal(true);
    } catch (error) {
      console.error('Error obteniendo gastos:', error);
      const nombre = 'messengerName' in calculation ? calculation.messengerName : calculation.tienda;
      setSelectedExpenses({
        mensajero: nombre,
        gastos: []
      });
      setShowExpensesModal(true);
    }
  };

  const handleViewPendingOrders = (calculation: LiquidationCalculation | TiendaLiquidationCalculation) => {
    const pendingOrders = calculation.orders.filter(pedido => 
      pedido.estado_pedido !== 'ENTREGADO'
    );
    
    const nombre = 'messengerName' in calculation ? calculation.messengerName : calculation.tienda;
    setSelectedPendingOrders({
      mensajero: nombre,
      pedidos: pendingOrders
    });
    setShowPendingOrdersModal(true);
  };

  const handleViewSinpeOrders = (calculation: LiquidationCalculation | TiendaLiquidationCalculation) => {
    const sinpeOrders = calculation.orders.filter(pedido => 
      pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'SINPE'
    );
    setSelectedSinpeOrders(sinpeOrders);
    setShowSinpeModal(true);
  };

  const handleViewTarjetaOrders = (calculation: LiquidationCalculation | TiendaLiquidationCalculation) => {
    const tarjetaOrders = calculation.orders.filter(pedido => 
      pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'TARJETA'
    );
    setSelectedTarjetaOrders(tarjetaOrders);
    setShowTarjetaModal(true);
  };

  const handleEditOrderStatus = (pedido: PedidoTest) => {
    setSelectedOrderForUpdate(pedido);
    setNewStatus(pedido.estado_pedido || 'ENTREGADO');
    setStatusComment('');
    setPaymentMethod(pedido.metodo_pago || 'efectivo');
    setIsUpdateStatusModalOpen(true);
  };

  const handleViewPedidoComprobante = (pedido: PedidoTest) => {
    // Función para ver comprobantes de pedidos
    if (pedido.metodo_pago === 'SINPE') {
      // Usar la URL del comprobante SINPE del pedido
      if (pedido.comprobante_sinpe) {
        window.open(pedido.comprobante_sinpe, '_blank');
      } else {
        alert(`No hay comprobante SINPE disponible para el pedido ${pedido.id_pedido}`);
      }
    } else if (pedido.metodo_pago === 'TARJETA') {
      // Para tarjeta, usar la URL del comprobante si existe
      if (pedido.comprobante_sinpe) {
        window.open(pedido.comprobante_sinpe, '_blank');
      } else {
        alert(`No hay comprobante de tarjeta disponible para el pedido ${pedido.id_pedido}`);
      }
    } else {
      alert(`Ver comprobante del pedido ${pedido.id_pedido}`);
    }
  };


  const calculateLiquidation = (calculation: LiquidationCalculation): LiquidationCalculation => {
    const totalCollected = calculation.orders.reduce((sum, order) => {
      if (order.estado_pedido === 'ENTREGADO') {
        return sum + order.valor_total;
      }
      return sum;
    }, 0);

    const sinpePayments = calculation.orders.reduce((sum, order) => {
      if (order.estado_pedido === 'ENTREGADO' && order.metodo_pago === 'SINPE') {
        return sum + order.valor_total;
      }
      return sum;
    }, 0);

    const cashPayments = calculation.orders.reduce((sum, order) => {
      if (order.estado_pedido === 'ENTREGADO' && order.metodo_pago === 'EFECTIVO') {
        return sum + order.valor_total;
      }
      return sum;
    }, 0);

    const tarjetaPayments = calculation.orders.reduce((sum, order) => {
      if (order.estado_pedido === 'ENTREGADO' && order.metodo_pago === 'TARJETA') {
        return sum + order.valor_total;
      }
      return sum;
    }, 0);

    return {
      ...calculation,
      totalCollected,
      sinpePayments,
      cashPayments,
      tarjetaPayments,
      finalAmount: calculation.initialAmount + cashPayments - calculation.totalSpent
    };
  };

  const handleLiquidateRoute = async (liquidationId: string) => {
    try {
      setLiquidating(liquidationId);
      await mockApi.liquidateRoute(liquidationId, adminNotes);
      setAdminNotes('');
      await loadData();
    } catch (error) {
      console.error('Error liquidating route:', error);
      alert('Error al liquidar la ruta: ' + (error as Error).message);
    } finally {
      setLiquidating(null);
    }
  };

  const handleEditInitialAmount = (messengerId: string, currentAmount: number) => {
    const newAmount = prompt('Ingrese el monto inicial:', currentAmount.toString());
    if (newAmount === null) return;
    
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    setCalculations(prev => 
      prev.map(calc => 
        calc.messengerId === messengerId 
          ? { ...calc, initialAmount: amount }
          : calc
      )
    );
  };

  const handleViewAndLiquidate = async (calculation: LiquidationCalculation) => {
    // Abrir modal inmediatamente para mejor UX
    setSelectedViewAndLiquidate(calculation);
    setShowViewAndLiquidateModal(true);
    
    // Verificar estado de liquidación en background
    try {
      const { checkLiquidationStatus } = await import('@/lib/supabase-pedidos');
      const fechaParaVerificar = selectedDate || calculation.routeDate;
      const isCompleted = await checkLiquidationStatus(calculation.messengerName, fechaParaVerificar);
      setIsLiquidationCompleted(isCompleted);
      
      if (isCompleted) {
        setCalculations(prev => 
          prev.map(calc => 
            calc.messengerId === calculation.messengerId 
              ? { ...calc, isLiquidated: true }
              : calc
          )
        );
      }
      
      console.log(`🔍 Liquidación para ${calculation.messengerName} en ${fechaParaVerificar}: ${isCompleted ? 'COMPLETADA' : 'PENDIENTE'}`);
    } catch (error) {
      console.error('❌ Error verificando estado de liquidación:', error);
      setIsLiquidationCompleted(false);
    }
  };

  const handleViewTiendaLiquidation = async (tiendaCalculation: TiendaLiquidationCalculation) => {
    try {
      console.log('🏪 Datos originales de la tienda:', tiendaCalculation);
      console.log('📦 Pedidos de la tienda:', tiendaCalculation.orders?.length || 0);
      console.log('📦 Pedidos detalle:', tiendaCalculation.orders);
      
      // Convertir TiendaLiquidationCalculation a LiquidationCalculation para el modal
      const calculation: LiquidationCalculation = {
        messengerId: tiendaCalculation.tienda,
        messengerName: tiendaCalculation.tienda,
        routeDate: selectedDate,
        initialAmount: 0,
        totalCollected: tiendaCalculation.totalCollected,
        totalSpent: tiendaCalculation.totalSpent || 0,
        cashPayments: tiendaCalculation.cashPayments,
        sinpePayments: tiendaCalculation.sinpePayments,
        tarjetaPayments: tiendaCalculation.tarjetaPayments || 0,
        finalAmount: tiendaCalculation.totalCollected - (tiendaCalculation.totalSpent || 0),
        orders: tiendaCalculation.orders || [],
        isLiquidated: false,
        canEdit: true
      };

      console.log('🔄 Cálculo convertido para el modal:', calculation);
      console.log('📦 Pedidos en el cálculo:', calculation.orders?.length || 0);

      setSelectedViewAndLiquidate(calculation);
      setShowViewAndLiquidateModal(true);
      
      console.log(`🔍 Liquidación para tienda ${tiendaCalculation.tienda}:`, calculation);
    } catch (error) {
      console.error('❌ Error abriendo liquidación de tienda:', error);
    }
  };


  const confirmLiquidation = async (calculation: LiquidationCalculation, initialAmount?: number) => {
    try {
      const fechaParaEnviar = selectedDate || calculation.routeDate;
      const plataInicial = initialAmount || 0;
      const montoFinal = plataInicial + calculation.cashPayments - calculation.totalSpent;
      
      const liquidationData = {
        mensajero: calculation.messengerName,
        fecha: fechaParaEnviar,
        plata_inicial: plataInicial,
        total_recaudado: calculation.totalCollected,
        total_gastos: calculation.totalSpent,
        monto_final: montoFinal,
        pedidos_entregados: calculation.orders.filter(o => o.estado_pedido === 'ENTREGADO').length,
        pedidos_total: calculation.orders.length,
        pagos_efectivo: calculation.cashPayments,
        pagos_sinpe: calculation.sinpePayments,
        pagos_tarjeta: calculation.tarjetaPayments
      };

      const response = await fetch("https://primary-production-2b25b.up.railway.app/webhook/liquidacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(liquidationData)
      });

      if (!response.ok) {
        throw new Error(`Error al enviar liquidación: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Liquidación enviada exitosamente:', responseData);
      
      setCalculations(prev => 
        prev.map(calc => 
          calc.messengerId === calculation.messengerId 
            ? { ...calc, isLiquidated: true }
            : calc
        )
      );
      
      setShowViewAndLiquidateModal(false);
      setSelectedViewAndLiquidate(null);
      alert(`Liquidación de ${calculation.messengerName} confirmada exitosamente`);
      
    } catch (error) {
      console.error('Error confirming liquidation:', error);
      alert('Error al confirmar la liquidación: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrderForUpdate || !newStatus) return;
    
    try {
      setUpdatingOrder(selectedOrderForUpdate.id_pedido);
      
      const webhookData = {
        idPedido: selectedOrderForUpdate.id_pedido,
        mensajero: selectedOrderForUpdate.mensajero_concretado || selectedOrderForUpdate.mensajero_asignado || 'SIN_ASIGNAR',
        usuario: user?.name || 'Admin',
        estadoPedido: newStatus === 'REAGENDADO' ? 'REAGENDO' : newStatus,
        metodoPago: newStatus === 'DEVOLUCION' || newStatus === 'REAGENDADO' ? null : paymentMethod,
        nota: statusComment || '',
        clienteNombre: selectedOrderForUpdate.cliente_nombre,
        clienteTelefono: selectedOrderForUpdate.cliente_telefono || '',
        direccion: selectedOrderForUpdate.direccion || '',
        provincia: selectedOrderForUpdate.provincia || '',
        canton: selectedOrderForUpdate.canton || '',
        distrito: selectedOrderForUpdate.distrito || '',
        valorTotal: selectedOrderForUpdate.valor_total,
        productos: selectedOrderForUpdate.productos || 'No especificados',
        tienda: selectedOrderForUpdate.tienda || 'ALL STARS'
      };

      console.log('🔄 Actualizando estado del pedido:', webhookData);

      const response = await fetch("https://primary-production-2b25b.up.railway.app/webhook/actualizar-pedido", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(webhookData)
      });

      const resultado = await response.json();
      console.log("📡 Respuesta del webhook:", resultado);

      if (response.ok) {
        await loadTiendaCalculations();
        await loadCalculations(true);
        
        // Mostrar mensaje de éxito antes de resetear
        alert(`Pedido ${selectedOrderForUpdate.id_pedido} actualizado a ${newStatus} exitosamente`);
        
        // Cerrar modal y resetear estado
        setIsUpdateStatusModalOpen(false);
        setSelectedOrderForUpdate(null);
        setNewStatus('ENTREGADO');
        setStatusComment('');
        setPaymentMethod('efectivo');
      } else {
        throw new Error(resultado.message || 'Error al actualizar el pedido');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el pedido: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isLiquidated: boolean) => {
    if (isLiquidated) {
      return <Badge className="bg-green-100 text-green-800">Liquidado</Badge>;
    }
    return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pendiente</Badge>;
  };

  const filteredLiquidations = liquidations.filter(liquidation => {
    const matchesSearch = 
      liquidation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liquidation.messenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liquidation.routeDate.includes(searchTerm);
    
    return matchesSearch;
  });

  // Función para obtener datos de tiendas agrupadas para la tabla
  const getTiendaTableData = () => {
    return tiendaCalculations.map(tienda => ({
      id: tienda.tienda,
      name: tienda.tienda,
      totalOrders: tienda.totalOrders,
      totalCollected: tienda.totalCollected,
      cashPayments: tienda.cashPayments,
      sinpePayments: tienda.sinpePayments,
      tarjetaPayments: tienda.tarjetaPayments,
      deliveredOrders: tienda.deliveredOrders,
      pendingOrders: tienda.pendingOrders,
      returnedOrders: tienda.returnedOrders,
      rescheduledOrders: tienda.rescheduledOrders,
      averageOrderValue: tienda.averageOrderValue,
      orders: tienda.orders || []
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Cargando liquidaciones de Supabase...</p>
        <div className="text-sm text-gray-500">
          Obteniendo datos de mensajeros y pedidos reales
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Liquidación</h1>
          <p className="text-gray-600">Calcula la liquidación diaria de cada mensajero</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoadingData && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando datos...</span>
            </div>
          )}
          
          {/* Filtro de fecha simple */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
              disabled={isLoadingData}
            />
            <Button 
              variant="outline"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);
              }}
              disabled={isLoadingData}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Hoy
            </Button>
          </div>

          {/* Filtro de rango de fechas para tiendas */}
          {activeTab === 'tiendas' && (
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Rango:</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarRangoFechas}
                    onChange={(e) => setUsarRangoFechas(e.target.checked)}
                    className="sr-only peer"
                    disabled={loadingRangoFechas}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
              
              {usarRangoFechas && (
                <div className="flex items-center gap-2">
                  {loadingRangoFechas && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cargando rango...</span>
                    </div>
                  )}
                  <Input
                    type="date"
                    value={tiendaFechaInicio}
                    onChange={(e) => setTiendaFechaInicio(e.target.value)}
                    className="w-36"
                    placeholder="Desde"
                    disabled={loadingRangoFechas}
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    type="date"
                    value={tiendaFechaFin}
                    onChange={(e) => setTiendaFechaFin(e.target.value)}
                    className="w-36"
                    placeholder="Hasta"
                    disabled={loadingRangoFechas}
                  />
                </div>
              )}
            </div>
          )}
          
          <Button asChild>
            <Link href="/dashboard/admin">
              <Truck className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Alert de restricción de edición */}
      {isEditingRestricted && (
        <Alert className="border-orange-200 bg-orange-50">
          <Lock className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Edición restringida:</strong> Los pedidos no pueden ser editados una vez que el día ha sido liquidado o ha pasado al día siguiente.
          </AlertDescription>
        </Alert>
      )}

      {/* Sistema de Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'mensajeros' | 'tiendas')} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mensajeros" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Liquidaciones de Mensajeros
          </TabsTrigger>
          <TabsTrigger value="tiendas" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Liquidaciones por Tienda
          </TabsTrigger>
        </TabsList>

        {/* Tab de Mensajeros */}
        <TabsContent value="mensajeros" className="space-y-6">
          {/* Stats Cards para Mensajeros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Primera fila: Mensajeros con Pedidos, Pendientes por Liquidar, Pedidos Totales del Día, Contador de Estados */}
            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Mensajeros con Pedidos</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">{calculations.length}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Pendientes por Liquidar</p>
                      <p className="text-lg font-bold text-yellow-900 mt-1">
                        {calculations.filter(c => !c.isLiquidated).length}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Pedidos Totales del Día (Asignados)</p>
                      <p className="text-lg font-bold text-orange-900 mt-1">
                        {calculations.reduce((sum, c) => sum + c.orders.length, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Estados</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-700">
                            {calculations.reduce((sum, c) => sum + c.orders.filter(o => o.estado_pedido === 'ENTREGADO').length, 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-yellow-700">
                            {calculations.reduce((sum, c) => sum + c.orders.filter(o => o.estado_pedido === 'PENDIENTE').length, 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-xs text-red-700">
                            {calculations.reduce((sum, c) => sum + c.orders.filter(o => o.estado_pedido === 'DEVOLUCION').length, 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-blue-700">
                            {calculations.reduce((sum, c) => sum + c.orders.filter(o => o.estado_pedido === 'REAGENDADO').length, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            {/* Segunda fila: Total Recaudado, Total a Entregar, Total Efectivo, SINPE, Tarjeta, Otros */}
            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Total Recaudado</p>
                      <p className="text-xs text-green-600">(todos los medios)</p>
                      <p className="text-lg font-bold text-green-900 mt-1">
                        {formatCurrency(calculations.reduce((sum, c) => {
                          const calculated = calculateLiquidation(c);
                          return sum + calculated.totalCollected;
                        }, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Total a Entregar</p>
                      <p className="text-xs text-purple-600">(efectivo - gastos)</p>
                      <p className="text-lg font-bold text-purple-900 mt-1">
                        {formatCurrency(calculations.reduce((sum, c) => {
                          const calculated = calculateLiquidation(c);
                          return sum + (calculated.cashPayments - calculated.totalSpent);
                        }, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Banknote className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Total Efectivo</p>
                      <p className="text-lg font-bold text-green-900 mt-1">
                        {formatCurrency(calculations.reduce((sum, c) => {
                          const calculated = calculateLiquidation(c);
                          return sum + calculated.cashPayments;
                        }, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-cyan-50 to-cyan-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">SINPE</p>
                      <p className="text-lg font-bold text-cyan-900 mt-1">
                        {formatCurrency(calculations.reduce((sum, c) => {
                          const calculated = calculateLiquidation(c);
                          return sum + calculated.sinpePayments;
                        }, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-pink-50 to-pink-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Tarjeta</p>
                      <p className="text-lg font-bold text-pink-900 mt-1">
                        {formatCurrency(calculations.reduce((sum, c) => {
                          const calculated = calculateLiquidation(c);
                          return sum + calculated.tarjetaPayments;
                        }, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Otros Métodos</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">₡0</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Liquidaciones de Mensajeros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Liquidaciones por Ruta - {selectedDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mensajero</TableHead>
                    <TableHead>Pedidos por Estado</TableHead>
                    <TableHead>Total Recaudado</TableHead>
                    <TableHead>SINPE</TableHead>
                    <TableHead>Efectivo</TableHead>
                    <TableHead>Gastos</TableHead>
                    <TableHead>Monto Final</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-8 h-8 text-gray-400" />
                          <p className="text-gray-500">
                            No se encontraron mensajeros con pedidos asignados para la fecha {selectedDate}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    calculations.map((calculation) => {
                      const calculated = calculateLiquidation(calculation);
                      return (
                        <TableRow key={calculation.messengerId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <span className="font-medium">{calculation.messengerName}</span>
                                <div className="text-xs text-muted-foreground">
                                  {calculated.orders.length} pedidos
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                const statusCounts: Record<string, { count: number; color: string; label: string }> = {
                                  ENTREGADO: { count: 0, color: 'bg-green-500', label: 'Entregado' },
                                  PENDIENTE: { count: 0, color: 'bg-yellow-500', label: 'Pendiente' },
                                  DEVUELTO: { count: 0, color: 'bg-red-500', label: 'Devuelto' },
                                  DEVOLUCION: { count: 0, color: 'bg-orange-500', label: 'Devolución' },
                                  REAGENDADO: { count: 0, color: 'bg-blue-500', label: 'Reagendado' },
                                  CANCELADO: { count: 0, color: 'bg-gray-500', label: 'Cancelado' }
                                };
                                
                                calculated.orders.forEach(order => {
                                  const status = order.estado_pedido;
                                  if (status && statusCounts[status]) {
                                    statusCounts[status].count++;
                                  }
                                });
                                
                                return Object.entries(statusCounts)
                                  .filter(([_, data]) => data.count > 0)
                                  .map(([status, data]) => (
                                    <div key={status} className="flex items-center gap-1">
                                      <div className={`w-3 h-3 rounded-full ${data.color}`}></div>
                                      <span className="text-xs font-medium">{data.count}</span>
                                      <span className="text-xs text-muted-foreground">{data.label}</span>
                                    </div>
                                  ));
                              })()}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-600">
                                {formatCurrency(calculated.totalCollected)}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-600">
                                {formatCurrency(calculated.sinpePayments)}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Banknote className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-600">
                                {formatCurrency(calculated.cashPayments)}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-red-600" />
                              <span className="font-medium text-red-600">
                                {formatCurrency(calculated.totalSpent)}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-600">
                                {formatCurrency(calculated.finalAmount)}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewAndLiquidate(calculated)}
                                className={`h-8 ${calculated.isLiquidated 
                                  ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                                {calculated.isLiquidated && (
                                  <span className="ml-1 px-1 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                    ✓
                                  </span>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Tiendas */}
        <TabsContent value="tiendas" className="space-y-6">
          {/* Loader para rango de fechas */}
          {loadingRangoFechas && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-lg font-medium">Cargando datos del rango de fechas...</span>
              </div>
            </div>
          )}
          
          {/* Stats Cards para Tiendas */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${loadingRangoFechas ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Primera fila: Tiendas Activas, Total Pedidos, Entregados, Pendientes, Devoluciones, Reagendados */}
            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Tiendas Activas</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">{tiendaCalculations.length}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Total Pedidos</p>
                      <p className="text-lg font-bold text-orange-900 mt-1">
                        {tiendaCalculations.reduce((sum, t) => sum + t.totalOrders, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Entregados</p>
                      <p className="text-lg font-bold text-green-900 mt-1">
                        {tiendaCalculations.reduce((sum, t) => sum + t.deliveredOrders, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Pendientes</p>
                      <p className="text-lg font-bold text-yellow-900 mt-1">
                        {tiendaCalculations.reduce((sum, t) => sum + t.pendingOrders, 0)}
                        {tiendaCalculations.reduce((sum, t) => sum + t.orders.filter(o => o.estado_pedido === 'PENDIENTE' && !o.mensajero_asignado).length, 0) > 0 && (
                          <span className="text-xs text-orange-600 ml-2">
                            ({tiendaCalculations.reduce((sum, t) => sum + t.orders.filter(o => o.estado_pedido === 'PENDIENTE' && !o.mensajero_asignado).length, 0)} sin asignar)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Devoluciones</p>
                      <p className="text-lg font-bold text-red-900 mt-1">
                        {tiendaCalculations.reduce((sum, t) => sum + t.returnedOrders, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Reagendados</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">
                        {tiendaCalculations.reduce((sum, t) => sum + t.rescheduledOrders, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            {/* Segunda fila: Total Recibido, Total Efectivo, SINPE, Tarjeta, Otros */}
            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Total Recibido</p>
                      <p className="text-xs text-purple-600">(todos los medios)</p>
                      <p className="text-lg font-bold text-purple-900 mt-1">
                        {formatCurrency(tiendaCalculations.reduce((sum, t) => sum + t.totalCollected, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Banknote className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Total Efectivo</p>
                      <p className="text-lg font-bold text-green-900 mt-1">
                        {formatCurrency(tiendaCalculations.reduce((sum, t) => sum + t.cashPayments, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-cyan-50 to-cyan-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">SINPE</p>
                      <p className="text-lg font-bold text-cyan-900 mt-1">
                        {formatCurrency(tiendaCalculations.reduce((sum, t) => sum + t.sinpePayments, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-pink-50 to-pink-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Tarjeta</p>
                      <p className="text-lg font-bold text-pink-900 mt-1">
                        {formatCurrency(tiendaCalculations.reduce((sum, t) => sum + t.tarjetaPayments, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Tabla de Liquidaciones por Tienda */}
          <Card className={loadingRangoFechas ? 'opacity-50 pointer-events-none' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Liquidaciones por Tienda - {
                  usarRangoFechas && tiendaFechaInicio && tiendaFechaFin 
                    ? `${tiendaFechaInicio} a ${tiendaFechaFin}`
                    : selectedDate
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tienda</TableHead>
                    <TableHead>Pedidos por Estado</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Total Recaudado</TableHead>
                    <TableHead>SINPE</TableHead>
                    <TableHead>Efectivo</TableHead>
                    <TableHead>Gastos</TableHead>
                    <TableHead>Monto Final</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiendaCalculations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="w-8 h-8 text-gray-400" />
                          <p className="text-gray-500">
                            No se encontraron tiendas con pedidos para la fecha {selectedDate}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tiendaCalculations.map((tienda) => (
                      <TableRow key={tienda.tienda}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{tienda.tienda}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const statusCounts: Record<string, { count: number; color: string; label: string }> = {
                                ENTREGADO: { count: 0, color: 'bg-green-500', label: 'Entregado' },
                                PENDIENTE: { count: 0, color: 'bg-yellow-500', label: 'Pendiente' },
                                DEVUELTO: { count: 0, color: 'bg-red-500', label: 'Devuelto' },
                                DEVOLUCION: { count: 0, color: 'bg-orange-500', label: 'Devolución' },
                                REAGENDADO: { count: 0, color: 'bg-blue-500', label: 'Reagendado' },
                                CANCELADO: { count: 0, color: 'bg-gray-500', label: 'Cancelado' }
                              };
                              
                              tienda.orders.forEach(order => {
                                const status = order.estado_pedido;
                                if (status && statusCounts[status]) {
                                  statusCounts[status].count++;
                                }
                              });
                              
                              return Object.entries(statusCounts)
                                .filter(([_, data]) => data.count > 0)
                                .map(([status, data]) => (
                                  <div key={status} className="flex items-center gap-1">
                                    <div className={`w-3 h-3 rounded-full ${data.color}`}></div>
                                    <span className="text-xs font-medium">{data.count}</span>
                                    <span className="text-xs text-muted-foreground">{data.label}</span>
                                  </div>
                                ));
                            })()}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-600">
                              {formatCurrency(tienda.totalValue)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              {formatCurrency(tienda.totalCollected)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-600">
                              {formatCurrency(tienda.sinpePayments)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              {formatCurrency(tienda.cashPayments)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-600">
                              {formatCurrency(tienda.totalSpent)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-600">
                              {formatCurrency(tienda.finalAmount)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTiendaLiquidation(tienda)}
                              className="h-8"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Ver y Liquidar - Diseño Completo */}
      {showViewAndLiquidateModal && selectedViewAndLiquidate && (
        <Dialog open={showViewAndLiquidateModal} onOpenChange={setShowViewAndLiquidateModal}>
          <DialogContent className="sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] max-h-[90vh] overflow-y-auto overflow-x-hidden max-w-7xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Calculator className="w-6 h-6 text-blue-600" />
                {activeTab === 'mensajeros' 
                  ? `Liquidación de Mensajero - ${selectedViewAndLiquidate.messengerName}`
                  : `Liquidación de Tienda - ${selectedViewAndLiquidate.messengerName}`
                }
              </DialogTitle>
            </DialogHeader>
          
          {selectedViewAndLiquidate && (
            <div className="space-y-4 overflow-hidden">
              {/* Debug info - remover en producción */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <strong>Debug:</strong> Pedidos: {selectedViewAndLiquidate.orders.length}, 
                  Filtro Estado: {orderStatusFilter}, 
                  Filtro Pago: {orderPaymentFilter}
                </div>
              )}

              {/* Sección Superior */}
              <div className="space-y-4">
                {/* Resumen Financiero con Tamaño Fijo */}
                <div className="flex gap-4">
                {/* Total a Entregar */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-purple-100 text-sm truncate">Total a Entregar</p>
                      <p className="text-2xl font-bold truncate">{formatCurrency(selectedViewAndLiquidate.finalAmount)}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-200 flex-shrink-0 ml-2" />
                  </div>
                </div>

                {/* Total Recaudado */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-blue-100 text-sm truncate">Total Recaudado</p>
                      <p className="text-2xl font-bold truncate">{formatCurrency(selectedViewAndLiquidate.totalCollected)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-200 flex-shrink-0 ml-2" />
                  </div>
                </div>
              </div>

              {/* Métodos de Pago Compactos */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4 overflow-hidden">
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Banknote className="w-3 h-3 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-green-800 text-xs">Efectivo</span>
                  </div>
                  <p className="text-sm font-bold text-green-600 truncate">
                    {formatCurrency(selectedViewAndLiquidate.cashPayments)}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Smartphone className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-blue-800 text-xs">SINPE</span>
                  </div>
                  <p className="text-sm font-bold text-blue-600 truncate">
                    {formatCurrency(selectedViewAndLiquidate.sinpePayments)}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                  <div className="flex items-center gap-1 mb-1">
                    <CreditCard className="w-3 h-3 text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-purple-800 text-xs">Tarjeta</span>
                  </div>
                  <p className="text-sm font-bold text-purple-600 truncate">
                    {formatCurrency(selectedViewAndLiquidate.tarjetaPayments || 0)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <Minus className="w-3 h-3 text-gray-600 flex-shrink-0" />
                      <span className="font-medium text-gray-800 text-xs">Gastos</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewExpenses(selectedViewAndLiquidate)}
                      className="h-5 px-1 text-xs text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                    >
                      <Receipt className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-bold text-gray-600 truncate">
                    {formatCurrency(selectedViewAndLiquidate.totalSpent)}
                  </p>
                </div>
              </div>

              {/* Filtros Compactos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-700">Filtros:</span>
                  
                  {/* Filtro Total */}
                  <button
                    onClick={() => setOrderStatusFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      orderStatusFilter === 'all' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    Total ({selectedViewAndLiquidate.orders.length})
                  </button>

                  {/* Filtros de Estado */}
                  <button
                    onClick={() => setOrderStatusFilter('ENTREGADO')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      orderStatusFilter === 'ENTREGADO' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
                    }`}
                  >
                    Entregados ({selectedViewAndLiquidate.orders.filter(o => o.estado_pedido === 'ENTREGADO').length})
                  </button>

                  <button
                    onClick={() => setOrderStatusFilter('PENDIENTE')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      orderStatusFilter === 'PENDIENTE' 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-white text-yellow-600 border border-yellow-200 hover:bg-yellow-50'
                    }`}
                  >
                    Pendientes ({selectedViewAndLiquidate.orders.filter(o => o.estado_pedido === 'PENDIENTE').length})
                  </button>

                  <button
                    onClick={() => setOrderStatusFilter('REAGENDADO')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      orderStatusFilter === 'REAGENDADO' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    Reagendados ({selectedViewAndLiquidate.orders.filter(o => o.estado_pedido === 'REAGENDADO').length})
                  </button>

                  <button
                    onClick={() => setOrderStatusFilter('DEVOLUCION')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      orderStatusFilter === 'DEVOLUCION' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                    }`}
                  >
                    Devoluciones ({selectedViewAndLiquidate.orders.filter(o => o.estado_pedido === 'DEVOLUCION').length})
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700">Pago:</span>
                  
                  <button
                    onClick={() => setOrderPaymentFilter(orderPaymentFilter === 'EFECTIVO' ? 'all' : 'EFECTIVO')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      orderPaymentFilter === 'EFECTIVO' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
                    }`}
                  >
                    Efectivo
                  </button>

                  <button
                    onClick={() => setOrderPaymentFilter(orderPaymentFilter === 'SINPE' ? 'all' : 'SINPE')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      orderPaymentFilter === 'SINPE' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    SINPE
                  </button>

                  <button
                    onClick={() => setOrderPaymentFilter(orderPaymentFilter === 'TARJETA' ? 'all' : 'TARJETA')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      orderPaymentFilter === 'TARJETA' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    Tarjeta
                  </button>
                </div>
              </div>
              </div>

              {/* Componente de Tabla de Pedidos */}
              <PedidosTable
                orders={selectedViewAndLiquidate.orders}
                orderStatusFilter={orderStatusFilter}
                orderPaymentFilter={orderPaymentFilter}
                onEditOrder={handleEditOrderStatus}
                onViewComprobante={handleViewPedidoComprobante}
                formatCurrency={formatCurrency}
              />
            
                {/* Botón de Confirmar Liquidación */}
              <div className="flex justify-end">
                {selectedViewAndLiquidate.isLiquidated ? (
                  // Si ya está liquidado, mostrar botón de cerrar
                  <Button 
                    size="lg" 
                    className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
                    onClick={() => setShowViewAndLiquidateModal(false)}
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cerrar
                  </Button>
                ) : (
                  // Si no está liquidado, verificar si puede liquidar
                  (() => {
                    const pedidosPendientes = selectedViewAndLiquidate.orders.filter(o => o.estado_pedido === 'PENDIENTE').length;
                    const puedeLiquidar = pedidosPendientes === 0;
                    
                    return (
                      <Button 
                        size="lg" 
                        className={`px-8 py-3 ${
                          puedeLiquidar 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (puedeLiquidar) {
                            alert(`Liquidación confirmada para ${selectedViewAndLiquidate.messengerName}. Total a entregar: ${formatCurrency(selectedViewAndLiquidate.finalAmount)}`);
                            setShowViewAndLiquidateModal(false);
                          }
                        }}
                        disabled={!puedeLiquidar}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {puedeLiquidar ? 'Confirmar Liquidación' : `No se puede liquidar (${pedidosPendientes} pendientes)`}
                      </Button>
                    );
                  })()
                )}
              </div>
            </div>
          )}
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Actualización de Estado de Pedido */}
      {isUpdateStatusModalOpen && selectedOrderForUpdate && (
        <Dialog open={isUpdateStatusModalOpen} onOpenChange={setIsUpdateStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Estado del Pedido</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Pedido: {selectedOrderForUpdate.id_pedido}</Label>
                <p className="text-sm text-gray-600">{selectedOrderForUpdate.cliente_nombre}</p>
              </div>
              
              <div>
                <Label htmlFor="status">Nuevo Estado</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREGADO">Entregado</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="DEVOLUCION">Devolución</SelectItem>
                    <SelectItem value="REAGENDADO">Reagendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newStatus === 'ENTREGADO' && (
                <div>
                  <Label htmlFor="payment">Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="SINPE">SINPE</SelectItem>
                      <SelectItem value="TARJETA">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="comment">Comentario (opcional)</Label>
                <Textarea
                  id="comment"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Agregar comentario..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsUpdateStatusModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateOrderStatus}
                disabled={updatingOrder === selectedOrderForUpdate.id_pedido}
              >
                {updatingOrder === selectedOrderForUpdate.id_pedido ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Actualizar
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Gastos */}
      {showExpensesModal && selectedExpenses && (
        <Dialog open={showExpensesModal} onOpenChange={setShowExpensesModal}>
          <DialogContent className="sm:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[70vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Receipt className="w-6 h-6 text-red-600" />
                Gastos del Mensajero - {selectedExpenses.mensajero}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedExpenses.gastos && selectedExpenses.gastos.length > 0 ? (
                <div className="space-y-4">
                  {/* Resumen de gastos */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-800">Total de Gastos</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(selectedExpenses.gastos.reduce((sum: number, gasto: any) => sum + gasto.monto, 0))}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {selectedExpenses.gastos.length} {selectedExpenses.gastos.length === 1 ? 'gasto registrado' : 'gastos registrados'}
                    </p>
                  </div>

                  {/* Lista de gastos */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedExpenses.gastos.map((gasto: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                            {gasto.tipo === 'gasolina' ? (
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Fuel className="w-5 h-5 text-blue-600" />
                              </div>
                            ) : gasto.tipo === 'mantenimiento' ? (
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-orange-600" />
                              </div>
                            ) : gasto.tipo === 'peaje' ? (
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Car className="w-5 h-5 text-purple-600" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{gasto.descripcion}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-600 capitalize">{gasto.tipo}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{gasto.fecha}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-red-600">{formatCurrency(gasto.monto)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay gastos registrados</h3>
                  <p className="text-gray-500">Este mensajero no tiene gastos registrados para la fecha seleccionada</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={() => setShowExpensesModal(false)}
                className="px-6"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Progress Loader */}
      {isVisible && (
        <ProgressLoader
          isVisible={isVisible}
          title="Procesando Liquidaciones"
          steps={steps}
          currentStep={currentStep}
          overallProgress={overallProgress}
          onClose={closeLoader}
        />
      )}

      {/* Modal para actualizar estado del pedido - Como mi ruta de hoy */}
      <Dialog open={isUpdateStatusModalOpen} onOpenChange={setIsUpdateStatusModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="flex-shrink-0 p-4 pb-2">
              <DialogTitle className="text-lg">Actualizar Estado del Pedido</DialogTitle>
            </DialogHeader>
            {selectedOrderForUpdate && (
              <div className="flex-1 overflow-y-auto px-4 space-y-4 min-h-0">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Pedido: {selectedOrderForUpdate.id_pedido}</p>
                  <p className="text-sm text-gray-600">{selectedOrderForUpdate.cliente_nombre}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(selectedOrderForUpdate.valor_total)}</p>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Nuevo Estado *</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={newStatus === 'ENTREGADO' ? 'default' : 'outline'}
                      onClick={() => setNewStatus('ENTREGADO')}
                      className={`h-10 text-sm font-medium ${
                        newStatus === 'ENTREGADO' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700'
                      }`}
                    >
                      Entregado
                    </Button>
                    <Button
                      variant={newStatus === 'DEVOLUCION' ? 'default' : 'outline'}
                      onClick={() => setNewStatus('DEVOLUCION')}
                      className={`h-10 text-sm font-medium ${
                        newStatus === 'DEVOLUCION' 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'border-red-200 hover:border-red-300 hover:bg-red-50 text-red-700'
                      }`}
                    >
                      Devolución
                    </Button>
                    <Button
                      variant={newStatus === 'REAGENDADO' ? 'default' : 'outline'}
                      onClick={() => setNewStatus('REAGENDADO')}
                      className={`h-10 text-sm font-medium ${
                        newStatus === 'REAGENDADO' 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-700'
                      }`}
                    >
                      Reagendado
                    </Button>
                  </div>
                </div>

                {/* Sección de método de pago para entregado */}
                {newStatus === 'ENTREGADO' && (
                  <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold">Confirmar Método de Pago *</Label>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {selectedOrderForUpdate.metodo_pago === 'EFECTIVO' ? 'Efectivo' :
                         selectedOrderForUpdate.metodo_pago === 'SINPE' ? 'SINPE' :
                         selectedOrderForUpdate.metodo_pago === 'TARJETA' ? 'Tarjeta' :
                         'Cambio'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      Confirma el método de pago que el cliente está utilizando para esta entrega
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={paymentMethod === 'EFECTIVO' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('EFECTIVO')}
                        className={`h-8 text-xs font-medium ${
                          paymentMethod === 'EFECTIVO' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700'
                        }`}
                      >
                        Efectivo
                      </Button>
                      <Button
                        variant={paymentMethod === 'SINPE' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('SINPE')}
                        className={`h-8 text-xs font-medium ${
                          paymentMethod === 'SINPE' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700'
                        }`}
                      >
                        SINPE
                      </Button>
                      <Button
                        variant={paymentMethod === 'TARJETA' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('TARJETA')}
                        className={`h-8 text-xs font-medium ${
                          paymentMethod === 'TARJETA' 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700'
                        }`}
                      >
                        Tarjeta
                      </Button>
                      <Button
                        variant={paymentMethod === 'CAMBIO' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('CAMBIO')}
                        className={`h-8 text-xs font-medium ${
                          paymentMethod === 'CAMBIO' 
                            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        Cambio
                      </Button>
                    </div>
                    
                    {/* Campos de comprobante para entregados */}
                    {paymentMethod === 'SINPE' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Comprobante SINPE *</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Aquí se manejaría la subida de la imagen
                              console.log('Subiendo comprobante SINPE:', file);
                            }
                          }}
                          className="text-sm"
                        />
                      </div>
                    )}
                    
                    {paymentMethod === 'TARJETA' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Comprobante de Tarjeta *</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Aquí se manejaría la subida de la imagen
                              console.log('Subiendo comprobante de tarjeta:', file);
                            }
                          }}
                          className="text-sm"
                        />
                      </div>
                    )}
                    
                    {paymentMethod === 'EFECTIVO' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Comprobante de Efectivo *</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Aquí se manejaría la subida de la imagen
                              console.log('Subiendo comprobante de efectivo:', file);
                            }
                          }}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Sección de fecha de reagendación */}
                {newStatus === 'REAGENDADO' && (
                  <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Label className="text-sm font-semibold">Fecha de Reagendación (opcional)</Label>
                    <Input
                      type="date"
                      value={fechaReagendacion}
                      onChange={(e) => setFechaReagendacion(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-600">
                      Si no se especifica, se mantendrá la fecha original
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Comentarios (opcional)</Label>
                  <Textarea
                    placeholder="Añadir comentarios sobre el pedido..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
            
            <div className="flex-shrink-0 p-4 pt-2 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateStatusModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    // Aquí iría la lógica para actualizar el estado
                    console.log('Actualizando estado:', { newStatus, paymentMethod, statusComment });
                    setIsUpdateStatusModalOpen(false);
                  }}
                  className="flex-1"
                  disabled={updatingOrder === selectedOrderForUpdate?.id_pedido}
                >
                  {updatingOrder === selectedOrderForUpdate?.id_pedido ? 'Actualizando...' : 'Actualizar Estado'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente separado para la tabla de pedidos
interface PedidosTableProps {
  orders: PedidoTest[];
  orderStatusFilter: string;
  orderPaymentFilter: string;
  onEditOrder: (pedido: PedidoTest) => void;
  onViewComprobante: (pedido: PedidoTest) => void;
  formatCurrency: (amount: number) => string;
}

const PedidosTable = ({ 
  orders, 
  orderStatusFilter, 
  orderPaymentFilter, 
  onEditOrder, 
  onViewComprobante, 
  formatCurrency 
}: PedidosTableProps) => {
  const filteredOrders = orders.filter(pedido => {
    let statusMatch = true;
    if (orderStatusFilter === 'all') {
      statusMatch = true;
    } else if (orderStatusFilter === 'SIN_ASIGNAR') {
      statusMatch = !pedido.mensajero_asignado || pedido.mensajero_asignado === '';
    } else {
      statusMatch = pedido.estado_pedido === orderStatusFilter;
    }
    
    let paymentMatch = true;
    if (orderPaymentFilter === 'all') {
      paymentMatch = true;
    } else if (orderPaymentFilter === 'OTROS') {
      paymentMatch = !pedido.metodo_pago || !['EFECTIVO', 'SINPE', 'TARJETA'].includes(pedido.metodo_pago);
    } else {
      paymentMatch = pedido.metodo_pago === orderPaymentFilter;
    }
    return statusMatch && paymentMatch;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-sm text-gray-800">
          Detalle de Pedidos ({orders.length})
        </h3>
        <div className="text-xs text-gray-500">
          Mostrando {filteredOrders.length} de {orders.length} pedidos
        </div>
      </div>
      <div className="bg-white overflow-x-auto max-h-96">
        <Table className="w-full" style={{ minWidth: '1300px' }}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 text-xs">ID</TableHead>
                <TableHead className="w-40 text-xs">Cliente</TableHead>
                <TableHead className="w-60 text-xs">Producto</TableHead>
                <TableHead className="w-40 text-xs">Mensajero</TableHead>
                <TableHead className="w-32 text-xs">Valor</TableHead>
                <TableHead className="w-32 text-xs">Método</TableHead>
                <TableHead className="w-24 text-xs">Estado</TableHead>
                <TableHead className="w-36 text-xs">Fecha</TableHead>
                <TableHead className="w-24 text-xs">Acciones</TableHead>
                <TableHead className="w-60 text-xs">Dirección</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((pedido) => (
                <TableRow key={pedido.id_pedido} className="text-xs">
                  <TableCell className="font-medium text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          pedido.estado_pedido === 'ENTREGADO' ? 'bg-green-500' :
                          pedido.estado_pedido === 'PENDIENTE' ? 'bg-yellow-500' :
                          pedido.estado_pedido === 'DEVOLUCION' ? 'bg-red-500' :
                          pedido.estado_pedido === 'REAGENDADO' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`}
                      />
                      <span className="truncate">{pedido.id_pedido}</span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate text-xs">{pedido.cliente_nombre}</TableCell>
                  <TableCell className="truncate text-xs">{pedido.productos || 'No especificado'}</TableCell>
                  <TableCell className="truncate text-xs">{pedido.mensajero_asignado || 'No asignado'}</TableCell>
                  <TableCell className="font-medium text-xs">{formatCurrency(pedido.valor_total)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {pedido.metodo_pago === 'SINPE' && <Smartphone className="w-3 h-3 text-blue-600" />}
                      {pedido.metodo_pago === 'EFECTIVO' && <Banknote className="w-3 h-3 text-green-600" />}
                      {pedido.metodo_pago === 'TARJETA' && <CreditCard className="w-3 h-3 text-purple-600" />}
                      <span className="text-xs">
                        {pedido.metodo_pago === 'SINPE' ? 'SINPE' :
                         pedido.metodo_pago === 'EFECTIVO' ? 'EFECTIVO' :
                         pedido.metodo_pago === 'TARJETA' ? 'TARJETA' :
                         'SIN_METODO'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {pedido.estado_pedido === 'ENTREGADO' && <CheckCircle className="w-3 h-3 text-green-600" />}
                      {pedido.estado_pedido === 'PENDIENTE' && <Clock className="w-3 h-3 text-yellow-600" />}
                      {pedido.estado_pedido === 'DEVOLUCION' && <XCircle className="w-3 h-3 text-red-600" />}
                      {pedido.estado_pedido === 'REAGENDADO' && <AlertCircle className="w-3 h-3 text-blue-600" />}
                      <span className="text-xs">
                        {pedido.estado_pedido === 'ENTREGADO' ? 'ENT' :
                         pedido.estado_pedido === 'PENDIENTE' ? 'PEN' :
                         pedido.estado_pedido === 'DEVOLUCION' ? 'DEV' :
                         pedido.estado_pedido === 'REAGENDADO' ? 'REA' :
                         pedido.estado_pedido || 'PEN'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{pedido.fecha_creacion.split('T')[0]}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditOrder(pedido)}
                        className="text-xs px-2 py-1 h-6 w-full"
                        title="Editar estado"
                      >
                        Editar
                      </Button>
                      {pedido.metodo_pago !== 'EFECTIVO' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewComprobante(pedido)}
                          className="text-xs px-2 py-1 h-6 w-full"
                          title="Ver comprobante"
                        >
                          Comprobante
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="truncate text-xs">{pedido.direccion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };