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
  MessageSquare,
  BarChart3,
  PieChart,
  Fuel,
  Wrench,
  Car,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
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
  const [isLoadingData, setIsLoadingData] = useState(false); // Estado para bloquear filtros durante carga
  const [filters, setFilters] = useState<RouteLiquidationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [liquidating, setLiquidating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Estados para el módulo de liquidación mejorado
  const [calculations, setCalculations] = useState<LiquidationCalculation[]>([]);
  const [tiendaCalculations, setTiendaCalculations] = useState<TiendaLiquidationCalculation[]>([]);
  
  // Estados para filtros y paginación de tiendas
  const [tiendaStatusFilter, setTiendaStatusFilter] = useState<string>('TODOS');
  const [tiendaCurrentPage, setTiendaCurrentPage] = useState<{ [key: string]: number }>({});
  
  // Estados para acciones de actualización de estado
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState<PedidoTest | null>(null);
  const [newStatus, setNewStatus] = useState<string>('ENTREGADO');
  const [statusComment, setStatusComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  
  // Estados para modal de detalles
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<PedidoTest | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingInitialAmount, setEditingInitialAmount] = useState<string | null>(null);
  const [newInitialAmount, setNewInitialAmount] = useState('');
  const [isEditingRestricted, setIsEditingRestricted] = useState(false);
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationCalculation | null>(null);
  const [showRouteDetailModal, setShowRouteDetailModal] = useState(false);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<LiquidationCalculation | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    entregados: 0,
    devoluciones: 0,
    reagendados: 0,
    pendientes: 0
  });
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedOrderNotes, setSelectedOrderNotes] = useState<PedidoTest | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const [showViewAndLiquidateModal, setShowViewAndLiquidateModal] = useState(false);
  const [selectedViewAndLiquidate, setSelectedViewAndLiquidate] = useState<LiquidationCalculation | null>(null);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  const [selectedPendingOrders, setSelectedPendingOrders] = useState<{
    mensajero: string;
    pedidos: PedidoTest[];
  } | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<{
    mensajero: string;
    gastos: {
      id: string;
      monto: number;
      tipo_gasto: string;
      comprobante_link: string;
      fecha: string;
    }[];
  } | null>(null);
  const [showSinpeModal, setShowSinpeModal] = useState(false);
  const [showTarjetaModal, setShowTarjetaModal] = useState(false);
  const [selectedSinpeOrders, setSelectedSinpeOrders] = useState<PedidoTest[]>([]);
  const [selectedTarjetaOrders, setSelectedTarjetaOrders] = useState<PedidoTest[]>([]);
  const [isLiquidationCompleted, setIsLiquidationCompleted] = useState(false);
  const [initialAmountInput, setInitialAmountInput] = useState('0');
  
  // Progress loader
  const {
    isVisible: isLoaderVisible,
    steps: loaderSteps,
    currentStep: loaderCurrentStep,
    overallProgress: loaderProgress,
    startLoader,
    setStepStatus,
    setProgress,
    closeLoader
  } = useProgressLoader();

  useEffect(() => {
    // Inicializar con la fecha de Costa Rica si no está definida
    const initializeDate = async () => {
      if (!selectedDate) {
        const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
        const costaRicaDate = getCostaRicaDateISO();
        setSelectedDate(costaRicaDate);
        console.log('📅 Fecha inicializada para Costa Rica:', costaRicaDate);
        return; // Salir temprano para evitar cargar datos con fecha vacía
      }
      
      // Solo cargar datos si ya tenemos una fecha válida
      loadData();
      loadCalculations();
      loadTiendaCalculations();
    };
    
    initializeDate();
  }, [filters]); // Remover selectedDate de las dependencias para evitar bucle infinito

  // useEffect separado para manejar cambios de fecha
  useEffect(() => {
    if (selectedDate) {
      loadData();
      loadCalculations();
      loadTiendaCalculations();
    }
  }, [selectedDate]);

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
      
      // Bloquear filtros durante la carga
      setIsLoadingData(true);
      
      // Solo mostrar loader completo si no es una recarga
      if (!isReload) {
        startLoader('Procesando Liquidaciones', [
          { id: 'mensajeros', label: 'Obteniendo mensajeros únicos', status: 'pending' },
          { id: 'pedidos', label: 'Cargando pedidos del día', status: 'pending' },
          { id: 'calculations', label: 'Calculando liquidaciones', status: 'pending' },
          { id: 'finalization', label: 'Finalizando proceso', status: 'pending' }
        ]);
      }
      
      // Paso 1: Obtener liquidaciones reales
      setStepStatus('mensajeros', 'loading', 'Buscando mensajeros en la base de datos...');
      
      // Asegurar que tenemos una fecha válida
      let fechaParaUsar = selectedDate;
      if (!fechaParaUsar) {
        const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
        fechaParaUsar = getCostaRicaDateISO();
        console.log('📅 Usando fecha de Costa Rica por defecto:', fechaParaUsar);
      }
      
      const liquidacionesReales = await getLiquidacionesReales(fechaParaUsar);
      console.log('✅ Liquidaciones reales obtenidas:', liquidacionesReales.length);
      console.log('📅 Fecha usada para la consulta:', fechaParaUsar);
      
      // Debug: mostrar fechas de los primeros pedidos
      if (liquidacionesReales.length > 0 && liquidacionesReales[0].pedidos.length > 0) {
        console.log('🔍 Primeros pedidos encontrados:');
        liquidacionesReales[0].pedidos.slice(0, 3).forEach((pedido, index) => {
          console.log(`  ${index + 1}. ID: ${pedido.id_pedido}, Fecha: ${pedido.fecha_creacion}`);
        });
      }
      
      // Log básico de liquidaciones cargadas
      console.log(`✅ Liquidaciones cargadas: ${liquidacionesReales.length} mensajeros`);
      
      setStepStatus('mensajeros', 'completed', `${liquidacionesReales.length} mensajeros encontrados`);
      setProgress(30);
      
      // Paso 2: Procesar pedidos
      setStepStatus('pedidos', 'loading', 'Recopilando pedidos por mensajero...');
      setStepStatus('pedidos', 'completed', 'Pedidos cargados correctamente');
      setProgress(60);
      
      // Paso 3: Calcular liquidaciones
      setStepStatus('calculations', 'loading', 'Procesando totales y montos...');
      
      // Convertir a formato LiquidationCalculation
      const calculations: LiquidationCalculation[] = liquidacionesReales.map((liquidation, index) => ({
        messengerId: `msg-${index + 1}`,
        messengerName: liquidation.mensajero,
        routeDate: selectedDate,
        initialAmount: liquidation.initialAmount,
        totalCollected: liquidation.totalCollected,
        totalSpent: liquidation.totalSpent,
        sinpePayments: liquidation.sinpePayments,
        cashPayments: liquidation.cashPayments,
        tarjetaPayments: liquidation.tarjetaPayments || 0,
        finalAmount: liquidation.finalAmount,
        orders: liquidation.pedidos,
        isLiquidated: false,
        canEdit: true
      }));
      
      console.log('✅ Calculations generadas:', calculations.length);
      setStepStatus('calculations', 'completed', 'Liquidaciones calculadas correctamente');
      setProgress(90);
      
      // Paso 4: Finalizar
      setStepStatus('finalization', 'loading', 'Preparando datos para mostrar...');
      setCalculations(calculations);
      setHasRealData(calculations.some(c => c.orders.length > 0));
      setStepStatus('finalization', 'completed', 'Proceso completado');
      setProgress(100);
      
      // Verificar estados de liquidación para todos los mensajeros
      setTimeout(async () => {
        await checkAllLiquidationStatuses(calculations);
      }, 1000);
      
      
      // Cerrar loader (más rápido para recargas)
      setTimeout(() => {
        closeLoader();
        setIsLoadingData(false); // Desbloquear filtros
        if (isReload) {
          console.log('✅ Datos actualizados correctamente');
        }
      }, isReload ? 500 : 1000);
      
    } catch (error) {
      console.error('❌ Error loading calculations:', error);
      
      // Marcar pasos como error
      setStepStatus('calculations', 'error', 'Error en el cálculo');
      setStepStatus('finalization', 'error', 'Proceso falló');
      
      // Cerrar loader después de mostrar el error
      setTimeout(() => {
        closeLoader();
        setIsLoadingData(false); // Desbloquear filtros en caso de error
      }, 3000);
      
      // Fallback a datos vacíos si hay error
      setCalculations([]);
    }
  };

  const loadTiendaCalculations = async () => {
    try {
      console.log('🚀 Iniciando loadTiendaCalculations para fecha:', selectedDate);
      
      // Iniciar loader
      startLoader('Procesando Liquidaciones por Tienda', [
        { id: 'tiendas', label: 'Obteniendo tiendas únicas', status: 'pending' },
        { id: 'pedidos', label: 'Cargando pedidos del día', status: 'pending' },
        { id: 'calculations', label: 'Calculando liquidaciones', status: 'pending' },
        { id: 'finalization', label: 'Finalizando proceso', status: 'pending' }
      ]);
      
      // Paso 1: Obtener liquidaciones reales por tienda
      setStepStatus('tiendas', 'loading', 'Buscando tiendas en la base de datos...');
      
      // Asegurar que tenemos una fecha válida
      let fechaParaUsar = selectedDate;
      if (!fechaParaUsar) {
        const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
        fechaParaUsar = getCostaRicaDateISO();
        console.log('📅 Usando fecha de Costa Rica por defecto:', fechaParaUsar);
      }
      
      const liquidacionesReales = await getLiquidacionesRealesByTienda(fechaParaUsar);
      console.log('✅ Liquidaciones por tienda obtenidas:', liquidacionesReales.length);
      console.log('📅 Fecha usada para la consulta:', fechaParaUsar);
      
      setStepStatus('tiendas', 'completed', `${liquidacionesReales.length} tiendas encontradas`);
      setProgress(30);
      
      // Paso 2: Procesar pedidos
      setStepStatus('pedidos', 'loading', 'Recopilando pedidos por tienda...');
      setStepStatus('pedidos', 'completed', 'Pedidos cargados correctamente');
      setProgress(60);
      
      // Paso 3: Calcular liquidaciones
      setStepStatus('calculations', 'loading', 'Procesando totales y montos...');
      
      // Los datos ya vienen calculados de Supabase
      const calculations: TiendaLiquidationCalculation[] = liquidacionesReales.map((liquidation, index) => ({
        tienda: liquidation.tienda,
        routeDate: selectedDate,
        totalOrders: liquidation.pedidos.length,
        totalValue: liquidation.pedidos.reduce((sum, pedido) => sum + pedido.valor_total, 0),
        totalCollected: liquidation.totalCollected,
        totalSpent: liquidation.totalSpent,
        sinpePayments: liquidation.sinpePayments,
        cashPayments: liquidation.cashPayments,
        tarjetaPayments: liquidation.tarjetaPayments || 0,
        finalAmount: liquidation.finalAmount,
        orders: liquidation.pedidos,
        isLiquidated: false,
        canEdit: true,
        deliveredOrders: liquidation.deliveredOrders,
        pendingOrders: liquidation.pendingOrders,
        returnedOrders: liquidation.returnedOrders,
        rescheduledOrders: liquidation.rescheduledOrders,
        averageOrderValue: liquidation.averageOrderValue,
        topMessenger: liquidation.topMessenger,
        topDistrict: liquidation.topDistrict
      }));
      
      console.log('✅ Calculations por tienda generadas:', calculations.length);
      setStepStatus('calculations', 'completed', 'Liquidaciones calculadas correctamente');
      setProgress(90);
      
      // Paso 4: Finalizar
      setStepStatus('finalization', 'loading', 'Preparando datos para mostrar...');
      setTiendaCalculations(calculations);
      setStepStatus('finalization', 'completed', 'Proceso completado');
      setProgress(100);
      
      // Cerrar loader
      setTimeout(() => {
        closeLoader();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error loading tienda calculations:', error);
      
      // Marcar pasos como error
      setStepStatus('calculations', 'error', 'Error en el cálculo');
      setStepStatus('finalization', 'error', 'Proceso falló');
      
      // Cerrar loader después de mostrar el error
      setTimeout(() => {
        closeLoader();
      }, 3000);
      
      // Fallback a datos vacíos si hay error
      setTiendaCalculations([]);
    }
  };

  const calculateLiquidation = (calculation: LiquidationCalculation): LiquidationCalculation => {
    // Los datos ya vienen calculados de Supabase, pero podemos recalcular si es necesario
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

    const totalSpent = calculation.totalSpent; // Usar el valor ya calculado
    // El mensajero solo debe entregar el efectivo recaudado, no el total de todos los pagos
    const finalAmount = calculation.initialAmount + cashPayments - totalSpent;

    return {
      ...calculation,
      totalCollected,
      totalSpent,
      sinpePayments,
      cashPayments,
      tarjetaPayments,
      finalAmount
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
    setEditingInitialAmount(messengerId);
    setNewInitialAmount(currentAmount.toString());
  };

  const handleSaveInitialAmount = (messengerId: string) => {
    const amount = parseFloat(newInitialAmount);
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
    setEditingInitialAmount(null);
    setNewInitialAmount('');
  };

  const handleCancelEdit = () => {
    setEditingInitialAmount(null);
    setNewInitialAmount('');
  };

  const handleLiquidateMessenger = (calculation: LiquidationCalculation) => {
    setSelectedLiquidation(calculation);
    setShowLiquidationModal(true);
  };

  const handleViewRouteDetail = (calculation: LiquidationCalculation) => {
    setSelectedRouteDetail(calculation);
    setShowRouteDetailModal(true);
  };

  const handleViewAndLiquidate = async (calculation: LiquidationCalculation) => {
    // Verificar si la liquidación ya está completada
    try {
      const { checkLiquidationStatus } = await import('@/lib/supabase-pedidos');
      const fechaParaVerificar = selectedDate || calculation.routeDate;
      const isCompleted = await checkLiquidationStatus(calculation.messengerName, fechaParaVerificar);
      setIsLiquidationCompleted(isCompleted);
      
      // Actualizar el estado en el cálculo para que se refleje en la tabla
      if (isCompleted) {
        setCalculations(prev => 
          prev.map(calc => 
            calc.messengerId === calculation.messengerId 
              ? { ...calc, isLiquidated: true }
              : calc
          )
        );
        // Recargar datos para sincronizar con la base de datos
        console.log('🔄 Recargando datos después de verificar liquidación...');
        await loadCalculations(true);
      }
      
      console.log(`🔍 Liquidación para ${calculation.messengerName} en ${fechaParaVerificar}: ${isCompleted ? 'COMPLETADA' : 'PENDIENTE'}`);
    } catch (error) {
      console.error('❌ Error verificando estado de liquidación:', error);
      setIsLiquidationCompleted(false);
    }

    // Calcular contadores de estado
    const counts = {
      total: calculation.orders.length,
      entregados: calculation.orders.filter(p => p.estado_pedido === 'ENTREGADO').length,
      devoluciones: calculation.orders.filter(p => p.estado_pedido === 'DEVOLUCION').length,
      reagendados: calculation.orders.filter(p => p.estado_pedido === 'REAGENDADO').length,
      pendientes: calculation.orders.filter(p => p.estado_pedido === 'PENDIENTE' || !p.estado_pedido).length
    };
    setStatusCounts(counts);

    // Console.log simplificado y legible
    const pedidosList = calculation.orders.map((pedido, index) => {
      const estado = pedido.estado_pedido || 'sin_estado';
      const metodo = pedido.metodo_pago || 'sin_metodo';
      const entregado = estado === 'ENTREGADO' ? '✅' : '❌';
      const cuentaEnRecaudado = estado === 'ENTREGADO' ? 'SÍ' : 'NO';
      
      return `${index + 1}. ${pedido.id_pedido} | ${pedido.cliente_nombre} | ${estado} ${entregado} | ${metodo} | ₡${pedido.valor_total} | Cuenta: ${cuentaEnRecaudado}`;
    }).join('\n');

    console.log(`
🔍 ===== LIQUIDACIÓN: ${calculation.messengerName} =====
📅 Fecha: ${calculation.routeDate}
📦 Total pedidos: ${calculation.orders.length}
💰 Total Recaudado: ₡${calculation.totalCollected}
💵 Efectivo: ₡${calculation.cashPayments}
📱 SINPE: ₡${calculation.sinpePayments}
💳 Tarjeta: ₡${calculation.tarjetaPayments || 0}
💸 Gastos: ₡${calculation.totalSpent}
🏦 Plata Inicial: ₡${calculation.initialAmount}
📊 Total a Entregar: ₡${calculation.finalAmount}

📋 LISTA DE PEDIDOS:
${pedidosList}

🔍 ==========================================
    `);
    
    setSelectedViewAndLiquidate(calculation);
    setInitialAmountInput('0'); // Siempre empezar en 0
    setShowViewAndLiquidateModal(true);
  };

  const handleViewNotes = (pedido: PedidoTest) => {
    setSelectedOrderNotes(pedido);
    setShowNotesModal(true);
  };

  const handleViewExpenses = async (calculation: LiquidationCalculation) => {
    try {
      // Obtener gastos del mensajero usando la misma lógica que en "Mi Ruta de Hoy"
      const { getGastosMensajeros } = await import('@/lib/supabase-pedidos');
      const gastosData = await getGastosMensajeros(calculation.routeDate);
      
      // Buscar gastos del mensajero específico
      const gastosDelMensajero = gastosData.find(g => g.mensajero === calculation.messengerName);
      
      setSelectedExpenses({
        mensajero: calculation.messengerName,
        gastos: gastosDelMensajero?.gastos || []
      });
      setShowExpensesModal(true);
    } catch (error) {
      console.error('Error obteniendo gastos:', error);
      setSelectedExpenses({
        mensajero: calculation.messengerName,
        gastos: []
      });
      setShowExpensesModal(true);
    }
  };

  const handleViewPendingOrders = (calculation: LiquidationCalculation) => {
    // Filtrar pedidos que no están entregados (pendientes, devoluciones, reagendados, etc.)
    const pendingOrders = calculation.orders.filter(pedido => 
      pedido.estado_pedido !== 'ENTREGADO'
    );
    
    setSelectedPendingOrders({
      mensajero: calculation.messengerName,
      pedidos: pendingOrders
    });
    setShowPendingOrdersModal(true);
  };

  const handleViewSinpeOrders = (calculation: LiquidationCalculation) => {
    const sinpeOrders = calculation.orders.filter(pedido => 
      pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'SINPE'
    );
    setSelectedSinpeOrders(sinpeOrders);
    setShowSinpeModal(true);
  };

  const handleViewTarjetaOrders = (calculation: LiquidationCalculation) => {
    const tarjetaOrders = calculation.orders.filter(pedido => 
      pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'TARJETA'
    );
    setSelectedTarjetaOrders(tarjetaOrders);
    setShowTarjetaModal(true);
  };

  const handleViewMap = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Funciones para iconos y colores de gastos (igual que en Mi Ruta de Hoy)
  const getExpenseIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'combustible': return <Fuel className="w-4 h-4" />;
      case 'mantenimiento': return <Wrench className="w-4 h-4" />;
      case 'peaje': return <Car className="w-4 h-4" />;
      case 'fuel': return <Fuel className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'peaje': return <Car className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getExpenseColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'combustible': return 'bg-blue-100 text-blue-600';
      case 'mantenimiento': return 'bg-orange-100 text-orange-600';
      case 'peaje': return 'bg-purple-100 text-purple-600';
      case 'fuel': return 'bg-blue-100 text-blue-600';
      case 'maintenance': return 'bg-orange-100 text-orange-600';
      case 'peaje': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleViewComprobante = (comprobante: string) => {
    // Aquí podrías implementar la lógica para ver el comprobante
    alert(`Ver comprobante: ${comprobante}`);
  };

  // Función para verificar y actualizar el estado de todas las liquidaciones
  const checkAllLiquidationStatuses = async (calculations: LiquidationCalculation[]) => {
    try {
      const { checkLiquidationStatus, getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
      const fechaParaVerificar = selectedDate || getCostaRicaDateISO();
      
      console.log('🔍 Verificando estados de liquidación para todos los mensajeros...');
      
      // Verificar cada mensajero y actualizar el estado
      for (const calc of calculations) {
        try {
          const isCompleted = await checkLiquidationStatus(calc.messengerName, fechaParaVerificar);
          
          if (isCompleted && !calc.isLiquidated) {
            // Actualizar el estado en el array de cálculos
            setCalculations(prev => 
              prev.map(c => 
                c.messengerId === calc.messengerId 
                  ? { ...c, isLiquidated: true }
                  : c
              )
            );
            console.log(`✅ ${calc.messengerName} marcado como liquidado`);
          }
        } catch (error) {
          console.error(`❌ Error verificando ${calc.messengerName}:`, error);
        }
      }
      
      console.log('✅ Verificación de estados completada');
    } catch (error) {
      console.error('❌ Error en checkAllLiquidationStatuses:', error);
    }
  };


  const confirmLiquidation = async (calculation: LiquidationCalculation, initialAmount?: number) => {
    try {
      // Usar la fecha de la liquidación seleccionada
      const fechaParaEnviar = selectedDate || calculation.routeDate;
      
      // Usar el monto inicial del input o 0 por defecto
      const plataInicial = initialAmount || 0;
      
      // Calcular el monto final correctamente: Plata Inicial + Efectivo Recaudado - Gastos
      const montoFinal = plataInicial + calculation.cashPayments - calculation.totalSpent;
      
      console.log('📊 Datos de liquidación a enviar:', {
        fecha: fechaParaEnviar,
        mensajero: calculation.messengerName,
        plata_inicial: plataInicial,
        total_recaudado: calculation.totalCollected,
        pagos_sinpe: calculation.sinpePayments,
        pagos_efectivo: calculation.cashPayments,
        gastos: calculation.totalSpent,
        monto_final: montoFinal
      });
      
      // Enviar al endpoint de liquidación
      const response = await fetch('https://primary-production-2b25b.up.railway.app/webhook/add-liquidacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: fechaParaEnviar,
          mensajero: calculation.messengerName,
          plata_inicial: plataInicial,
          total_recaudado: calculation.totalCollected,
          pagos_sinpe: calculation.sinpePayments,
          pagos_efectivo: calculation.cashPayments,
          gastos: calculation.totalSpent,
          monto_final: montoFinal
        })
      });

      if (!response.ok) {
        throw new Error(`Error al enviar liquidación: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Liquidación enviada exitosamente:', responseData);

      // Marcar como liquidado localmente
      setCalculations(prev => 
        prev.map(calc => 
          calc.messengerId === calculation.messengerId 
            ? { ...calc, isLiquidated: true, canEdit: false, initialAmount: plataInicial }
            : calc
        )
      );
      
      // Restringir edición de pedidos
      setIsEditingRestricted(true);
      
      // Cerrar modales
      setShowLiquidationModal(false);
      setShowViewAndLiquidateModal(false);
      
      // Recargar datos para sincronizar con la base de datos
      console.log('🔄 Recargando datos después de liquidación...');
      await loadCalculations(true);
    } catch (error) {
      console.error('Error confirming liquidation:', error);
      alert('Error al confirmar la liquidación: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Funciones auxiliares para filtros y paginación de tiendas
  const getFilteredOrders = (orders: PedidoTest[], statusFilter: string) => {
    if (statusFilter === 'TODOS') {
      return orders;
    }
    return orders.filter(pedido => pedido.estado_pedido === statusFilter);
  };

  const getPaginatedOrders = (orders: PedidoTest[], currentPage: number, pageSize: number = 10) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return orders.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalOrders: number, pageSize: number = 10) => {
    return Math.ceil(totalOrders / pageSize);
  };

  const getCurrentPageForTienda = (tienda: string) => {
    return tiendaCurrentPage[tienda] || 1;
  };

  const setCurrentPageForTienda = (tienda: string, page: number) => {
    setTiendaCurrentPage(prev => ({
      ...prev,
      [tienda]: page
    }));
  };

  // Función para actualizar el estado de un pedido
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrderForUpdate || !newStatus) return;
    
    try {
      setUpdatingOrder(selectedOrderForUpdate.id_pedido);
      
      // Preparar datos para el webhook
      const webhookData = {
        idPedido: selectedOrderForUpdate.id_pedido,
        mensajero: selectedOrderForUpdate.mensajero_concretado || selectedOrderForUpdate.mensajero_asignado || 'SIN_ASIGNAR',
        usuario: user?.name || 'Admin', // Usuario que realiza la acción
        
        // Datos del formulario
        estadoPedido: newStatus === 'REAGENDADO' ? 'REAGENDO' : newStatus,
        metodoPago: newStatus === 'DEVOLUCION' || newStatus === 'REAGENDADO' ? null : paymentMethod,
        nota: statusComment || '',
        
        // Datos del pedido
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

      // Llamar al webhook
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
        // Recargar los datos para reflejar los cambios
        await loadTiendaCalculations();
        await loadCalculations(true);
        
        // Cerrar modal y resetear estado
        setIsUpdateStatusModalOpen(false);
        setSelectedOrderForUpdate(null);
        setNewStatus('ENTREGADO');
        setStatusComment('');
        setPaymentMethod('efectivo');
        
        alert(`Pedido ${selectedOrderForUpdate.id_pedido} actualizado a ${newStatus} exitosamente`);
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

      {/* Mensaje informativo cuando no hay datos reales */}
      {!hasRealData && calculations.length > 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sin pedidos entregados:</strong> Los mensajeros mostrados tienen pedidos asignados para el {selectedDate}, pero ninguno ha sido marcado como "entregado". 
            Verifica que los pedidos hayan sido completados correctamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensajeros con Pedidos</p>
                <p className="text-2xl font-bold">{calculations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendientes por Liquidar</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {calculations.filter(c => !c.isLiquidated).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recaudado</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(calculations.reduce((sum, c) => sum + c.totalCollected, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total a Entregar</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(calculations.reduce((sum, c) => sum + c.finalAmount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas de Comparación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Barras - Comparación por Mensajero */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recaudación por Mensajero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calculations.map(calc => ({
                name: calc.messengerName.split(' ')[0], // Solo primer nombre
                recaudado: calc.totalCollected,
                gastos: calc.totalSpent,
                final: calc.finalAmount
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            `₡${Number(value).toLocaleString()}`, 
                            name === 'recaudado' ? 'Total Recaudado' : 
                            name === 'gastos' ? 'Gastos' : 'Total a Entregar'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="recaudado" fill="#10b981" name="Total Recaudado" />
                        <Bar dataKey="gastos" fill="#f59e0b" name="Gastos" />
                        <Bar dataKey="final" fill="#8b5cf6" name="Total a Entregar" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de Pie - Distribución de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribución de Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const pieData = [
                {
                  name: 'Efectivo',
                  value: calculations.reduce((sum, calc) => 
                    sum + calc.orders.filter(o => o.metodo_pago === 'EFECTIVO').length, 0
                  ),
                  color: '#10b981'
                },
                {
                  name: 'SINPE',
                  value: calculations.reduce((sum, calc) => 
                    sum + calc.orders.filter(o => o.metodo_pago === 'SINPE').length, 0
                  ),
                  color: '#3b82f6'
                },
                {
                  name: 'Tarjeta',
                  value: calculations.reduce((sum, calc) => 
                    sum + calc.orders.filter(o => o.metodo_pago === 'TARJETA').length, 0
                  ),
                  color: '#8b5cf6'
                },
                {
                  name: '2 Pagos',
                  value: calculations.reduce((sum, calc) => 
                    sum + calc.orders.filter(o => o.metodo_pago === '2PAGOS').length, 0
                  ),
                  color: '#f59e0b'
                }
              ].filter(item => item.value > 0);

              if (pieData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No hay datos de métodos de pago</p>
                    </div>
                  </div>
                );
              }

              return (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Liquidaciones */}
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
                <TableHead>Total Recaudado</TableHead>
                <TableHead>Pagos SINPE</TableHead>
                <TableHead>Pagos Efectivo</TableHead>
                <TableHead>Gastos</TableHead>
                <TableHead>Total a Entregar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Truck className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-600">No hay mensajeros con pedidos</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          No se encontraron mensajeros con pedidos asignados para la fecha {selectedDate}
                        </p>
                      </div>
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
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          {formatCurrency(calculated.totalCollected)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-600">
                          {formatCurrency(calculated.sinpePayments)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          {formatCurrency(calculated.cashPayments)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-red-600" />
                        <span className="font-bold text-red-600">
                          {formatCurrency(calculated.totalSpent)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-purple-600">
                          {formatCurrency(calculated.finalAmount)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(calculated.isLiquidated)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!calculated.isLiquidated ? (
                          <Button
                            size="sm"
                            onClick={() => handleViewAndLiquidate(calculated)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver y Liquidar
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleViewAndLiquidate(calculated)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm">Liquidado</span>
                            </div>
                          </div>
                        )}
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

      {/* Liquidaciones por Tienda */}
      {tiendaCalculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Liquidaciones por Tienda - {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Resumen Comparativo de Todas las Tiendas */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Resumen Comparativo - Todas las Tiendas
              </h3>
              
              {/* Métricas generales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {tiendaCalculations.reduce((sum, t) => sum + t.totalOrders, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Pedidos</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    ₡{tiendaCalculations.reduce((sum, t) => sum + t.totalValue, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    ₡{tiendaCalculations.reduce((sum, t) => sum + t.totalCollected, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Recaudado</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {tiendaCalculations.length}
                  </div>
                  <div className="text-sm text-gray-600">Tiendas Activas</div>
                </div>
              </div>

              {/* Desglose por método de pago */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800">Efectivo</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    ₡{tiendaCalculations.reduce((sum, t) => sum + t.cashPayments, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {((tiendaCalculations.reduce((sum, t) => sum + t.cashPayments, 0) / 
                       tiendaCalculations.reduce((sum, t) => sum + t.totalCollected, 0)) * 100).toFixed(1)}% del total
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">SINPE</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    ₡{tiendaCalculations.reduce((sum, t) => sum + t.sinpePayments, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    {((tiendaCalculations.reduce((sum, t) => sum + t.sinpePayments, 0) / 
                       tiendaCalculations.reduce((sum, t) => sum + t.totalCollected, 0)) * 100).toFixed(1)}% del total
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-800">Tarjeta</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    ₡{tiendaCalculations.reduce((sum, t) => sum + t.tarjetaPayments, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-600 mt-1">
                    {((tiendaCalculations.reduce((sum, t) => sum + t.tarjetaPayments, 0) / 
                       tiendaCalculations.reduce((sum, t) => sum + t.totalCollected, 0)) * 100).toFixed(1)}% del total
                  </div>
                </div>
              </div>

              {/* Contador de pedidos por estado */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800">Entregados</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {tiendaCalculations.reduce((sum, t) => sum + t.deliveredOrders, 0)}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {((tiendaCalculations.reduce((sum, t) => sum + t.deliveredOrders, 0) / 
                       tiendaCalculations.reduce((sum, t) => sum + t.totalOrders, 0)) * 100).toFixed(1)}% del total
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">Pendientes</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {tiendaCalculations.reduce((sum, t) => sum + t.pendingOrders, 0)}
                  </div>
                  <div className="text-sm text-yellow-600 mt-1">
                    {((tiendaCalculations.reduce((sum, t) => sum + t.pendingOrders, 0) / 
                       tiendaCalculations.reduce((sum, t) => sum + t.totalOrders, 0)) * 100).toFixed(1)}% del total
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-800">Devoluciones</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {tiendaCalculations.reduce((sum, t) => sum + t.returnedOrders, 0)}
                  </div>
                  <div className="text-sm text-red-600 mt-1">
                    {((tiendaCalculations.reduce((sum, t) => sum + t.returnedOrders, 0) / 
                       tiendaCalculations.reduce((sum, t) => sum + t.totalOrders, 0)) * 100).toFixed(1)}% del total
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">Reagendados</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {tiendaCalculations.reduce((sum, t) => sum + t.rescheduledOrders, 0)}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    {((tiendaCalculations.reduce((sum, t) => sum + t.rescheduledOrders, 0) / 
                       tiendaCalculations.reduce((sum, t) => sum + t.totalOrders, 0)) * 100).toFixed(1)}% del total
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos Comparativos de Tiendas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Gráfico de Métodos de Pago por Tienda */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Métodos de Pago por Tienda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tiendaCalculations.map(tienda => ({
                        tienda: tienda.tienda.length > 10 ? tienda.tienda.substring(0, 10) + '...' : tienda.tienda,
                        efectivo: tienda.cashPayments,
                        sinpe: tienda.sinpePayments,
                        tarjeta: tienda.tarjetaPayments
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="tienda" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis 
                          tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`}
                          fontSize={12}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            `₡${Number(value).toLocaleString()}`, 
                            name === 'efectivo' ? 'Efectivo' : 
                            name === 'sinpe' ? 'SINPE' : 'Tarjeta'
                          ]}
                          labelStyle={{ color: '#374151' }}
                          contentStyle={{ 
                            backgroundColor: '#f9fafb', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="efectivo" fill="#16a34a" name="Efectivo" />
                        <Bar dataKey="sinpe" fill="#2563eb" name="SINPE" />
                        <Bar dataKey="tarjeta" fill="#9333ea" name="Tarjeta" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Pedidos por Estado por Tienda */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-green-600" />
                    Pedidos por Estado por Tienda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tiendaCalculations.map(tienda => ({
                        tienda: tienda.tienda.length > 10 ? tienda.tienda.substring(0, 10) + '...' : tienda.tienda,
                        entregados: tienda.deliveredOrders,
                        pendientes: tienda.pendingOrders,
                        devoluciones: tienda.returnedOrders,
                        reagendados: tienda.rescheduledOrders
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="tienda" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${Number(value)} pedidos`, 
                            name === 'entregados' ? 'Entregados' : 
                            name === 'pendientes' ? 'Pendientes' : 
                            name === 'devoluciones' ? 'Devoluciones' : 'Reagendados'
                          ]}
                          labelStyle={{ color: '#374151' }}
                          contentStyle={{ 
                            backgroundColor: '#f9fafb', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="entregados" fill="#16a34a" name="Entregados" />
                        <Bar dataKey="pendientes" fill="#eab308" name="Pendientes" />
                        <Bar dataKey="devoluciones" fill="#dc2626" name="Devoluciones" />
                        <Bar dataKey="reagendados" fill="#2563eb" name="Reagendados" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Comparación de Valores Totales */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Comparación de Valores Totales por Tienda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tiendaCalculations.map(tienda => ({
                      tienda: tienda.tienda.length > 12 ? tienda.tienda.substring(0, 12) + '...' : tienda.tienda,
                      valorTotal: tienda.totalValue,
                      valorRecaudado: tienda.totalCollected,
                      promedio: tienda.averageOrderValue
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="tienda" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis 
                        tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`}
                        fontSize={12}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `₡${Number(value).toLocaleString()}`, 
                          name === 'valorTotal' ? 'Valor Total' : 
                          name === 'valorRecaudado' ? 'Valor Recaudado' : 'Promedio por Pedido'
                        ]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: '#f9fafb', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="valorTotal" fill="#059669" name="Valor Total" />
                      <Bar dataKey="valorRecaudado" fill="#0d9488" name="Valor Recaudado" />
                      <Bar dataKey="promedio" fill="#0891b2" name="Promedio por Pedido" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {tiendaCalculations.map((tiendaCalculation) => {
                return (
                  <div key={tiendaCalculation.tienda} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{tiendaCalculation.tienda}</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {tiendaCalculation.totalOrders} pedidos
                        </Badge>
                        <Badge variant="secondary">
                          ₡{tiendaCalculation.totalValue.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Contadores de pedidos por estado */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{tiendaCalculation.deliveredOrders}</div>
                        <div className="text-sm text-gray-600">Entregados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{tiendaCalculation.pendingOrders}</div>
                        <div className="text-sm text-gray-600">Pendientes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{tiendaCalculation.returnedOrders}</div>
                        <div className="text-sm text-gray-600">Devoluciones</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{tiendaCalculation.rescheduledOrders}</div>
                        <div className="text-sm text-gray-600">Reagendados</div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="font-medium">Valor promedio por pedido:</span>
                        <span className="ml-2 text-green-600">₡{tiendaCalculation.averageOrderValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Mensajero principal:</span>
                        <span className="ml-2">{tiendaCalculation.topMessenger}</span>
                      </div>
                      <div>
                        <span className="font-medium">Distrito principal:</span>
                        <span className="ml-2">{tiendaCalculation.topDistrict}</span>
                      </div>
                    </div>

                    {/* Desglose por método de pago */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Banknote className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-800">Efectivo</span>
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          ₡{tiendaCalculation.cashPayments.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">
                          {tiendaCalculation.totalCollected > 0 ? 
                            ((tiendaCalculation.cashPayments / tiendaCalculation.totalCollected) * 100).toFixed(1) : 0}% del total
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-blue-800">SINPE</span>
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          ₡{tiendaCalculation.sinpePayments.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">
                          {tiendaCalculation.totalCollected > 0 ? 
                            ((tiendaCalculation.sinpePayments / tiendaCalculation.totalCollected) * 100).toFixed(1) : 0}% del total
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-purple-800">Tarjeta</span>
                        </div>
                        <div className="text-lg font-bold text-purple-900">
                          ₡{tiendaCalculation.tarjetaPayments.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-600">
                          {tiendaCalculation.totalCollected > 0 ? 
                            ((tiendaCalculation.tarjetaPayments / tiendaCalculation.totalCollected) * 100).toFixed(1) : 0}% del total
                        </div>
                      </div>
                    </div>
                    
                    {tiendaCalculation.orders.length > 0 ? (
                      <div className="space-y-4">
                        {/* Filtros */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`status-filter-${tiendaCalculation.tienda}`} className="font-medium">
                              Filtrar por estado:
                            </Label>
                            <Select
                              value={tiendaStatusFilter}
                              onValueChange={setTiendaStatusFilter}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TODOS">Todos</SelectItem>
                                <SelectItem value="ENTREGADO">Entregados</SelectItem>
                                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                                <SelectItem value="DEVOLUCION">Devoluciones</SelectItem>
                                <SelectItem value="REAGENDADO">Reagendados</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="text-sm text-gray-600">
                            Mostrando {getFilteredOrders(tiendaCalculation.orders, tiendaStatusFilter).length} de {tiendaCalculation.orders.length} pedidos
                          </div>
                        </div>

                        {/* Tabla de pedidos */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID Pedido</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Método de Pago</TableHead>
                                <TableHead>Distrito</TableHead>
                                <TableHead>Mensajero</TableHead>
                                <TableHead>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                const filteredOrders = getFilteredOrders(tiendaCalculation.orders, tiendaStatusFilter);
                                const currentPage = getCurrentPageForTienda(tiendaCalculation.tienda);
                                const paginatedOrders = getPaginatedOrders(filteredOrders, currentPage, 10);
                                
                                return paginatedOrders.map((pedido) => (
                                  <TableRow key={pedido.id_pedido}>
                                    <TableCell className="font-medium">{pedido.id_pedido}</TableCell>
                                    <TableCell>{pedido.cliente_nombre}</TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={pedido.estado_pedido === 'ENTREGADO' ? 'default' : 'outline'}
                                        className={
                                          pedido.estado_pedido === 'ENTREGADO' ? 'bg-green-100 text-green-800' :
                                          pedido.estado_pedido === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                          pedido.estado_pedido === 'DEVOLUCION' ? 'bg-red-100 text-red-800' :
                                          pedido.estado_pedido === 'REAGENDADO' ? 'bg-blue-100 text-blue-800' : ''
                                        }
                                      >
                                        {pedido.estado_pedido || 'PENDIENTE'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>₡{(pedido.valor_total || 0).toLocaleString()}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {pedido.metodo_pago || 'SIN_METODO'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{pedido.distrito}</TableCell>
                                    <TableCell>
                                      <span className="text-sm font-medium">
                                        {pedido.mensajero_concretado || pedido.mensajero_asignado || 'SIN_ASIGNAR'}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOrderForDetails(pedido);
                                            setIsDetailsModalOpen(true);
                                          }}
                                          className="h-7 w-7 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                                          title="Ver Detalles"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOrderForUpdate(pedido);
                                            setNewStatus('ENTREGADO');
                                            setPaymentMethod(pedido.metodo_pago || 'efectivo');
                                            setIsUpdateStatusModalOpen(true);
                                          }}
                                          className="h-7 w-7 p-0 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                                          disabled={updatingOrder === pedido.id_pedido}
                                          title="Editar Estado"
                                        >
                                          {updatingOrder === pedido.id_pedido ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Edit3 className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ));
                              })()}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Paginación */}
                        {(() => {
                          const filteredOrders = getFilteredOrders(tiendaCalculation.orders, tiendaStatusFilter);
                          const totalPages = getTotalPages(filteredOrders.length, 10);
                          const currentPage = getCurrentPageForTienda(tiendaCalculation.tienda);
                          
                          if (totalPages <= 1) return null;
                          
                          return (
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                Página {currentPage} de {totalPages} 
                                ({filteredOrders.length} pedidos totales)
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPageForTienda(tiendaCalculation.tienda, Math.max(1, currentPage - 1))}
                                  disabled={currentPage <= 1}
                                >
                                  Anterior
                                </Button>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                    if (pageNum > totalPages) return null;
                                    
                                    return (
                                      <Button
                                        key={pageNum}
                                        variant={pageNum === currentPage ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPageForTienda(tiendaCalculation.tienda, pageNum)}
                                        className="w-8 h-8 p-0"
                                      >
                                        {pageNum}
                                      </Button>
                                    );
                                  })}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPageForTienda(tiendaCalculation.tienda, Math.min(totalPages, currentPage + 1))}
                                  disabled={currentPage >= totalPages}
                                >
                                  Siguiente
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No hay pedidos para esta tienda en esta fecha</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalles de Pedidos Reales */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detalles de Pedidos Reales - {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calculations.map((calculation) => {
                const calculated = calculateLiquidation(calculation);
                return (
                  <div key={calculation.messengerId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{calculation.messengerName}</h3>
                      <Badge variant="outline">
                        {calculated.orders.length} pedidos
                      </Badge>
                    </div>
                    
                    {calculated.orders.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {calculated.orders.slice(0, 6).map((pedido) => (
                          <div key={pedido.id_pedido} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{pedido.id_pedido}</span>
                              <Badge 
                                variant={pedido.estado_pedido === 'ENTREGADO' ? 'default' : 'outline'}
                                className={pedido.estado_pedido === 'ENTREGADO' ? 'bg-green-100 text-green-800' : ''}
                              >
                                {pedido.estado_pedido || 'PENDIENTE'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Cliente: {pedido.cliente_nombre}</div>
                              <div>Valor: ₡{(pedido.valor_total || 0).toLocaleString()}</div>
                              <div>Método: {pedido.metodo_pago || 'N/A'}</div>
                              <div>Distrito: {pedido.distrito}</div>
                            </div>
                          </div>
                        ))}
                        {calculated.orders.length > 6 && (
                          <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-blue-600">
                              +{calculated.orders.length - 6} pedidos más
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No hay pedidos para este mensajero en esta fecha</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Liquidación */}
      <Dialog open={showLiquidationModal} onOpenChange={setShowLiquidationModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Confirmar Liquidación</DialogTitle>
          </DialogHeader>
          {selectedLiquidation && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Al confirmar la liquidación, se restringirá la edición de pedidos para este mensajero.
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Resumen de Liquidación - {selectedLiquidation.messengerName}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Plata inicial:</span>
                    <span className="font-bold text-green-600 ml-2">
                      {formatCurrency(selectedLiquidation.initialAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total recaudado:</span>
                    <span className="font-bold text-green-600 ml-2">
                      {formatCurrency(selectedLiquidation.totalCollected)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pagos SINPE:</span>
                    <span className="font-bold text-blue-600 ml-2">
                      {formatCurrency(selectedLiquidation.sinpePayments)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pagos Efectivo:</span>
                    <span className="font-bold text-green-600 ml-2">
                      {formatCurrency(selectedLiquidation.cashPayments)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gastos:</span>
                    <span className="font-bold text-red-600 ml-2">
                      {formatCurrency(selectedLiquidation.totalSpent)}
                    </span>
                  </div>
                  <div className="col-span-2 border-t pt-2">
                    <span className="text-muted-foreground font-semibold">Monto final a entregar:</span>
                    <span className="font-bold text-purple-600 ml-2 text-lg">
                      {formatCurrency(selectedLiquidation.finalAmount)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="liquidation-notes">Notas de liquidación (opcional)</Label>
                <Textarea
                  id="liquidation-notes"
                  placeholder="Agrega observaciones sobre la liquidación..."
                  className="mt-1"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLiquidationModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => confirmLiquidation(selectedLiquidation)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Liquidación
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalle de Ruta */}
      <Dialog open={showRouteDetailModal} onOpenChange={setShowRouteDetailModal}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[95vh] p-0">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="flex-shrink-0 p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Detalle de Ruta - {selectedRouteDetail?.messengerName}
              </DialogTitle>
            </DialogHeader>
            {selectedRouteDetail && (
              <div className="flex-1 overflow-y-auto px-6 space-y-6 min-h-0">
                {/* Resumen Financiero */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Recaudado</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(selectedRouteDetail.totalCollected)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pagos SINPE</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(selectedRouteDetail.sinpePayments)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Banknote className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pagos Efectivo</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(selectedRouteDetail.cashPayments)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Calculator className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total a Entregar</p>
                          <p className="text-xl font-bold text-purple-600">
                            {formatCurrency(selectedRouteDetail.finalAmount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detalles de Gastos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Gastos del Mensajero
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">Combustible</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(0)}
                          </p>
                          <p className="text-sm text-gray-500">Por configurar</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">Otros Gastos</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(0)}
                          </p>
                          <p className="text-sm text-gray-500">Por configurar</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Minus className="w-4 h-4 text-red-600" />
                            <span className="font-medium">Total Gastos</span>
                          </div>
                          <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(selectedRouteDetail.totalSpent)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen de Pedidos */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Resumen de Pedidos ({selectedRouteDetail.orders.length})
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {/* Filtros de Estado */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={orderStatusFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => setOrderStatusFilter('all')}
                            className="h-8 text-xs"
                          >
                            Todos
                          </Button>
                          <Button
                            size="sm"
                            variant={orderStatusFilter === 'entregado' ? 'default' : 'outline'}
                            onClick={() => setOrderStatusFilter('entregado')}
                            className="h-8 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            Entregados
                          </Button>
                          <Button
                            size="sm"
                            variant={orderStatusFilter === 'pendiente' ? 'default' : 'outline'}
                            onClick={() => setOrderStatusFilter('pendiente')}
                            className="h-8 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                          >
                            Pendientes
                          </Button>
                          <Button
                            size="sm"
                            variant={orderStatusFilter === 'devolucion' ? 'default' : 'outline'}
                            onClick={() => setOrderStatusFilter('devolucion')}
                            className="h-8 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          >
                            Devoluciones
                          </Button>
                          <Button
                            size="sm"
                            variant={orderStatusFilter === 'reagendado' ? 'default' : 'outline'}
                            onClick={() => setOrderStatusFilter('reagendado')}
                            className="h-8 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                          >
                            Reagendados
                          </Button>
                        </div>

                        {/* Separador */}
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

                        {/* Filtros de Pago */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={orderPaymentFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => setOrderPaymentFilter('all')}
                            className="h-8 text-xs"
                          >
                            Todos
                          </Button>
                          <Button
                            size="sm"
                            variant={orderPaymentFilter === 'efectivo' ? 'default' : 'outline'}
                            onClick={() => setOrderPaymentFilter('efectivo')}
                            className="h-8 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            💵 Efectivo
                          </Button>
                          <Button
                            size="sm"
                            variant={orderPaymentFilter === 'sinpe' ? 'default' : 'outline'}
                            onClick={() => setOrderPaymentFilter('sinpe')}
                            className="h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            📱 SINPE
                          </Button>
                          <Button
                            size="sm"
                            variant={orderPaymentFilter === 'tarjeta' ? 'default' : 'outline'}
                            onClick={() => setOrderPaymentFilter('tarjeta')}
                            className="h-8 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                          >
                            💳 Tarjeta
                          </Button>
                          <Button
                            size="sm"
                            variant={orderPaymentFilter === '2pagos' ? 'default' : 'outline'}
                            onClick={() => setOrderPaymentFilter('2pagos')}
                            className="h-8 text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                          >
                            🔄 2 Pagos
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Estadísticas de pedidos */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedRouteDetail.orders.filter(p => p.estado_pedido === 'entregado').length}
                          </p>
                          <p className="text-sm text-gray-600">Entregados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {selectedRouteDetail.orders.filter(p => !p.estado_pedido || p.estado_pedido === 'pendiente').length}
                          </p>
                          <p className="text-sm text-gray-600">Pendientes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {selectedRouteDetail.orders.filter(p => p.estado_pedido === 'devolucion').length}
                          </p>
                          <p className="text-sm text-gray-600">Devoluciones</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {selectedRouteDetail.orders.filter(p => p.estado_pedido === 'reagendado').length}
                          </p>
                          <p className="text-sm text-gray-600">Reagendados</p>
                        </div>
                      </div>

                      {/* Lista mejorada de pedidos */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedRouteDetail.orders
                          .filter(pedido => {
                            const statusMatch = orderStatusFilter === 'all' || pedido.estado_pedido === orderStatusFilter || 
                              (orderStatusFilter === 'pendiente' && (!pedido.estado_pedido || pedido.estado_pedido === 'pendiente'));
                            const paymentMatch = orderPaymentFilter === 'all' || pedido.metodo_pago === orderPaymentFilter;
                            return statusMatch && paymentMatch;
                          })
                          .map((pedido) => (
                            <div key={pedido.id_pedido} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                              {/* Header del pedido */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-blue-600">
                                      {pedido.id_pedido?.slice(-2)}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-base text-gray-900">{pedido.id_pedido}</span>
                                      <Badge 
                                        className={`text-xs px-3 py-1 font-medium ${
                                          pedido.estado_pedido === 'entregado' 
                                            ? 'bg-green-500 text-white border-green-500' 
                                            : pedido.estado_pedido === 'devolucion'
                                            ? 'bg-red-500 text-white border-red-500'
                                            : pedido.estado_pedido === 'reagendado'
                                            ? 'bg-orange-500 text-white border-orange-500'
                                            : 'bg-yellow-500 text-white border-yellow-500'
                                        }`}
                                      >
                                        {pedido.estado_pedido === 'entregado' ? 'ENTREGADO' :
                                         pedido.estado_pedido === 'devolucion' ? 'DEVOLUCIÓN' :
                                         pedido.estado_pedido === 'reagendado' ? 'REAGENDADO' :
                                         'PENDIENTE'}
                                      </Badge>
                                    </div>
                                    <p className="font-semibold text-sm text-gray-800 truncate">{pedido.cliente_nombre}</p>
                                  </div>
                                </div>
                                
                                {/* Botones de acción */}
                                <div className="flex gap-1 ml-3">
                                  {(pedido.notas || pedido.nota_asesor) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewNotes(pedido)}
                                      className="h-8 w-8 p-0"
                                      title="Ver notas"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {pedido.link_ubicacion && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewMap(pedido.link_ubicacion!)}
                                      className="h-8 w-8 p-0"
                                      title="Ver mapa"
                                    >
                                      <MapPin className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {pedido.comprobante_sinpe && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewComprobante(pedido.comprobante_sinpe!)}
                                      className="h-8 w-8 p-0"
                                      title="Ver comprobante"
                                    >
                                      <Receipt className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Productos */}
                              {pedido.productos && (
                                <div className="mb-3">
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-4 border-blue-400">
                                    {pedido.productos}
                                  </p>
                                </div>
                              )}
                              
                              {/* Información principal en grid */}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <div className="text-xs font-medium text-green-700 mb-1">Valor</div>
                                  <div className="font-bold text-lg text-green-600">{formatCurrency(pedido.valor_total)}</div>
                                </div>
                                
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <div className="text-xs font-medium text-blue-700 mb-1">Método de Pago</div>
                                  <div className="flex items-center gap-1">
                                    {pedido.metodo_pago === 'efectivo' && '💵'}
                                    {pedido.metodo_pago === 'sinpe' && '📱'}
                                    {pedido.metodo_pago === 'tarjeta' && '💳'}
                                    {pedido.metodo_pago === '2pagos' && '🔄'}
                                    <span className="font-semibold text-blue-600">
                                      {pedido.metodo_pago === 'efectivo' ? 'Efectivo' :
                                       pedido.metodo_pago === 'sinpe' ? 'SINPE' :
                                       pedido.metodo_pago === 'tarjeta' ? 'Tarjeta' :
                                       pedido.metodo_pago === '2pagos' ? '2 Pagos' :
                                       'N/A'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <div className="text-xs font-medium text-purple-700 mb-1">Ubicación</div>
                                  <div className="font-semibold text-purple-600 truncate">{pedido.distrito || 'N/A'}</div>
                                  <div className="text-xs text-purple-500 truncate">{pedido.canton || 'N/A'}</div>
                                </div>
                                
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                  <div className="text-xs font-medium text-orange-700 mb-1">Teléfono</div>
                                  <div className="font-semibold text-orange-600 font-mono">{pedido.cliente_telefono || 'N/A'}</div>
                                </div>
                              </div>
                              
                              {/* Información secundaria */}
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Tienda:</span>
                                    <span className="font-medium text-gray-800">{pedido.tienda || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Fecha Creación:</span>
                                    <span className="font-medium text-gray-800">
                                      {pedido.fecha_creacion ? (() => {
                                        if (pedido.fecha_creacion.includes('T')) {
                                          const datePart = pedido.fecha_creacion.split('T')[0];
                                          const parts = datePart.split('-');
                                          if (parts.length === 3) {
                                            const year = parts[0];
                                            const month = parts[1];
                                            const day = parts[2];
                                            return `${day}/${month}/${year}`;
                                          }
                                        }
                                        if (pedido.fecha_creacion.includes('-') && !pedido.fecha_creacion.includes('T')) {
                                          const parts = pedido.fecha_creacion.split('-');
                                          if (parts.length === 3) {
                                            const year = parts[0];
                                            const month = parts[1].padStart(2, '0');
                                            const day = parts[2].padStart(2, '0');
                                            return `${day}/${month}/${year}`;
                                          }
                                        }
                                        return new Date(pedido.fecha_creacion).toLocaleDateString('es-CR');
                                      })() : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Mensajero:</span>
                                    <span className="font-medium text-gray-800 truncate">
                                      {pedido.mensajero_concretado || pedido.mensajero_asignado || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="flex-shrink-0 p-6 pt-4 border-t">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRouteDetailModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Notas */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Notas del Pedido - {selectedOrderNotes?.id_pedido}
            </DialogTitle>
          </DialogHeader>
          {selectedOrderNotes && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Información del Pedido</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium ml-2">{selectedOrderNotes.cliente_nombre}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedOrderNotes.valor_total)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium ml-2">{selectedOrderNotes.estado_pedido || 'pendiente'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Método de Pago:</span>
                    <span className="font-medium ml-2">{selectedOrderNotes.metodo_pago || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {selectedOrderNotes.productos && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Productos
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedOrderNotes.productos}</p>
                  </div>
                </div>
              )}

              {selectedOrderNotes.notas && (
                <div>
                  <h4 className="font-semibold mb-2">Notas Generales</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedOrderNotes.notas}</p>
                  </div>
                </div>
              )}

              {selectedOrderNotes.nota_asesor && (
                <div>
                  <h4 className="font-semibold mb-2">Notas del Asesor</h4>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedOrderNotes.nota_asesor}</p>
                  </div>
                </div>
              )}

              {!selectedOrderNotes.notas && !selectedOrderNotes.nota_asesor && !selectedOrderNotes.productos && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay notas disponibles para este pedido</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNotesModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Ver y Liquidar - Diseño Refactorizado */}
      <Dialog open={showViewAndLiquidateModal} onOpenChange={setShowViewAndLiquidateModal}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-bold">Liquidación de Mensajero</span>
                <p className="text-sm text-gray-600 font-normal">{selectedViewAndLiquidate?.messengerName}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedViewAndLiquidate && (
            <div className="flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-1">
                
                {/* Columna Izquierda - Resumen y Cálculos */}
                <div className="lg:col-span-1 space-y-4">
                  
                  {/* Resumen Financiero */}
                  <Card className="border-2 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Resumen Financiero
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Total Recaudado</span>
                          </div>
                          <p className="text-xl font-bold text-green-900">
                            {formatCurrency(selectedViewAndLiquidate.totalCollected)}
                          </p>
                        </div>
                        <div 
                          className="bg-red-50 p-3 rounded-lg cursor-pointer hover:bg-red-100 transition-colors duration-200"
                          onClick={() => handleViewExpenses(selectedViewAndLiquidate)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Minus className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Gastos</span>
                            <Eye className="w-3 h-3 text-red-500 ml-auto" />
                          </div>
                          <p className="text-xl font-bold text-red-900">
                            {formatCurrency(selectedViewAndLiquidate.totalSpent)}
                          </p>
                          <p className="text-xs text-red-600 mt-1">Click para ver detalles</p>
                        </div>
                      </div>
                      
                      {/* Pedidos a Devolver */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Pedidos a Devolver</h4>
                        <div 
                          className="bg-orange-50 p-3 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors duration-200"
                          onClick={() => handleViewPendingOrders(selectedViewAndLiquidate)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">Pedidos Pendientes</span>
                            <Eye className="w-3 h-3 text-orange-500 ml-auto" />
                          </div>
                          <p className="text-lg font-bold text-orange-900">
                            {selectedViewAndLiquidate.orders.filter(p => p.estado_pedido !== 'ENTREGADO').length}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">Click para ver detalles</p>
                        </div>
                      </div>
                      
                      {/* Desglose por método de pago - Filtros clickeables */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Filtros por Método de Pago</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div 
                            className={`p-2 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                              orderPaymentFilter === 'EFECTIVO' 
                                ? 'bg-green-100 border-2 border-green-300' 
                                : 'bg-green-50 hover:bg-green-100'
                            }`}
                            onClick={() => setOrderPaymentFilter(orderPaymentFilter === 'EFECTIVO' ? 'all' : 'EFECTIVO')}
                          >
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Banknote className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-medium text-green-800">Efectivo</span>
                            </div>
                            <p className="text-sm font-bold text-green-900">
                              {formatCurrency(selectedViewAndLiquidate.cashPayments)}
                            </p>
                          </div>
                          <div 
                            className={`p-2 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                              orderPaymentFilter === 'SINPE' 
                                ? 'bg-blue-100 border-2 border-blue-300' 
                                : 'bg-blue-50 hover:bg-blue-100'
                            }`}
                            onClick={() => {
                              setOrderPaymentFilter(orderPaymentFilter === 'SINPE' ? 'all' : 'SINPE');
                              if (selectedViewAndLiquidate.sinpePayments > 0) {
                                handleViewSinpeOrders(selectedViewAndLiquidate);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Smartphone className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-800">SINPE</span>
                              {selectedViewAndLiquidate.sinpePayments > 0 && (
                                <Eye className="w-3 h-3 text-blue-500 ml-1" />
                              )}
                            </div>
                            <p className="text-sm font-bold text-blue-900">
                              {formatCurrency(selectedViewAndLiquidate.sinpePayments)}
                            </p>
                          </div>
                          <div 
                            className={`p-2 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                              orderPaymentFilter === 'TARJETA' 
                                ? 'bg-purple-100 border-2 border-purple-300' 
                                : 'bg-purple-50 hover:bg-purple-100'
                            }`}
                            onClick={() => {
                              setOrderPaymentFilter(orderPaymentFilter === 'TARJETA' ? 'all' : 'TARJETA');
                              if ((selectedViewAndLiquidate.tarjetaPayments || 0) > 0) {
                                handleViewTarjetaOrders(selectedViewAndLiquidate);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <CreditCard className="w-3 h-3 text-purple-600" />
                              <span className="text-xs font-medium text-purple-800">Tarjeta</span>
                              {(selectedViewAndLiquidate.tarjetaPayments || 0) > 0 && (
                                <Eye className="w-3 h-3 text-purple-500 ml-1" />
                              )}
                            </div>
                            <p className="text-sm font-bold text-purple-900">
                              {formatCurrency(selectedViewAndLiquidate.tarjetaPayments || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plata Inicial */}
                  <Card className="border-2 border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="w-5 h-5 text-orange-600" />
                        Plata Inicial
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="initial-amount" className="text-sm font-medium">Monto (₡)</Label>
                          <Input
                            id="initial-amount"
                            type="number"
                            value={initialAmountInput}
                            onChange={(e) => setInitialAmountInput(e.target.value)}
                            placeholder="0"
                            className="mt-1 text-lg font-semibold"
                          />
                        </div>
                        <p className="text-xs text-gray-600 bg-orange-50 p-2 rounded">
                          💡 Monto entregado al mensajero en la mañana
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cálculo Final - Diseño Mejorado */}
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Calculator className="w-6 h-6 text-purple-600" />
                        </div>
                        <span>Cálculo Final</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Plata Inicial - Más Grande */}
                      <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Plus className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <span className="text-base font-semibold text-green-800">Plata inicial</span>
                              <p className="text-xs text-green-600">Monto entregado en la mañana</p>
                            </div>
                          </div>
                          <span className="text-xl font-bold text-green-900">
                            {formatCurrency(parseFloat(initialAmountInput) || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Total Recaudado - Más Grande */}
                      <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-base font-semibold text-blue-800">+ Total recaudado</span>
                              <p className="text-xs text-blue-600">Dinero recaudado por entregas</p>
                            </div>
                          </div>
                          <span className="text-xl font-bold text-blue-900">
                            {formatCurrency(selectedViewAndLiquidate.totalCollected)}
                          </span>
                        </div>
                      </div>

                      {/* Gastos - Más Grande */}
                      <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <Minus className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <span className="text-base font-semibold text-red-800">- Gastos</span>
                              <p className="text-xs text-red-600">Gastos reportados por el mensajero</p>
                            </div>
                          </div>
                          <span className="text-xl font-bold text-red-900">
                            {formatCurrency(selectedViewAndLiquidate.totalSpent)}
                          </span>
                        </div>
                      </div>

                      {/* Línea divisoria mejorada */}
                      <div className="border-t-2 border-purple-200 pt-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm text-gray-700">
                              <span className="font-medium">Fórmula de Liquidación:</span>
                            </div>
                            <div className="bg-white p-3 rounded border font-mono text-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">Plata Inicial:</span>
                                <span className="font-bold text-green-600">{formatCurrency(parseFloat(initialAmountInput) || 0)}</span>
                              </div>
                              
                              {/* Desglose del total recaudado */}
                              <div className="mb-2 p-2 bg-gray-50 rounded">
                                <div className="text-xs text-gray-500 mb-1">Total Recaudado (desglose):</div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600">• Efectivo:</span>
                                  <span className="font-semibold text-green-600">{formatCurrency(selectedViewAndLiquidate.cashPayments)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600">• SINPE:</span>
                                  <span className="font-semibold text-blue-600">{formatCurrency(selectedViewAndLiquidate.sinpePayments)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600">• Tarjeta:</span>
                                  <span className="font-semibold text-purple-600">{formatCurrency(selectedViewAndLiquidate.tarjetaPayments || 0)}</span>
                                </div>
                                <div className="border-t border-gray-300 pt-1 flex items-center justify-between text-xs">
                                  <span className="text-gray-700 font-semibold">= Total:</span>
                                  <span className="font-bold text-gray-800">{formatCurrency(selectedViewAndLiquidate.totalCollected)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">+ Efectivo para Liquidación:</span>
                                <span className="font-bold text-blue-600">{formatCurrency(selectedViewAndLiquidate.cashPayments)}</span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">- Gastos:</span>
                                <span className="font-bold text-red-600">{formatCurrency(selectedViewAndLiquidate.totalSpent)}</span>
                              </div>
                              <div className="border-t pt-2 flex items-center justify-between">
                                <span className="text-gray-800 font-semibold">= Total a Entregar:</span>
                                <span className="font-bold text-purple-600 text-base">
                                  {formatCurrency((parseFloat(initialAmountInput) || 0) + selectedViewAndLiquidate.cashPayments - selectedViewAndLiquidate.totalSpent)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resultado Final - Mucho Más Prominente */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Calculator className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-purple-800">Total a Entregar</h3>
                            <p className="text-sm text-purple-600">El mensajero debe entregar este monto en bodega</p>
                          </div>
                        </div>
                        
                        {/* Fórmula de liquidación */}
                        <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Fórmula de Liquidación:</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Plata Inicial:</span>
                              <span className="font-semibold text-green-600">₡{(parseFloat(initialAmountInput) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">+ Efectivo Recaudado:</span>
                              <span className="font-semibold text-blue-600">₡{selectedViewAndLiquidate.cashPayments.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">- Gastos:</span>
                              <span className="font-semibold text-red-600">₡{selectedViewAndLiquidate.totalSpent.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-800">= Total a Entregar:</span>
                                <span className="font-bold text-purple-600">₡{((parseFloat(initialAmountInput) || 0) + selectedViewAndLiquidate.cashPayments - selectedViewAndLiquidate.totalSpent).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-4xl font-bold text-purple-900 mb-2">
                            {formatCurrency((parseFloat(initialAmountInput) || 0) + selectedViewAndLiquidate.cashPayments - selectedViewAndLiquidate.totalSpent)}
                          </div>
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Confirmado para entrega</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna Derecha - Pedidos */}
                <div className="lg:col-span-2 space-y-4 flex flex-col h-full">

                  {/* Estadísticas de Pedidos */}
                  <Card className="border-2 border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-gray-600" />
                        Estadísticas de Pedidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-4 gap-2">
                        <div 
                          className={`p-2 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                            orderStatusFilter === 'all' 
                              ? 'bg-blue-100 border-2 border-blue-300' 
                              : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                          onClick={() => setOrderStatusFilter('all')}
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Package className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">Total</span>
                          </div>
                          <p className="text-lg font-bold text-blue-900">{statusCounts.total}</p>
                        </div>
                        <div 
                          className={`p-2 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                            orderStatusFilter === 'entregado' 
                              ? 'bg-green-100 border-2 border-green-300' 
                              : 'bg-green-50 hover:bg-green-100'
                          }`}
                          onClick={() => setOrderStatusFilter('entregado')}
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-800">Entregados</span>
                          </div>
                          <p className="text-lg font-bold text-green-900">{statusCounts.entregados}</p>
                        </div>
                        <div 
                          className={`p-2 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                            orderStatusFilter === 'devolucion' 
                              ? 'bg-red-100 border-2 border-red-300' 
                              : 'bg-red-50 hover:bg-red-100'
                          }`}
                          onClick={() => setOrderStatusFilter('devolucion')}
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span className="text-xs font-medium text-red-800">Devoluciones</span>
                          </div>
                          <p className="text-lg font-bold text-red-900">{statusCounts.devoluciones}</p>
                        </div>
                        <div 
                          className={`p-2 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                            orderStatusFilter === 'reagendado' 
                              ? 'bg-orange-100 border-2 border-orange-300' 
                              : 'bg-orange-50 hover:bg-orange-100'
                          }`}
                          onClick={() => setOrderStatusFilter('reagendado')}
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-800">Reagendados</span>
                          </div>
                          <p className="text-lg font-bold text-orange-900">{statusCounts.reagendados}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabla Detallada de Pedidos */}
                  <Card className="border-2 border-gray-200 flex-1 flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="w-5 h-5 text-gray-600" />
                          Detalle de Pedidos ({selectedViewAndLiquidate.orders
                            .filter(pedido => {
                              let statusMatch = true;
                              if (orderStatusFilter === 'entregado') {
                                statusMatch = pedido.estado_pedido === 'ENTREGADO';
                              } else if (orderStatusFilter === 'devolucion') {
                                statusMatch = pedido.estado_pedido === 'DEVOLUCION';
                              } else if (orderStatusFilter === 'reagendado') {
                                statusMatch = pedido.estado_pedido === 'REAGENDADO';
                              } else if (orderStatusFilter === 'pendiente') {
                                statusMatch = pedido.estado_pedido === 'PENDIENTE' || !pedido.estado_pedido;
                              }
                              return statusMatch;
                            })
                            .filter(pedido => 
                              orderPaymentFilter === 'all' || 
                              pedido.metodo_pago === orderPaymentFilter
                            ).length})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Select
                            value={orderStatusFilter}
                            onValueChange={setOrderStatusFilter}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los estados</SelectItem>
                              <SelectItem value="entregado">Entregados</SelectItem>
                              <SelectItem value="devolucion">Devoluciones</SelectItem>
                              <SelectItem value="reagendado">Reagendados</SelectItem>
                              <SelectItem value="pendiente">Pendientes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col">
                      <div className="flex-1 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-xs">ID</TableHead>
                        <TableHead className="w-32 text-xs">Cliente</TableHead>
                        <TableHead className="w-20 text-xs hidden sm:table-cell">Teléfono</TableHead>
                        <TableHead className="w-32 text-xs hidden md:table-cell">Dirección</TableHead>
                        <TableHead className="w-20 text-xs">Valor</TableHead>
                        <TableHead className="w-20 text-xs">Método</TableHead>
                        <TableHead className="w-20 text-xs">Estado</TableHead>
                        <TableHead className="w-20 text-xs hidden lg:table-cell">Fecha</TableHead>
                        <TableHead className="w-16 text-xs">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedViewAndLiquidate.orders
                        .filter(pedido => {
                          let statusMatch = true;
                          if (orderStatusFilter === 'entregado') {
                            statusMatch = pedido.estado_pedido === 'ENTREGADO';
                          } else if (orderStatusFilter === 'devolucion') {
                            statusMatch = pedido.estado_pedido === 'DEVOLUCION';
                          } else if (orderStatusFilter === 'reagendado') {
                            statusMatch = pedido.estado_pedido === 'REAGENDADO';
                          } else if (orderStatusFilter === 'pendiente') {
                            statusMatch = pedido.estado_pedido === 'PENDIENTE' || !pedido.estado_pedido;
                          }
                          return statusMatch;
                        })
                        .filter(pedido => 
                          orderPaymentFilter === 'all' || 
                          pedido.metodo_pago === orderPaymentFilter
                        )
                        .map((pedido) => (
                        <TableRow key={pedido.id_pedido} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-xs px-2 py-2">
                            {pedido.id_pedido}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs truncate max-w-28">{pedido.cliente_nombre}</span>
                              <span className="text-xs text-gray-500 truncate max-w-28">{pedido.distrito}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs px-2 py-2 hidden sm:table-cell">
                            {pedido.cliente_telefono ? pedido.cliente_telefono.replace('506', '') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs px-2 py-2 hidden md:table-cell">
                            <div className="max-w-32 text-wrap leading-tight" title={pedido.direccion}>
                              {pedido.direccion ? (
                                <div className="space-y-1">
                                  {pedido.direccion.split(',').slice(0, 2).map((part, index) => (
                                    <div key={index} className="text-xs leading-tight">
                                      {part.trim()}
                                    </div>
                                  ))}
                                </div>
                              ) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-2 py-2">
                            <span className="font-bold text-green-600 text-xs">
                              {formatCurrency(pedido.valor_total)}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              {pedido.metodo_pago === 'EFECTIVO' && <Banknote className="w-3 h-3 text-green-600" />}
                              {pedido.metodo_pago === 'SINPE' && <Smartphone className="w-3 h-3 text-blue-600" />}
                              {pedido.metodo_pago === 'TARJETA' && <CreditCard className="w-3 h-3 text-purple-600" />}
                              {pedido.metodo_pago === '2PAGOS' && <Receipt className="w-3 h-3 text-orange-600" />}
                              <span className="text-xs font-medium truncate">{pedido.metodo_pago || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              {pedido.estado_pedido === 'ENTREGADO' && <CheckCircle className="w-3 h-3 text-green-600" />}
                              {pedido.estado_pedido === 'DEVOLUCION' && <AlertCircle className="w-3 h-3 text-red-600" />}
                              {pedido.estado_pedido === 'REAGENDADO' && <Clock className="w-3 h-3 text-orange-600" />}
                              {(!pedido.estado_pedido || pedido.estado_pedido === 'PENDIENTE') && <Package className="w-3 h-3 text-gray-600" />}
                              <Badge 
                                variant={pedido.estado_pedido === 'ENTREGADO' ? 'default' : 'outline'}
                                className={`text-xs px-1 py-0.5 ${
                                  pedido.estado_pedido === 'ENTREGADO' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : pedido.estado_pedido === 'DEVOLUCION'
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : pedido.estado_pedido === 'REAGENDADO'
                                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                }`}
                              >
                                {pedido.estado_pedido === 'ENTREGADO' ? 'ENT' : 
                                 pedido.estado_pedido === 'DEVOLUCION' ? 'DEV' :
                                 pedido.estado_pedido === 'REAGENDADO' ? 'REA' :
                                 'PEN'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 px-2 py-2 hidden lg:table-cell">
                            {pedido.fecha_creacion ? (() => {
                              if (pedido.fecha_creacion.includes('T')) {
                                const datePart = pedido.fecha_creacion.split('T')[0];
                                const parts = datePart.split('-');
                                if (parts.length === 3) {
                                  const year = parts[0];
                                  const month = parts[1];
                                  const day = parts[2];
                                  return `${day}/${month}/${year.slice(-2)}`;
                                }
                              }
                              if (pedido.fecha_creacion.includes('-') && !pedido.fecha_creacion.includes('T')) {
                                const parts = pedido.fecha_creacion.split('-');
                                if (parts.length === 3) {
                                  const year = parts[0];
                                  const month = parts[1].padStart(2, '0');
                                  const day = parts[2].padStart(2, '0');
                                  return `${day}/${month}/${year.slice(-2)}`;
                                }
                              }
                              return new Date(pedido.fecha_creacion).toLocaleDateString('es-CR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              });
                            })() : 'N/A'}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              {pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'SINPE' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 px-1 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  onClick={() => {
                                    if (pedido.comprobante_sinpe) {
                                      // Abrir el comprobante en una nueva pestaña
                                      window.open(pedido.comprobante_sinpe, '_blank');
                                    } else {
                                      alert(`No hay comprobante disponible para el pedido ${pedido.id_pedido}\nNúmero SINPE: ${pedido.numero_sinpe || 'N/A'}`);
                                    }
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Comprobante
                                </Button>
                              )}
                              {pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'EFECTIVO' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 px-1 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                  onClick={() => {
                                    console.log('Ver comprobante efectivo para pedido:', pedido.id_pedido);
                                    alert(`Pedido pagado en efectivo: ${pedido.id_pedido}\nValor: ${formatCurrency(pedido.valor_total)}\nCliente: ${pedido.cliente_nombre}`);
                                  }}
                                >
                                  <Banknote className="w-3 h-3 mr-1" />
                                  Efectivo
                                </Button>
                              )}
                              {pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'TARJETA' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 px-1 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                  onClick={() => {
                                    if (pedido.comprobante_sinpe) {
                                      window.open(pedido.comprobante_sinpe, '_blank');
                                    } else {
                                      alert(`No hay comprobante disponible para el pedido ${pedido.id_pedido}\nValor: ${formatCurrency(pedido.valor_total)}\nCliente: ${pedido.cliente_nombre}`);
                                    }
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Comprobante
                                </Button>
                              )}
                              {pedido.estado_pedido === 'DEVOLUCION' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 px-1 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                  onClick={() => {
                                    alert(`Pedido devuelto: ${pedido.id_pedido}\nCliente: ${pedido.cliente_nombre}\nValor: ${formatCurrency(pedido.valor_total)}\nMotivo: ${pedido.notas || 'No especificado'}`);
                                  }}
                                >
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Devolución
                                </Button>
                              )}
                              {pedido.estado_pedido === 'REAGENDADO' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 px-1 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                                  onClick={() => {
                                    alert(`Pedido reagendado: ${pedido.id_pedido}\nCliente: ${pedido.cliente_nombre}\nValor: ${formatCurrency(pedido.valor_total)}\nNueva fecha: ${pedido.fecha_entrega || 'No especificada'}`);
                                  }}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  Reagendado
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                        </TableBody>
                      </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 pt-4 border-t bg-gray-50 p-4 -mx-6 -mb-6">
                {isLiquidationCompleted ? (
                  <Button
                    onClick={() => setShowViewAndLiquidateModal(false)}
                    className="px-6"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cerrar
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowViewAndLiquidateModal(false)}
                      className="px-6"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => confirmLiquidation(selectedViewAndLiquidate, parseFloat(initialAmountInput))}
                      className="bg-green-600 hover:bg-green-700 px-6"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirmar Liquidación
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Loader */}
      <ProgressLoader
        isVisible={isLoaderVisible}
        title="Procesando Liquidaciones"
        steps={loaderSteps}
        currentStep={loaderCurrentStep}
        overallProgress={loaderProgress}
        onClose={closeLoader}
      />
      {/* Modal de Gastos */}
      {showExpensesModal && selectedExpenses && (
        <Dialog open={showExpensesModal} onOpenChange={setShowExpensesModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-600" />
                Gastos de {selectedExpenses.mensajero}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedExpenses.gastos.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay gastos reportados para este mensajero</p>
                </div>
              ) : (
                <>
                  {/* Resumen de gastos */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-red-800">Total de Gastos</h3>
                        <p className="text-sm text-red-600">
                          {selectedExpenses.gastos.length} {selectedExpenses.gastos.length === 1 ? 'gasto' : 'gastos'} reportado{selectedExpenses.gastos.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-900">
                          ₡{selectedExpenses.gastos.reduce((sum, gasto) => sum + gasto.monto, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de gastos - Estilo similar a Mi Ruta de Hoy */}
                  <div className="space-y-3">
                    {selectedExpenses.gastos.map((gasto, index) => (
                      <div key={gasto.id || index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${getExpenseColor(gasto.tipo_gasto)}`}>
                              {getExpenseIcon(gasto.tipo_gasto)}
                            </div>
                            <div>
                              <p className="font-medium text-sm capitalize">{gasto.tipo_gasto}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(gasto.fecha).toLocaleTimeString('es-CR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} - {new Date(gasto.fecha).toLocaleDateString('es-CR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">
                              ₡{gasto.monto.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {gasto.comprobante_link && (
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              onClick={() => window.open(gasto.comprobante_link, '_blank')}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver Comprobante
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Pedidos Pendientes */}
      {showPendingOrdersModal && selectedPendingOrders && (
        <Dialog open={showPendingOrdersModal} onOpenChange={setShowPendingOrdersModal}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Pedidos a Devolver - {selectedPendingOrders.mensajero}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedPendingOrders.pedidos.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay pedidos pendientes para este mensajero</p>
                </div>
              ) : (
                <>
                  {/* Resumen de pedidos pendientes */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-orange-800">Total de Pedidos Pendientes</h3>
                        <p className="text-sm text-orange-600">
                          {selectedPendingOrders.pedidos.length} {selectedPendingOrders.pedidos.length === 1 ? 'pedido' : 'pedidos'} sin entregar
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-900">
                          {selectedPendingOrders.pedidos.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de pedidos pendientes */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Pedido</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Método Pago</TableHead>
                          <TableHead>Distrito</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPendingOrders.pedidos.map((pedido) => (
                          <TableRow key={pedido.id_pedido}>
                            <TableCell className="font-mono text-sm">
                              {pedido.id_pedido}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{pedido.cliente_nombre}</p>
                                <p className="text-xs text-gray-500">{pedido.cliente_telefono}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  pedido.estado_pedido === 'PENDIENTE' ? 'secondary' :
                                  pedido.estado_pedido === 'DEVOLUCION' ? 'destructive' :
                                  pedido.estado_pedido === 'REAGENDADO' ? 'outline' : 'secondary'
                                }
                              >
                                {pedido.estado_pedido || 'PENDIENTE'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              ₡{(pedido.valor_total || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {pedido.metodo_pago || 'SIN_METODO'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {pedido.distrito || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de pedidos SINPE */}
      {showSinpeModal && selectedSinpeOrders && (
        <Dialog open={showSinpeModal} onOpenChange={setShowSinpeModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Pedidos SINPE - {selectedViewAndLiquidate?.messengerName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedSinpeOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay pedidos SINPE entregados</p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-800">Total SINPE</h3>
                        <p className="text-sm text-blue-600">
                          {selectedSinpeOrders.length} {selectedSinpeOrders.length === 1 ? 'pedido' : 'pedidos'} entregado{selectedSinpeOrders.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-900">
                          ₡{selectedSinpeOrders.reduce((sum, pedido) => sum + (pedido.valor_total || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedSinpeOrders.map((pedido, index) => (
                      <div key={pedido.id_pedido || index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                              <Smartphone className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{pedido.cliente_nombre}</p>
                              <p className="text-xs text-gray-500">ID: {pedido.id_pedido}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              ₡{(pedido.valor_total || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {pedido.comprobante_sinpe && (
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              onClick={() => window.open(pedido.comprobante_sinpe!, '_blank')}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver Comprobante
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de pedidos Tarjeta */}
      {showTarjetaModal && selectedTarjetaOrders && (
        <Dialog open={showTarjetaModal} onOpenChange={setShowTarjetaModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Pedidos Tarjeta - {selectedViewAndLiquidate?.messengerName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedTarjetaOrders.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay pedidos con tarjeta entregados</p>
                </div>
              ) : (
                <>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-purple-800">Total Tarjeta</h3>
                        <p className="text-sm text-purple-600">
                          {selectedTarjetaOrders.length} {selectedTarjetaOrders.length === 1 ? 'pedido' : 'pedidos'} entregado{selectedTarjetaOrders.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-900">
                          ₡{selectedTarjetaOrders.reduce((sum, pedido) => sum + (pedido.valor_total || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedTarjetaOrders.map((pedido, index) => (
                      <div key={pedido.id_pedido || index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-100">
                              <CreditCard className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{pedido.cliente_nombre}</p>
                              <p className="text-xs text-gray-500">ID: {pedido.id_pedido}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">
                              ₡{(pedido.valor_total || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {pedido.comprobante_sinpe && (
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                              onClick={() => window.open(pedido.comprobante_sinpe!, '_blank')}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver Comprobante
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para actualizar estado de pedido */}
      <Dialog open={isUpdateStatusModalOpen} onOpenChange={setIsUpdateStatusModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Actualizar Estado del Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrderForUpdate && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Pedido: {selectedOrderForUpdate.id_pedido}</p>
                <p className="text-sm text-gray-600">{selectedOrderForUpdate.cliente_nombre}</p>
                <p className="text-sm text-gray-600">Valor: ₡{(selectedOrderForUpdate.valor_total || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-600">Estado actual: {selectedOrderForUpdate.estado_pedido || 'PENDIENTE'}</p>
              </div>
              
              <div>
                <Label htmlFor="new-status">Nuevo Estado</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREGADO">Entregado</SelectItem>
                    <SelectItem value="DEVOLUCION">Devolución</SelectItem>
                    <SelectItem value="REAGENDADO">Reagendado</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus !== 'DEVOLUCION' && newStatus !== 'REAGENDADO' && (
                <div>
                  <Label htmlFor="payment-method">Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="sinpe">SINPE</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="status-comment">Comentarios (opcional)</Label>
                <Textarea
                  id="status-comment"
                  placeholder="Agrega comentarios sobre el cambio de estado..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUpdateStatusModalOpen(false);
                    setSelectedOrderForUpdate(null);
                    setNewStatus('ENTREGADO');
                    setStatusComment('');
                    setPaymentMethod('efectivo');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateOrderStatus}
                  disabled={updatingOrder === selectedOrderForUpdate.id_pedido}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updatingOrder === selectedOrderForUpdate.id_pedido ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Actualizar Estado
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de detalles del pedido */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detalles del Pedido
            </DialogTitle>
          </DialogHeader>
          {selectedOrderForDetails && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">ID del Pedido</Label>
                    <p className="text-lg font-semibold">{selectedOrderForDetails.id_pedido}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                    <p className="text-lg">{selectedOrderForDetails.cliente_nombre}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                    <p className="text-lg">{selectedOrderForDetails.cliente_telefono || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                    <p className="text-lg font-semibold text-green-600">₡{(selectedOrderForDetails.valor_total || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estado</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedOrderForDetails.estado_pedido === 'ENTREGADO' ? 'default' : 'outline'}
                        className={
                          selectedOrderForDetails.estado_pedido === 'ENTREGADO' ? 'bg-green-100 text-green-800' :
                          selectedOrderForDetails.estado_pedido === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrderForDetails.estado_pedido === 'DEVOLUCION' ? 'bg-red-100 text-red-800' :
                          selectedOrderForDetails.estado_pedido === 'REAGENDADO' ? 'bg-blue-100 text-blue-800' : ''
                        }
                      >
                        {selectedOrderForDetails.estado_pedido || 'PENDIENTE'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Método de Pago</Label>
                    <p className="text-lg">{selectedOrderForDetails.metodo_pago || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Mensajero</Label>
                    <p className="text-lg">{selectedOrderForDetails.mensajero_concretado || selectedOrderForDetails.mensajero_asignado || 'SIN_ASIGNAR'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tienda</Label>
                    <p className="text-lg">{selectedOrderForDetails.tienda || 'ALL STARS'}</p>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Dirección de Entrega</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    {selectedOrderForDetails.direccion || 'No especificada'}, {selectedOrderForDetails.distrito || ''}, {selectedOrderForDetails.canton || ''}, {selectedOrderForDetails.provincia || ''}
                  </p>
                </div>
              </div>

              {/* Productos */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Productos</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedOrderForDetails.productos || 'No especificados'}</p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fecha de Creación</Label>
                  <p className="text-sm">{selectedOrderForDetails.fecha_creacion || 'No especificada'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fecha de Entrega</Label>
                  <p className="text-sm">{selectedOrderForDetails.fecha_entrega || 'No especificada'}</p>
                </div>
              </div>

              {/* Notas */}
              {(selectedOrderForDetails.notas || selectedOrderForDetails.nota_asesor) && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notas</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedOrderForDetails.notas || selectedOrderForDetails.nota_asesor}</p>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedOrderForDetails(null);
                  }}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedOrderForUpdate(selectedOrderForDetails);
                    setNewStatus('ENTREGADO');
                    setPaymentMethod(selectedOrderForDetails.metodo_pago || 'efectivo');
                    setIsUpdateStatusModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Estado
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

