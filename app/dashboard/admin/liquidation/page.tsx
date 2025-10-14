'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { RouteLiquidation, RouteLiquidationStats, RouteLiquidationFilters, PedidoTest, TiendaLiquidationCalculation } from '@/lib/types';
import { getLiquidacionesReales, getLiquidacionesRealesByTienda } from '@/lib/supabase-pedidos';
import { ProgressLoader, useProgressLoader } from '@/components/ui/progress-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Truck,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Building2,
  Calculator,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Banknote,
  CreditCard,
  Smartphone,
  Minus,
  Loader2,
  Package,
  Camera,
  ImageIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LiquidationCalculation {
  messengerId: string;
  messengerName: string;
  routeDate: string;
  initialAmount: number;
  totalCollected: number;
  totalSpent: number;
  sinpePayments: number;
  cashPayments: number;
  tarjetaPayments: number;
  finalAmount: number;
  orders: PedidoTest[];
  isLiquidated: boolean;
  canEdit: boolean;
}

export default function AdminLiquidationPage() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<LiquidationCalculation[]>([]);
  const [tiendaCalculations, setTiendaCalculations] = useState<TiendaLiquidationCalculation[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Estados para modal de pedidos pendientes
  const [isPendingOrdersModalOpen, setIsPendingOrdersModalOpen] = useState(false);
  
  // Estados para modal de liquidación
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationCalculation | null>(null);
  
  // Estados para modales adicionales
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  const [showSinpeModal, setShowSinpeModal] = useState(false);
  const [showTarjetaModal, setShowTarjetaModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  
  // Estados para datos de modales
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
  
  const [selectedPendingOrders, setSelectedPendingOrders] = useState<{
    mensajero: string;
    pedidos: PedidoTest[];
  } | null>(null);
  
  const [selectedSinpeOrders, setSelectedSinpeOrders] = useState<PedidoTest[]>([]);
  const [selectedTarjetaOrders, setSelectedTarjetaOrders] = useState<PedidoTest[]>([]);
  
  // Estados para actualizar pedido
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState<PedidoTest | null>(null);
  const [newStatus, setNewStatus] = useState<string>('ENTREGADO');
  const [statusComment, setStatusComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  
  // Estados adicionales para el modal completo de actualización
  const [uploadedReceipts, setUploadedReceipts] = useState<string[]>([]);
  const [uploadedEvidence, setUploadedEvidence] = useState<string | null>(null);
  const [isDualPayment, setIsDualPayment] = useState(false);
  const [firstPaymentMethod, setFirstPaymentMethod] = useState<string>('efectivo');
  const [secondPaymentMethod, setSecondPaymentMethod] = useState<string>('');
  const [firstPaymentAmount, setFirstPaymentAmount] = useState<string>('');
  const [secondPaymentAmount, setSecondPaymentAmount] = useState<string>('');
  const [firstPaymentReceipt, setFirstPaymentReceipt] = useState<string | null>(null);
  const [secondPaymentReceipt, setSecondPaymentReceipt] = useState<string | null>(null);
  const [reagendadoDate, setReagendadoDate] = useState<Date | null>(null);
  const [isReagendadoDatePickerOpen, setIsReagendadoDatePickerOpen] = useState(false);
  const [isReagendadoAsChange, setIsReagendadoAsChange] = useState(false);
  
  // Estados para filtros en el modal
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  
  // Estados para modal de liquidación de tienda
  const [showStoreLiquidationModal, setShowStoreLiquidationModal] = useState(false);
  const [selectedStoreLiquidation, setSelectedStoreLiquidation] = useState<TiendaLiquidationCalculation | null>(null);
  
  // Estados para filtros en el modal de tienda
  const [storeOrderStatusFilter, setStoreOrderStatusFilter] = useState('all');
  const [storeOrderPaymentFilter, setStoreOrderPaymentFilter] = useState('all');
  
  // Estados para paginación de tiendas
  const [currentStorePage, setCurrentStorePage] = useState(1);
  const storesPerPage = 30;
  
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
    const initializeDate = async () => {
      if (!selectedDate) {
        const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
        const costaRicaDate = getCostaRicaDateISO();
        setSelectedDate(costaRicaDate);
        return;
      }
      setLoading(true);
      await loadCalculations();
      await loadTiendaCalculations();
    };
    
    initializeDate();
  }, [selectedDate]);

  const loadCalculations = async (isReload = false) => {
    try {
      console.log('🚀 Cargando liquidaciones para fecha:', selectedDate);
      
      setIsLoadingData(true);
      
      if (!isReload) {
        startLoader('Procesando Liquidaciones', [
          { id: 'mensajeros', label: 'Obteniendo mensajeros únicos', status: 'pending' },
          { id: 'pedidos', label: 'Cargando pedidos del día', status: 'pending' },
          { id: 'calculations', label: 'Calculando liquidaciones', status: 'pending' },
          { id: 'finalization', label: 'Finalizando proceso', status: 'pending' }
        ]);
      }
      
      setStepStatus('mensajeros', 'loading', 'Buscando mensajeros en la base de datos...');
      
      let fechaParaUsar = selectedDate;
      if (!fechaParaUsar) {
        const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
        fechaParaUsar = getCostaRicaDateISO();
      }
      
      const liquidacionesReales = await getLiquidacionesReales(fechaParaUsar);
      console.log('✅ Liquidaciones reales obtenidas:', liquidacionesReales.length);
      
      setStepStatus('mensajeros', 'completed', `${liquidacionesReales.length} mensajeros encontrados`);
      setProgress(30);
      
      // Pequeño delay para mostrar el progreso
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStepStatus('pedidos', 'loading', 'Recopilando pedidos por mensajero...');
      await new Promise(resolve => setTimeout(resolve, 300));
      setStepStatus('pedidos', 'completed', 'Pedidos cargados correctamente');
      setProgress(60);
      
      // Pequeño delay para mostrar el progreso
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStepStatus('calculations', 'loading', 'Procesando totales y montos...');
      
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
        isLiquidated: liquidation.isLiquidated,
        canEdit: !liquidation.isLiquidated
      }));
      
      console.log('✅ Calculations generadas:', calculations.length);
      // Pequeño delay para mostrar el progreso
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStepStatus('calculations', 'completed', 'Liquidaciones calculadas correctamente');
      setProgress(90);
      
      setStepStatus('finalization', 'loading', 'Preparando datos para mostrar...');
      await new Promise(resolve => setTimeout(resolve, 300));
      setCalculations(calculations);
      setStepStatus('finalization', 'completed', 'Proceso completado');
      setProgress(100);
      
      setTimeout(() => {
        closeLoader();
        setIsLoadingData(false);
        setLoading(false);
      }, isReload ? 1000 : 2000);
      
    } catch (error) {
      console.error('❌ Error loading calculations:', error);
      setStepStatus('calculations', 'error', 'Error en el cálculo');
      setStepStatus('finalization', 'error', 'Proceso falló');
      
      setTimeout(() => {
        closeLoader();
        setIsLoadingData(false);
        setLoading(false);
      }, 3000);
      
      setCalculations([]);
    }
  };

  const loadTiendaCalculations = async () => {
    try {
      console.log('🚀 Cargando liquidaciones por tienda para fecha:', selectedDate);
      
      startLoader('Procesando Liquidaciones por Tienda', [
        { id: 'tiendas', label: 'Obteniendo tiendas únicas', status: 'pending' },
        { id: 'pedidos', label: 'Cargando pedidos del día', status: 'pending' },
        { id: 'calculations', label: 'Calculando liquidaciones', status: 'pending' },
        { id: 'finalization', label: 'Finalizando proceso', status: 'pending' }
      ]);
      
      setStepStatus('tiendas', 'loading', 'Buscando tiendas en la base de datos...');
      
      let fechaParaUsar = selectedDate;
      if (!fechaParaUsar) {
        const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
        fechaParaUsar = getCostaRicaDateISO();
      }
      
      const liquidacionesReales = await getLiquidacionesRealesByTienda(fechaParaUsar);
      console.log('✅ Liquidaciones por tienda obtenidas:', liquidacionesReales.length);
      
      setStepStatus('tiendas', 'completed', `${liquidacionesReales.length} tiendas encontradas`);
      setProgress(30);
      
      setStepStatus('pedidos', 'loading', 'Recopilando pedidos por tienda...');
      setStepStatus('pedidos', 'completed', 'Pedidos cargados correctamente');
      setProgress(60);
      
      setStepStatus('calculations', 'loading', 'Procesando totales y montos...');
      
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
      
      setStepStatus('finalization', 'loading', 'Preparando datos para mostrar...');
      setTiendaCalculations(calculations);
      setStepStatus('finalization', 'completed', 'Proceso completado');
      setProgress(100);
      
      setTimeout(() => {
        closeLoader();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error loading tienda calculations:', error);
      setStepStatus('calculations', 'error', 'Error en el cálculo');
      setStepStatus('finalization', 'error', 'Proceso falló');
      
      setTimeout(() => {
        closeLoader();
      }, 3000);
      
      setTiendaCalculations([]);
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

    const totalSpent = calculation.totalSpent;
    // Total a entregar = Plata inicial + Efectivo recaudado - Gastos (SINPE no se entrega físicamente)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (isLiquidated: boolean) => {
    if (isLiquidated) {
      return <Badge className="bg-green-100 text-green-800">Liquidado</Badge>;
    }
    return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pendiente</Badge>;
  };

  const handleViewLiquidation = (calculation: LiquidationCalculation) => {
    setSelectedLiquidation(calculation);
    setShowLiquidationModal(true);
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

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrderForUpdate || !newStatus) return;
    
    try {
      setUpdatingOrder(selectedOrderForUpdate.id_pedido);
      
      const webhookData = {
        idPedido: selectedOrderForUpdate.id_pedido,
        mensajero: selectedOrderForUpdate.mensajero_concretado || selectedOrderForUpdate.mensajero_asignado || 'SIN_ASIGNAR',
        usuario: 'Admin', // Usuario admin
        
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
        tienda: selectedOrderForUpdate.tienda || 'ALL STARS',
        
        // Campos adicionales para el modal completo
        comprobantes: uploadedReceipts,
        evidencia_comunicacion: uploadedEvidence,
        es_reagendado_cambio: isReagendadoAsChange,
        fecha_reagendado: reagendadoDate ? reagendadoDate.toISOString() : null,
        
        // Campos para pagos duales
        primer_metodo_pago: firstPaymentMethod,
        segundo_metodo_pago: secondPaymentMethod,
        primer_monto: firstPaymentAmount ? parseFloat(firstPaymentAmount) : null,
        segundo_monto: secondPaymentAmount ? parseFloat(secondPaymentAmount) : null,
        primer_comprobante: firstPaymentReceipt,
        segundo_comprobante: secondPaymentReceipt
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
        await loadCalculations(true);
        
        setShowUpdateStatusModal(false);
        setSelectedOrderForUpdate(null);
        setNewStatus('ENTREGADO');
        setStatusComment('');
        setPaymentMethod('efectivo');
        
        // Resetear todos los estados del modal
        resetModalState();
        
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

  const handleEditOrderStatus = (pedido: PedidoTest) => {
    setSelectedOrderForUpdate(pedido);
    setNewStatus(pedido.estado_pedido || 'ENTREGADO');
    setStatusComment('');
    setPaymentMethod(pedido.metodo_pago || 'efectivo');
    setShowUpdateStatusModal(true);
    resetModalState();
  };

  // Función para resetear el estado del modal
  const resetModalState = () => {
    setUploadedReceipts([]);
    setUploadedEvidence(null);
    setIsDualPayment(false);
    setFirstPaymentMethod('efectivo');
    setSecondPaymentMethod('');
    setFirstPaymentAmount('');
    setSecondPaymentAmount('');
    setFirstPaymentReceipt(null);
    setSecondPaymentReceipt(null);
    setReagendadoDate(null);
    setIsReagendadoDatePickerOpen(false);
    setIsReagendadoAsChange(false);
  };

  // Función para manejar subida de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'receipt' | 'evidence') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'receipt') {
        setUploadedReceipts(prev => [...prev, result]);
      } else if (type === 'evidence') {
        setUploadedEvidence(result);
      }
    };
    
    reader.readAsDataURL(file);
  };

  // Función para manejar subida de archivos en pagos duales
  const handleDualPaymentFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'first' | 'second') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'first') {
        setFirstPaymentReceipt(result);
      } else if (type === 'second') {
        setSecondPaymentReceipt(result);
      }
    };
    
    reader.readAsDataURL(file);
  };

  // Funciones para iconos y colores de gastos
  const getExpenseIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'combustible': return <Truck className="w-4 h-4" />;
      case 'mantenimiento': return <Calculator className="w-4 h-4" />;
      case 'peaje': return <Truck className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getExpenseColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'combustible': return 'bg-blue-100 text-blue-600';
      case 'mantenimiento': return 'bg-orange-100 text-orange-600';
      case 'peaje': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleViewComprobante = (comprobante: string) => {
    window.open(comprobante, '_blank', 'noopener,noreferrer');
  };

  const handleViewPedidoComprobante = (pedido: any) => {
    // Buscar el comprobante del pedido en los datos
    if (pedido.comprobante_link) {
      window.open(pedido.comprobante_link, '_blank', 'noopener,noreferrer');
    } else {
      alert(`No hay comprobante disponible para el pedido ${pedido.id_pedido}`);
    }
  };

  const handleViewStoreLiquidation = (tienda: TiendaLiquidationCalculation) => {
    setSelectedStoreLiquidation(tienda);
    setShowStoreLiquidationModal(true);
  };

  if (loading && !isLoaderVisible) {
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

      {/* Métricas Unificadas */}
      <div className="mb-6">
        {/* Primera fila de métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mensajeros con Pedidos</p>
                  <p className="text-lg font-semibold">{calculations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendientes por Liquidar</p>
                  <p className="text-lg font-semibold">{calculations.filter(calc => !calculateLiquidation(calc).isLiquidated).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Recaudado</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(calculations.reduce((sum, calc) => sum + calculateLiquidation(calc).totalCollected, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total a Entregar</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {formatCurrency(calculations.reduce((sum, calc) => sum + calculateLiquidation(calc).finalAmount, 0))}
                  </p>
                  <p className="text-xs text-gray-500">(Efectivo - Gastos)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segunda fila de métricas de pedidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos Entregados</p>
                  <p className="text-lg font-semibold text-green-600">
                    {calculations.reduce((sum, calc) => sum + calc.orders.filter(o => o.estado_pedido === 'ENTREGADO').length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos Pendientes</p>
                  <p className="text-lg font-semibold text-yellow-600">
                    {calculations.reduce((sum, calc) => sum + calc.orders.filter(o => o.estado_pedido === 'PENDIENTE').length, 0)}
                  </p>
                          </div>
                            </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                            </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos Devueltos</p>
                  <p className="text-lg font-semibold text-red-600">
                    {calculations.reduce((sum, calc) => sum + calc.orders.filter(o => o.estado_pedido === 'DEVOLUCION').length, 0)}
                  </p>
                          </div>
                        </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos Reagendados</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {calculations.reduce((sum, calc) => sum + calc.orders.filter(o => o.estado_pedido === 'REAGENDADO').length, 0)}
                  </p>
                    </div>
              </div>
            </CardContent>
          </Card>
                  </div>

        {/* Tercera fila de métricas de pagos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-green-600" />
                    </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagos en Efectivo</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(calculations.reduce((sum, calc) => sum + calculateLiquidation(calc).cashPayments, 0))}
                  </p>
                          </div>
                            </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                            </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagos SINPE</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(calculations.reduce((sum, calc) => sum + calculateLiquidation(calc).sinpePayments, 0))}
                  </p>
                          </div>
                        </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                        </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagos con Tarjeta</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {formatCurrency(calculations.reduce((sum, calc) => sum + (calculateLiquidation(calc).tarjetaPayments || 0), 0))}
                  </p>
                    </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Minus className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Gastos</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(calculations.reduce((sum, calc) => sum + calculateLiquidation(calc).totalSpent, 0))}
                  </p>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Botón para ver pedidos pendientes */}
        <div className="flex justify-center mb-4">
          <Button 
            onClick={() => setIsPendingOrdersModalOpen(true)}
            variant="outline"
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Ver Pedidos Pendientes y Sin Asignar
            <Badge variant="secondary" className="ml-2">
              {(() => {
                const pedidosPendientes = calculations.flatMap(calc => 
                  calc.orders.filter(o => o.estado_pedido === 'PENDIENTE')
                );
                const pedidosSinAsignar = calculations.flatMap(calc =>
                  calc.orders.filter(o => !o.mensajero_asignado || o.mensajero_asignado === '')
                );
                return pedidosPendientes.length + pedidosSinAsignar.length;
      })()}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Tabla de Liquidaciones de Mensajeros */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Liquidaciones por Ruta - {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center py-1 font-semibold text-xs">Mensajero</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Pedidos</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Total Recaudado</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Pagos SINPE</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Pagos Efectivo</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Pagos Tarjeta</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Gastos</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Total a Entregar</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Estado</TableHead>
                <TableHead className="text-center py-1 font-semibold text-xs">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
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
                  
                  const pedidosEntregados = calculated.orders.filter(p => p.estado_pedido === 'ENTREGADO').length;
                  const pedidosPendientes = calculated.orders.filter(p => p.estado_pedido === 'PENDIENTE').length;
                  const pedidosDevueltos = calculated.orders.filter(p => p.estado_pedido === 'DEVOLUCION').length;
                  const pedidosReagendados = calculated.orders.filter(p => p.estado_pedido === 'REAGENDADO').length;
                  
                  const valorEntregados = calculated.orders
                    .filter(p => p.estado_pedido === 'ENTREGADO')
                    .reduce((sum, p) => sum + p.valor_total, 0);
                  const valorPendientes = calculated.orders
                    .filter(p => p.estado_pedido === 'PENDIENTE')
                    .reduce((sum, p) => sum + p.valor_total, 0);
                  const valorDevueltos = calculated.orders
                    .filter(p => p.estado_pedido === 'DEVOLUCION')
                    .reduce((sum, p) => sum + p.valor_total, 0);
                  
                  return (
                    <TableRow key={calculation.messengerId}>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <div>
                            <span className="font-semibold text-sm">{calculation.messengerName}</span>
                            <div className="text-xs text-muted-foreground">
                              {calculated.orders.length} pedidos
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-green-600 text-xs">{pedidosEntregados}</span>
                            <span className="text-xs text-muted-foreground">entregados</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                            <span className="font-semibold text-yellow-600 text-xs">{pedidosPendientes}</span>
                            <span className="text-xs text-muted-foreground">pendientes</span>
                          </div>
                          {pedidosDevueltos > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              <span className="font-semibold text-red-600 text-xs">{pedidosDevueltos}</span>
                              <span className="text-xs text-muted-foreground">devueltos</span>
                            </div>
                          )}
                          {pedidosReagendados > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span className="font-semibold text-blue-600 text-xs">{pedidosReagendados}</span>
                              <span className="text-xs text-muted-foreground">reagendados</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="font-bold text-green-600 text-xs">
                            {formatCurrency(calculated.totalCollected)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-blue-600" />
                          <span className="font-bold text-blue-600 text-xs">
                            {formatCurrency(calculated.sinpePayments)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1">
                          <Banknote className="w-3 h-3 text-green-600" />
                          <span className="font-bold text-green-600 text-xs">
                            {formatCurrency(calculated.cashPayments)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-purple-600" />
                          <span className="font-bold text-purple-600 text-xs">
                            {formatCurrency(calculated.tarjetaPayments || 0)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1">
                          <Minus className="w-3 h-3 text-red-600" />
                          <span className="font-bold text-red-600 text-xs">
                            {formatCurrency(calculated.totalSpent)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-purple-600" />
                          <span className="font-bold text-purple-600 text-xs">
                            {formatCurrency(calculated.finalAmount)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="flex justify-center">
                          {getStatusBadge(calculated.isLiquidated)}
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-1">
                        <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleViewLiquidation(calculated)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs h-5"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Ver
                              </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Tabla de Liquidaciones por Tienda */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Liquidaciones por Tienda - {selectedDate}
            </CardTitle>
          </CardHeader>
            <CardContent className="p-4">
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="text-center py-1 font-semibold text-xs">Tienda</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Pedidos</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Total Valor</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Total Recaudado</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Pagos SINPE</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Pagos Efectivo</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Pagos Tarjeta</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Gastos</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Total a Entregar</TableHead>
                    <TableHead className="text-center py-1 font-semibold text-xs">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {tiendaCalculations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Building2 className="w-12 h-12 text-gray-400" />
                <div>
                            <p className="text-lg font-medium text-gray-600">No hay tiendas con pedidos</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              No se encontraron tiendas con pedidos para la fecha {selectedDate}
                  </p>
                </div>
              </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tiendaCalculations
                      .slice((currentStorePage - 1) * storesPerPage, currentStorePage * storesPerPage)
                      .map((tienda, index) => (
                      <TableRow key={index}>
                        <TableCell className="py-1">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                <div>
                              <span className="font-semibold text-sm">{tienda.tienda}</span>
                              <div className="text-xs text-muted-foreground">
                                {tienda.totalOrders} pedidos
                </div>
              </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-1">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="font-semibold text-green-600 text-xs">{tienda.deliveredOrders}</span>
                              <span className="text-xs text-muted-foreground">entregados</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                              <span className="font-semibold text-yellow-600 text-xs">{tienda.pendingOrders}</span>
                              <span className="text-xs text-muted-foreground">pendientes</span>
                            </div>
                            {tienda.returnedOrders > 0 && (
                              <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                <span className="font-semibold text-red-600 text-xs">{tienda.returnedOrders}</span>
                                <span className="text-xs text-muted-foreground">devueltos</span>
                            </div>
                            )}
                            {tienda.rescheduledOrders > 0 && (
                              <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="font-semibold text-blue-600 text-xs">{tienda.rescheduledOrders}</span>
                                <span className="text-xs text-muted-foreground">reagendados</span>
                            </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-1">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-600" />
                            <span className="font-bold text-gray-600 text-xs">
                              {formatCurrency(tienda.totalValue)}
                          </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-1">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            <span className="font-bold text-green-600 text-xs">
                            {formatCurrency(tienda.totalCollected)}
                          </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-1">
                          <div className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-blue-600" />
                            <span className="font-bold text-blue-600 text-xs">
                            {formatCurrency(tienda.sinpePayments)}
                          </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-1">
                          <div className="flex items-center gap-1">
                                      <Banknote className="w-3 h-3 text-green-600" />
                            <span className="font-bold text-green-600 text-xs">
                                      {formatCurrency(tienda.cashPayments)}
                                    </span>
                                  </div>
                        </TableCell>

                        <TableCell className="py-1">
                          <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-purple-600" />
                            <span className="font-bold text-purple-600 text-xs">
                              {formatCurrency(tienda.tarjetaPayments || 0)}
                          </span>
                        </div>
                        </TableCell>

                        <TableCell className="py-1">
                          <div className="flex items-center gap-1">
                            <Minus className="w-3 h-3 text-red-600" />
                            <span className="font-bold text-red-600 text-xs">
                            {formatCurrency(tienda.totalSpent)}
                          </span>
                          </div>
                                    </TableCell>

                        <TableCell className="py-1">
                          <div className="flex items-center gap-1">
                            <Calculator className="w-3 h-3 text-purple-600" />
                            <span className="font-bold text-purple-600 text-xs">
                            {formatCurrency(tienda.finalAmount)}
                                      </span>
                          </div>
                                    </TableCell>

                        <TableCell className="py-1">
                          <div className="flex items-center justify-center gap-1">
                                        <Button
                                          size="sm"
                              onClick={() => handleViewStoreLiquidation(tienda)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs h-5"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver
                            </Button>
                          </div>
                        </TableCell>
                                  </TableRow>
                    ))
                  )}
                            </TableBody>
                          </Table>
                        </div>

                  {/* Paginación para liquidaciones de tienda */}
                  {tiendaCalculations.length > storesPerPage && (
                    <div className="flex items-center justify-between mt-4 px-4">
                      <div className="text-sm text-gray-700">
                        Mostrando {((currentStorePage - 1) * storesPerPage) + 1} a {Math.min(currentStorePage * storesPerPage, tiendaCalculations.length)} de {tiendaCalculations.length} tiendas
                              </div>
                      <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                          onClick={() => setCurrentStorePage(prev => Math.max(1, prev - 1))}
                          disabled={currentStorePage === 1}
                                >
                                  Anterior
                                </Button>
                        <span className="flex items-center px-3 py-1 text-sm">
                          Página {currentStorePage} de {Math.ceil(tiendaCalculations.length / storesPerPage)}
                        </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                          onClick={() => setCurrentStorePage(prev => Math.min(Math.ceil(tiendaCalculations.length / storesPerPage), prev + 1))}
                          disabled={currentStorePage === Math.ceil(tiendaCalculations.length / storesPerPage)}
                                >
                                  Siguiente
                                </Button>
                              </div>
                      </div>
                    )}
          </CardContent>
        </Card>
            </div>

      {/* Modal de Pedidos Pendientes y Sin Asignar */}
      <Dialog open={isPendingOrdersModalOpen} onOpenChange={setIsPendingOrdersModalOpen}>
        <DialogContent className="sm:max-w-[1200px] max-h-[85vh] overflow-hidden flex flex-col">
                              <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Pedidos Pendientes y Sin Asignar
              </DialogTitle>
                              </DialogHeader>
          
            <div className="space-y-4">
                              {(() => {
              const pedidosPendientes = calculations.flatMap(calc => 
                calc.orders.filter(o => o.estado_pedido === 'PENDIENTE')
              );
              const pedidosSinAsignar = calculations.flatMap(calc =>
                calc.orders.filter(o => !o.mensajero_asignado || o.mensajero_asignado === '')
              );
                          
                return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pedidos Pendientes */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-lg">Pedidos Pendientes</h3>
                      <Badge variant="secondary">{pedidosPendientes.length}</Badge>
                    </div>
                    <div className="max-h-80 overflow-y-autospace-y-2">
                      {pedidosPendientes.map(pedido => (
                        <div key={pedido.id_pedido} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{pedido.id_pedido}</span>
                            <Badge variant="outline" className="text-yellow-600">
                              {formatCurrency(pedido.valor_total)}
                              </Badge>
                            </div>
                          <div className="text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{pedido.tienda}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <User className="w-3 h-3" />
                              <span>{pedido.mensajero_asignado || 'Sin asignar'}</span>
                          </div>
                          </div>
                      </div>
                          ))}
                      {pedidosPendientes.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                          No hay pedidos pendientes
                      </div>
                    )}
                  </div>
            </div>

                  {/* Pedidos Sin Asignar */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-lg">Sin Asignar</h3>
                      <Badge variant="destructive">{pedidosSinAsignar.length}</Badge>
                  </div>
                    <div className="max-h-80 overflow-y-autospace-y-2">
                      {pedidosSinAsignar.map(pedido => (
                        <div key={pedido.id_pedido} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{pedido.id_pedido}</span>
                            <Badge variant="outline" className="text-red-600">
                              {formatCurrency(pedido.valor_total)}
                            </Badge>
                  </div>
                          <div className="text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{pedido.tienda}</span>
                  </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {pedido.estado_pedido || 'PENDIENTE'}
                              </Badge>
                  </div>
                  </div>
                  </div>
                        ))}
                      {pedidosSinAsignar.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          Todos los pedidos están asignados
                </div>
                        )}
              </div>
              </div>
              </div>
                );
            })()}
            </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Liquidación de Mensajero - Diseño Completo */}
      <Dialog open={showLiquidationModal} onOpenChange={setShowLiquidationModal}>
        <DialogContent className="sm:max-w-[1400px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calculator className="w-6 h-6 text-blue-600" />
              Liquidación de Mensajero - {selectedLiquidation?.messengerName}
              </DialogTitle>
            </DialogHeader>
          
          {selectedLiquidation && (
            <div className="space-y-4">
              {/* Sección Superior Optimizada - Resumen Completo */}
              <div className="grid grid-cols-12 gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                {/* Total a Entregar - Destacado (3 columnas) */}
                <div className="col-span-3 bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-700 text-sm">Total a Entregar</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mb-1">
                    {formatCurrency(selectedLiquidation.finalAmount)}
                  </p>
                  <p className="text-xs text-purple-700">(Efectivo - Gastos)</p>
                </div>

                {/* Gastos (2 columnas) */}
                <div className="col-span-2 bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Minus className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-700 text-sm">Gastos</span>
                  </div>
                  <p className="text-lg font-bold text-red-600 mb-1">
                    {formatCurrency(selectedLiquidation.totalSpent)}
                  </p>
                  <button 
                    onClick={() => handleViewExpenses(selectedLiquidation)}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Ver detalles
                  </button>
                </div>

                {/* Total Recaudado con Fórmula (4 columnas) */}
                <div className="col-span-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-700 text-sm">Total Recaudado</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600 mb-2">
                    {formatCurrency(selectedLiquidation.totalCollected)}
                  </p>
                  {/* Fórmula desglosada */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efectivo:</span>
                      <span className="font-medium text-green-600">{formatCurrency(selectedLiquidation.cashPayments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SINPE:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(selectedLiquidation.sinpePayments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarjeta:</span>
                      <span className="font-medium text-purple-600">{formatCurrency(selectedLiquidation.tarjetaPayments || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Filtros por Método de Pago como Botones (3 columnas) */}
                <div className="col-span-3 space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Filtros por Pago</h4>
                  
                  {/* Botón Efectivo */}
                  <button
                    onClick={() => setOrderPaymentFilter(orderPaymentFilter === 'EFECTIVO' ? 'all' : 'EFECTIVO')}
                    className={`w-full p-2 rounded-lg border text-left transition-all ${
                      orderPaymentFilter === 'EFECTIVO' 
                        ? 'bg-green-100 border-green-300 text-green-700' 
                        : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      <span className="font-medium text-sm">Efectivo</span>
                    </div>
                    <p className="text-xs font-bold mt-1">
                      {formatCurrency(selectedLiquidation.cashPayments)}
                    </p>
                  </button>

                  {/* Botón SINPE */}
                  <button
                    onClick={() => setOrderPaymentFilter(orderPaymentFilter === 'SINPE' ? 'all' : 'SINPE')}
                    className={`w-full p-2 rounded-lg border text-left transition-all ${
                      orderPaymentFilter === 'SINPE' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700' 
                        : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="font-medium text-sm">SINPE</span>
                    </div>
                    <p className="text-xs font-bold mt-1">
                      {formatCurrency(selectedLiquidation.sinpePayments)}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSinpeOrders(selectedLiquidation);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                    >
                      Ver comprobantes
                    </button>
                  </button>

                  {/* Botón Tarjeta */}
                  <button
                    onClick={() => setOrderPaymentFilter(orderPaymentFilter === 'TARJETA' ? 'all' : 'TARJETA')}
                    className={`w-full p-2 rounded-lg border text-left transition-all ${
                      orderPaymentFilter === 'TARJETA' 
                        ? 'bg-purple-100 border-purple-300 text-purple-700' 
                        : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium text-sm">Tarjeta</span>
                    </div>
                    <p className="text-xs font-bold mt-1">
                      {formatCurrency(selectedLiquidation.tarjetaPayments || 0)}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTarjetaOrders(selectedLiquidation);
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800 mt-1 underline"
                    >
                      Ver comprobantes
                    </button>
                  </button>
                </div>
              </div>

              {/* Sección de Métricas y Filtros de Estado */}
              <div className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg border">
                {/* Métricas de Pedidos (6 columnas) */}
                <div className="col-span-6 grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-blue-50 rounded text-xs">
                    <p className="font-bold text-blue-600 text-sm">{selectedLiquidation.orders.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded text-xs">
                    <p className="font-bold text-green-600 text-sm">{selectedLiquidation.orders.filter(o => o.estado_pedido === 'ENTREGADO').length}</p>
                    <p className="text-xs text-muted-foreground">Entregados</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded text-xs">
                    <p className="font-bold text-red-600 text-sm">{selectedLiquidation.orders.filter(o => o.estado_pedido === 'DEVOLUCION').length}</p>
                    <p className="text-xs text-muted-foreground">Devueltos</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded text-xs">
                    <p className="font-bold text-orange-600 text-sm">{selectedLiquidation.orders.filter(o => o.estado_pedido === 'REAGENDADO').length}</p>
                    <p className="text-xs text-muted-foreground">Reagendados</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded text-xs">
                    <p className="font-bold text-yellow-600 text-sm">{selectedLiquidation.orders.filter(o => o.estado_pedido === 'PENDIENTE').length}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded text-xs">
                    <p className="font-bold text-gray-600 text-sm">{selectedLiquidation.orders.filter(o => !o.mensajero_asignado).length}</p>
                    <p className="text-xs text-muted-foreground">Sin Asignar</p>
                  </div>
                </div>
                
                {/* Filtros de Estado y Botones (6 columnas) */}
                <div className="col-span-6 flex items-center justify-end gap-2">
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-24 h-7 text-xs">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ENTREGADO">Entregados</SelectItem>
                      <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                      <SelectItem value="DEVOLUCION">Devueltos</SelectItem>
                      <SelectItem value="REAGENDADO">Reagendados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPendingOrders(selectedLiquidation)}
                    className="h-7 px-2 text-xs"
                  >
                    Pendientes
                  </Button>
                </div>
              </div>
                    


                {/* Filtros por Método de Pago */}
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Filtros por Método de Pago</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Banknote className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-700 text-sm">Efectivo</span>
                        </div>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedLiquidation.cashPayments)}
                          </p>
                        </div>
                      
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-700 text-sm">SINPE</span>
                        </div>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(selectedLiquidation.sinpePayments)}
                      </p>
                      <button 
                        onClick={() => handleViewSinpeOrders(selectedLiquidation)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                      >
                        Ver comprobantes
                      </button>
                        </div>
                      
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-700 text-sm">Tarjeta</span>
                        </div>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(selectedLiquidation.tarjetaPayments || 0)}
                      </p>
                      <button 
                        onClick={() => handleViewTarjetaOrders(selectedLiquidation)}
                        className="text-xs text-purple-600 hover:text-purple-800 mt-1 underline"
                      >
                        Ver comprobantes
                      </button>
                      </div>
                    </CardContent>
                  </Card>

                {/* Plata Inicial */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      + Plata Inicial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Monto (₡)</label>
                        <Input 
                          type="number" 
                          value={selectedLiquidation.initialAmount} 
                          disabled
                          className="w-full mt-1"
                        />
                          </div>
                      <p className="text-sm text-gray-500">
                        Monto entregado al mensajero en efectivo
                          </p>
                        </div>
          </CardContent>
        </Card>

                {/* Cálculo Final */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Cálculo Final</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-green-700">Plata Inicial</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedLiquidation.initialAmount)}</span>
                          </div>
                      <p className="text-xs text-gray-600">Monto entregado al mensajero</p>
                        </div>
              
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-blue-700">Total Recaudado</span>
                        <span className="font-bold text-blue-600">{formatCurrency(selectedLiquidation.totalCollected)}</span>
                          </div>
                      <p className="text-xs text-gray-600">Total recaudado por entregas</p>
                      
                      {/* Desglose del total recaudado */}
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Efectivo:</span>
                          <span className="font-medium">{formatCurrency(selectedLiquidation.cashPayments)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">SINPE:</span>
                          <span className="font-medium">{formatCurrency(selectedLiquidation.sinpePayments)}</span>
                      </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tarjeta:</span>
                          <span className="font-medium">{formatCurrency(selectedLiquidation.tarjetaPayments || 0)}</span>
                    </div>
                        </div>
                      </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-red-700">Gastos</span>
                        <span className="font-bold text-red-600">{formatCurrency(selectedLiquidation.totalSpent)}</span>
                        </div>
                      <p className="text-xs text-gray-600">Gastos reportados por el mensajero</p>
                        </div>

                    <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-green-700">Efectivo para liquidación</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedLiquidation.cashPayments)}</span>
                        </div>
                      <p className="text-xs text-gray-600">Solo el efectivo se entrega físicamente</p>
                        </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                          <span className="text-lg font-semibold text-purple-700">Total a Entregar</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-600">
                          {formatCurrency(selectedLiquidation.finalAmount)}
                        </p>
                        <p className="text-sm text-purple-700 mt-1">Confirmado para entrega</p>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                </div>

              {/* Tabla de Pedidos - Sin Card para maximizar espacio */}
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-gray-50">
                  <h3 className="font-semibold text-sm">Detalle de Pedidos ({selectedLiquidation.orders.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ID</TableHead>
                        <TableHead className="w-24">Cliente</TableHead>
                        <TableHead className="w-32">Producto</TableHead>
                        <TableHead className="w-16">Valor</TableHead>
                        <TableHead className="w-16">Método</TableHead>
                        <TableHead className="w-16">Estado</TableHead>
                        <TableHead className="w-16">Fecha</TableHead>
                        <TableHead className="w-20">Acciones</TableHead>
                        <TableHead className="min-w-24">Dirección</TableHead>
                      </TableRow>
                    </TableHeader>
                        <TableBody>
                          {selectedLiquidation.orders
                          .filter(pedido => {
                              const statusMatch = orderStatusFilter === 'all' || pedido.estado_pedido === orderStatusFilter;
                            const paymentMatch = orderPaymentFilter === 'all' || pedido.metodo_pago === orderPaymentFilter;
                            return statusMatch && paymentMatch;
                          })
                          .map((pedido) => (
                            <TableRow key={pedido.id_pedido} className="text-xs">
                              <TableCell className="font-medium text-xs">{pedido.id_pedido}</TableCell>
                              <TableCell className="max-w-24 truncate text-xs">{pedido.cliente_nombre}</TableCell>
                              <TableCell className="max-w-32 truncate text-xs">{pedido.productos || 'No especificado'}</TableCell>
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
                              <TableCell className="text-xs">{new Date(pedido.fecha_creacion).toLocaleDateString('es-CR')}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                    onClick={() => handleEditOrderStatus(pedido)}
                                    className="text-xs px-1 py-0.5 h-5 w-full"
                                    >
                                    Editar
                                    </Button>
                                  {pedido.estado_pedido === 'PENDIENTE' && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedOrderForUpdate(pedido);
                                        setNewStatus('ENTREGADO');
                                        setShowUpdateStatusModal(true);
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-1 py-0.5 h-5 w-full"
                                    >
                                      Entrega
                                    </Button>
                                  )}
                                  {pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago && pedido.metodo_pago !== 'EFECTIVO' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleViewPedidoComprobante(pedido)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-1 py-0.5 h-5 w-full"
                                    >
                                      Comprobante
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-24 truncate text-xs">{pedido.direccion}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
            
                {/* Botón de Confirmar Liquidación */}
              <div className="flex justify-end">
                <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    onClick={() => {
                      alert(`Liquidación confirmada para ${selectedLiquidation.messengerName}. Total a entregar: ${formatCurrency(selectedLiquidation.finalAmount)}`);
                      setShowLiquidationModal(false);
                    }}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirmar Liquidación
                </Button>
              </div>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Liquidación de Tienda - Diseño Completo */}
      <Dialog open={showStoreLiquidationModal} onOpenChange={setShowStoreLiquidationModal}>
        <DialogContent className="sm:max-w-[1400px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="w-6 h-6 text-blue-600" />
              Liquidación de Tienda - {selectedStoreLiquidation?.tienda}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStoreLiquidation && (
            <div className="space-y-4">
              {/* Sección Superior Optimizada - Resumen Completo */}
              <div className="grid grid-cols-12 gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                {/* Total a Entregar - Destacado (3 columnas) */}
                <div className="col-span-3 bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-700 text-sm">Total a Entregar</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mb-1">
                    {formatCurrency(selectedStoreLiquidation.finalAmount)}
                  </p>
                  <p className="text-xs text-purple-700">(Efectivo - Gastos)</p>
                </div>

                {/* Gastos (2 columnas) */}
                <div className="col-span-2 bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Minus className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-700 text-sm">Gastos</span>
                  </div>
                  <p className="text-lg font-bold text-red-600 mb-1">
                    {formatCurrency(selectedStoreLiquidation.totalSpent)}
                  </p>
                  <button 
                    onClick={() => handleViewExpenses(selectedStoreLiquidation)}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Ver detalles
                  </button>
                </div>

                {/* Total Recaudado con Fórmula (4 columnas) */}
                <div className="col-span-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-700 text-sm">Total Recaudado</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600 mb-2">
                    {formatCurrency(selectedStoreLiquidation.totalCollected)}
                  </p>
                  {/* Fórmula desglosada */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efectivo:</span>
                      <span className="font-medium text-green-600">{formatCurrency(selectedStoreLiquidation.cashPayments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SINPE:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(selectedStoreLiquidation.sinpePayments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarjeta:</span>
                      <span className="font-medium text-purple-600">{formatCurrency(selectedStoreLiquidation.tarjetaPayments || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Filtros por Método de Pago como Botones (3 columnas) */}
                <div className="col-span-3 space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Filtros por Pago</h4>
                  
                  {/* Botón Efectivo */}
                  <button
                    onClick={() => setStoreOrderPaymentFilter(storeOrderPaymentFilter === 'EFECTIVO' ? 'all' : 'EFECTIVO')}
                    className={`w-full p-2 rounded-lg border text-left transition-all ${
                      storeOrderPaymentFilter === 'EFECTIVO' 
                        ? 'bg-green-100 border-green-300 text-green-700' 
                        : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      <span className="font-medium text-sm">Efectivo</span>
                    </div>
                    <p className="text-xs font-bold mt-1">
                      {formatCurrency(selectedStoreLiquidation.cashPayments)}
                    </p>
                  </button>

                  {/* Botón SINPE */}
                  <button
                    onClick={() => setStoreOrderPaymentFilter(storeOrderPaymentFilter === 'SINPE' ? 'all' : 'SINPE')}
                    className={`w-full p-2 rounded-lg border text-left transition-all ${
                      storeOrderPaymentFilter === 'SINPE' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700' 
                        : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="font-medium text-sm">SINPE</span>
                    </div>
                    <p className="text-xs font-bold mt-1">
                      {formatCurrency(selectedStoreLiquidation.sinpePayments)}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSinpeOrders(selectedStoreLiquidation);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                    >
                      Ver comprobantes
                    </button>
                  </button>

                  {/* Botón Tarjeta */}
                  <button
                    onClick={() => setStoreOrderPaymentFilter(storeOrderPaymentFilter === 'TARJETA' ? 'all' : 'TARJETA')}
                    className={`w-full p-2 rounded-lg border text-left transition-all ${
                      storeOrderPaymentFilter === 'TARJETA' 
                        ? 'bg-purple-100 border-purple-300 text-purple-700' 
                        : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium text-sm">Tarjeta</span>
                    </div>
                    <p className="text-xs font-bold mt-1">
                      {formatCurrency(selectedStoreLiquidation.tarjetaPayments || 0)}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTarjetaOrders(selectedStoreLiquidation);
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800 mt-1 underline"
                    >
                      Ver comprobantes
                    </button>
                  </button>
                </div>
              </div>

              {/* Sección de Métricas y Filtros de Estado */}
              <div className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg border">
                {/* Métricas de Pedidos (6 columnas) */}
                <div className="col-span-6 grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-blue-50 rounded text-xs">
                    <p className="font-bold text-blue-600 text-sm">{selectedStoreLiquidation.orders.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded text-xs">
                    <p className="font-bold text-green-600 text-sm">{selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'ENTREGADO').length}</p>
                    <p className="text-xs text-muted-foreground">Entregados</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded text-xs">
                    <p className="font-bold text-red-600 text-sm">{selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'DEVOLUCION').length}</p>
                    <p className="text-xs text-muted-foreground">Devueltos</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded text-xs">
                    <p className="font-bold text-orange-600 text-sm">{selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'REAGENDADO').length}</p>
                    <p className="text-xs text-muted-foreground">Reagendados</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded text-xs">
                    <p className="font-bold text-yellow-600 text-sm">{selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'PENDIENTE').length}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded text-xs">
                    <p className="font-bold text-gray-600 text-sm">{selectedStoreLiquidation.orders.filter(o => !o.mensajero_asignado).length}</p>
                    <p className="text-xs text-muted-foreground">Sin Asignar</p>
                  </div>
                </div>
                
                {/* Filtros de Estado y Botones (6 columnas) */}
                <div className="col-span-6 flex items-center justify-end gap-2">
                  <Select value={storeOrderStatusFilter} onValueChange={setStoreOrderStatusFilter}>
                    <SelectTrigger className="w-24 h-7 text-xs">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ENTREGADO">Entregados</SelectItem>
                      <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                      <SelectItem value="DEVOLUCION">Devueltos</SelectItem>
                      <SelectItem value="REAGENDADO">Reagendados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPendingOrders(selectedStoreLiquidation)}
                    className="h-7 px-2 text-xs"
                  >
                    Pendientes
                  </Button>
                </div>
              </div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">Total Recaudado</span>
                  </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedStoreLiquidation.totalCollected)}
                      </p>
                </div>
                    
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Minus className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-700">Gastos</span>
                  </div>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(selectedStoreLiquidation.totalSpent)}
                      </p>
                      <button 
                        onClick={() => handleViewExpenses(selectedStoreLiquidation)}
                        className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
                      >
                        Click para ver detalles
                      </button>
                </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-orange-700">Pedidos a Devolver</span>
                  </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'DEVOLUCION').length + 
                         selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'REAGENDADO').length + 
                         selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'PENDIENTE').length}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        (Devueltos + Reagendados + Pendientes)
                      </p>
                      <button 
                        onClick={() => handleViewPendingOrders(selectedStoreLiquidation)}
                        className="text-xs text-orange-600 hover:text-orange-800 mt-1 underline"
                      >
                        Click para ver detalles
                      </button>
              </div>
                  </CardContent>
                </Card>

                {/* Filtros por Método de Pago */}
                <Card>
                    <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Filtros por Método de Pago</CardTitle>
                    </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-1">
                        <Banknote className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-700 text-sm">Efectivo</span>
                          </div>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedStoreLiquidation.cashPayments)}
                          </p>
                        </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-700 text-sm">SINPE</span>
                          </div>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(selectedStoreLiquidation.sinpePayments)}
                      </p>
                      <button 
                        onClick={() => handleViewSinpeOrders(selectedStoreLiquidation)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                      >
                        Ver comprobantes
                      </button>
                      </div>
                      
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-700 text-sm">Tarjeta</span>
                          </div>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(selectedStoreLiquidation.tarjetaPayments || 0)}
                      </p>
                      <button 
                        onClick={() => handleViewTarjetaOrders(selectedStoreLiquidation)}
                        className="text-xs text-purple-600 hover:text-purple-800 mt-1 underline"
                      >
                        Ver comprobantes
                      </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plata Inicial */}
                <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      + Plata Inicial
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                        <label className="text-sm font-medium text-gray-700">Monto (₡)</label>
                          <Input
                            type="number"
                          value={0} 
                          disabled
                          className="w-full mt-1"
                          />
                        </div>
                      <p className="text-sm text-gray-500">
                        Monto entregado a la tienda en efectivo
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                {/* Cálculo Final */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Cálculo Final</CardTitle>
                    </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-green-700">Plata Inicial</span>
                        <span className="font-bold text-green-600">{formatCurrency(0)}</span>
                            </div>
                      <p className="text-xs text-gray-600">Monto entregado a la tienda</p>
                      </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-blue-700">Total Recaudado</span>
                        <span className="font-bold text-blue-600">{formatCurrency(selectedStoreLiquidation.totalCollected)}</span>
                            </div>
                      <p className="text-xs text-gray-600">Total recaudado por entregas</p>
                              
                              {/* Desglose del total recaudado */}
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Efectivo:</span>
                          <span className="font-medium">{formatCurrency(selectedStoreLiquidation.cashPayments)}</span>
                                </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">SINPE:</span>
                          <span className="font-medium">{formatCurrency(selectedStoreLiquidation.sinpePayments)}</span>
                                </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tarjeta:</span>
                          <span className="font-medium">{formatCurrency(selectedStoreLiquidation.tarjetaPayments || 0)}</span>
                                </div>
                                </div>
                              </div>
                              
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-red-700">Gastos</span>
                        <span className="font-bold text-red-600">{formatCurrency(selectedStoreLiquidation.totalSpent)}</span>
                              </div>
                      <p className="text-xs text-gray-600">Gastos reportados por la tienda</p>
                      </div>

                    <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-green-700">Efectivo para liquidación</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedStoreLiquidation.cashPayments)}</span>
                          </div>
                      <p className="text-xs text-gray-600">Solo el efectivo se entrega físicamente</p>
                        </div>
                        
                    <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                        <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                          <span className="text-lg font-semibold text-purple-700">Total a Entregar</span>
                          </div>
                        <p className="text-3xl font-bold text-purple-600">
                          {formatCurrency(selectedStoreLiquidation.finalAmount)}
                        </p>
                        <p className="text-sm text-purple-700 mt-1">Confirmado para entrega</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              {/* Panel Derecho - Layout Bento Optimizado */}
              <div className="lg:col-span-2 space-y-3">
                {/* Layout Bento Compacto */}
                <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                  {/* Métricas Compactas - 6 columnas */}
                  <div className="col-span-6 grid grid-cols-3 gap-1">
                    <div className="text-center p-2 bg-blue-50 rounded text-xs">
                      <p className="font-bold text-blue-600 text-sm">{selectedStoreLiquidation.orders.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded text-xs">
                      <p className="font-bold text-green-600 text-sm">{selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'ENTREGADO').length}</p>
                      <p className="text-xs text-muted-foreground">Entregados</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded text-xs">
                      <p className="font-bold text-red-600 text-sm">{selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'DEVOLUCION').length}</p>
                      <p className="text-xs text-muted-foreground">Devueltos</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded text-xs">
                      <p className="font-bold text-orange-600 text-sm">{selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'REAGENDADO').length}</p>
                      <p className="text-xs text-muted-foreground">Reagendados</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded text-xs">
                      <p className="font-bold text-yellow-600 text-sm">{selectedStoreLiquidation.orders.filter(o => o.estado_pedido === 'PENDIENTE').length}</p>
                      <p className="text-xs text-muted-foreground">Pendientes</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded text-xs">
                      <p className="font-bold text-gray-600 text-sm">{selectedStoreLiquidation.orders.filter(o => !o.mensajero_asignado).length}</p>
                      <p className="text-xs text-muted-foreground">Sin Asignar</p>
                    </div>
                  </div>
                  
                  {/* Filtros y Botones - 6 columnas */}
                  <div className="col-span-6 flex items-center justify-end gap-2">
                    <Select value={storeOrderStatusFilter} onValueChange={setStoreOrderStatusFilter}>
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="ENTREGADO">Entregados</SelectItem>
                        <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                        <SelectItem value="DEVOLUCION">Devueltos</SelectItem>
                        <SelectItem value="REAGENDADO">Reagendados</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={storeOrderPaymentFilter} onValueChange={setStoreOrderPaymentFilter}>
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue placeholder="Pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                        <SelectItem value="SINPE">SINPE</SelectItem>
                        <SelectItem value="TARJETA">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewExpenses(selectedStoreLiquidation)}
                      className="h-7 px-2 text-xs"
                    >
                      Gastos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewPendingOrders(selectedStoreLiquidation)}
                      className="h-7 px-2 text-xs"
                    >
                      Pendientes
                    </Button>
                  </div>
                </div>

                {/* Tabla de Pedidos - Sin Card para maximizar espacio */}
                <div className="border rounded-lg">
                  <div className="p-3 border-b bg-gray-50">
                    <h3 className="font-semibold text-sm">Detalle de Pedidos ({selectedStoreLiquidation.orders.length})</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead className="w-24">Cliente</TableHead>
                            <TableHead className="w-24">Mensajero</TableHead>
                            <TableHead className="w-32">Producto</TableHead>
                            <TableHead className="w-16">Valor</TableHead>
                            <TableHead className="w-16">Método</TableHead>
                            <TableHead className="w-16">Estado</TableHead>
                            <TableHead className="w-16">Fecha</TableHead>
                            <TableHead className="w-20">Acciones</TableHead>
                            <TableHead className="min-w-24">Dirección</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                          {selectedStoreLiquidation.orders
                        .filter(pedido => {
                              const statusMatch = storeOrderStatusFilter === 'all' || pedido.estado_pedido === storeOrderStatusFilter;
                              const paymentMatch = storeOrderPaymentFilter === 'all' || pedido.metodo_pago === storeOrderPaymentFilter;
                              return statusMatch && paymentMatch;
                            })
                        .map((pedido) => (
                            <TableRow key={pedido.id_pedido} className="text-xs">
                              <TableCell className="font-medium text-xs">{pedido.id_pedido}</TableCell>
                              <TableCell className="max-w-24 truncate text-xs">{pedido.cliente_nombre}</TableCell>
                              <TableCell className="max-w-24 truncate text-xs">{pedido.mensajero_asignado || 'Sin asignar'}</TableCell>
                              <TableCell className="max-w-32 truncate text-xs">{pedido.productos || 'No especificado'}</TableCell>
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
                              <TableCell className="text-xs">{new Date(pedido.fecha_creacion).toLocaleDateString('es-CR')}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                    onClick={() => handleEditOrderStatus(pedido)}
                                    className="text-xs px-1 py-0.5 h-5 w-full"
                                  >
                                    Editar
                                </Button>
                                  {pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago && pedido.metodo_pago !== 'EFECTIVO' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleViewPedidoComprobante(pedido)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-1 py-0.5 h-5 w-full"
                                >
                                  Comprobante
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-24 truncate text-xs">{pedido.direccion}</TableCell>
                        </TableRow>
                      ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
              
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Actualización de Estado de Pedido - Completo como mensajeros */}
      <Dialog open={showUpdateStatusModal} onOpenChange={setShowUpdateStatusModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Actualizar Estado del Pedido
              </DialogTitle>
            </DialogHeader>
            
          {selectedOrderForUpdate && (
            <div className="space-y-6">
              {/* Información del pedido */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Pedido {selectedOrderForUpdate.id_pedido}</h3>
                  <Badge variant="outline" className="text-xs">
                    {selectedOrderForUpdate.estado_pedido || 'PENDIENTE'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{selectedOrderForUpdate.cliente_nombre}</span>
                      </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedOrderForUpdate.valor_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="font-medium">{selectedOrderForUpdate.cliente_telefono}</span>
                      </div>
                    </div>
                  </div>

              {/* Selector de nuevo estado */}
                  <div className="space-y-3">
                <Label className="text-base font-semibold">Nuevo Estado *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar nuevo estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREGADO">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Entregado</span>
                            </div>
                    </SelectItem>
                    <SelectItem value="PENDIENTE">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span>Pendiente</span>
                            </div>
                    </SelectItem>
                    <SelectItem value="DEVOLUCION">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Devolución</span>
                          </div>
                    </SelectItem>
                    <SelectItem value="REAGENDADO">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Reagendado</span>
                          </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                        </div>

              {/* Método de pago para entregado */}
              {newStatus === 'ENTREGADO' && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">Método de Pago *</Label>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      {'🔄 Cambio'}
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
                        setFirstPaymentMethod('efectivo'); // Por defecto el primer pago es efectivo
                        setSecondPaymentMethod(''); // El segundo método debe ser seleccionado por el usuario
                      }}
                      className={`h-10 text-xs font-medium ${
                        paymentMethod === '2pagos' 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-700'
                      }`}
                    >
                      💰 2 Pagos
                    </Button>
                  </div>
                  
                  {/* Comprobante para SINPE o Tarjeta */}
                  {(paymentMethod === 'sinpe' || paymentMethod === 'tarjeta') && (
                    <div className="space-y-2">
                      <Label>Comprobante de Transacción *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {uploadedReceipts.length > 0 ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              {uploadedReceipts.map((receipt, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={receipt}
                                    alt={`Comprobante ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                  />
                            <Button
                              size="sm"
                              variant="outline"
                                    onClick={() => setUploadedReceipts(prev => prev.filter((_, i) => i !== index))}
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 text-red-600 hover:text-red-700 bg-white border border-red-200"
                            >
                                    <X className="w-3 h-3" />
                            </Button>
                      </div>
                    ))}
                  </div>
                            <div className="text-xs text-gray-500 text-center">
                              {uploadedReceipts.length} comprobante{uploadedReceipts.length !== 1 ? 's' : ''} seleccionado{uploadedReceipts.length !== 1 ? 's' : ''}
            </div>
                </div>
              ) : (
                          <div className="space-y-3">
                            <Camera className="w-8 h-8 mx-auto text-gray-400" />
                            <p className="text-sm text-gray-600">Toca para seleccionar comprobantes (múltiples)</p>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFileUpload(e, 'receipt')}
                              className="hidden"
                              id="receipt-upload"
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('receipt-upload')?.click()}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Seleccionar Comprobantes
                            </Button>
                      </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Sección para 2 pagos */}
                  {paymentMethod === '2pagos' && (
                    <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-semibold">Configurar 2 Pagos *</Label>
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                          💰 Pagos Múltiples
                              </Badge>
                  </div>
                      <p className="text-xs text-gray-600">
                        Especifica los dos tipos de pago y sus montos correspondientes
                      </p>
                      
                      {/* Primer Pago */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Primer Pago</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-gray-600">Método</Label>
                            <Select value={firstPaymentMethod} onValueChange={() => {}} disabled>
                              <SelectTrigger className="h-8 bg-gray-100">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">El primer pago siempre es efectivo</p>
                </div>
                      <div>
                            <Label className="text-xs text-gray-600">Monto (₡)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={firstPaymentAmount}
                              onChange={(e) => setFirstPaymentAmount(e.target.value)}
                              className="h-8"
                            />
                      </div>
                    </div>
                  </div>

                      {/* Segundo Pago */}
                  <div className="space-y-3">
                        <Label className="text-sm font-medium">Segundo Pago</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-gray-600">Método</Label>
                            <Select value={secondPaymentMethod} onValueChange={setSecondPaymentMethod}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                                <SelectItem value="sinpe">📱 SINPE</SelectItem>
                                <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                              </SelectContent>
                            </Select>
                            </div>
                            <div>
                            <Label className="text-xs text-gray-600">Monto (₡)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={secondPaymentAmount}
                              onChange={(e) => setSecondPaymentAmount(e.target.value)}
                              className="h-8"
                            />
                            </div>
                          </div>

                        {/* Comprobante para segundo pago si es SINPE o Tarjeta */}
                        {(secondPaymentMethod === 'sinpe' || secondPaymentMethod === 'tarjeta') && (
                          <div className="space-y-2">
                            <Label className="text-xs">Comprobante del Segundo Pago *</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                              {secondPaymentReceipt ? (
                                <div className="space-y-2">
                                  <img
                                    src={secondPaymentReceipt}
                                    alt="Comprobante segundo pago"
                                    className="max-w-full h-24 object-contain mx-auto rounded-lg"
                                  />
                            <Button
                                    variant="outline"
                              size="sm"
                                    onClick={() => setSecondPaymentReceipt(null)}
                                    className="text-red-600 hover:text-red-700 h-6 text-xs"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Eliminar
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Camera className="w-6 h-6 mx-auto text-gray-400" />
                                  <p className="text-xs text-gray-600">Comprobante del segundo pago</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleDualPaymentFileUpload(e, 'second')}
                                    className="hidden"
                                    id="second-payment-upload"
                                  />
                                  <Button
                              variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('second-payment-upload')?.click()}
                                    className="h-6 text-xs"
                            >
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                    Subir
                            </Button>
                          </div>
                        )}
                      </div>
                  </div>
              )}
            </div>

                      {/* Resumen de totales */}
                      <div className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Total del Pedido:</span>
                          <span className="font-bold">{formatCurrency(selectedOrderForUpdate?.valor_total || 0)}</span>
                </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Primer Pago:</span>
                          <span>{formatCurrency(parseFloat(firstPaymentAmount) || 0)}</span>
                      </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Segundo Pago:</span>
                          <span>{formatCurrency(parseFloat(secondPaymentAmount) || 0)}</span>
                      </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between items-center text-sm font-semibold">
                            <span>Diferencia:</span>
                            <span className={`${
                              (parseFloat(firstPaymentAmount) || 0) + (parseFloat(secondPaymentAmount) || 0) === (selectedOrderForUpdate?.valor_total || 0)
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency((parseFloat(firstPaymentAmount) || 0) + (parseFloat(secondPaymentAmount) || 0) - (selectedOrderForUpdate?.valor_total || 0))}
                            </span>
                    </div>
                  </div>
                            </div>
                            </div>
                  )}
                          </div>
              )}

              {/* Selector de fecha obligatorio para reagendado */}
              {newStatus === 'REAGENDADO' && (
                <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Label>Seleccionar fecha a reagendar *</Label>
                  <Popover open={isReagendadoDatePickerOpen} onOpenChange={setIsReagendadoDatePickerOpen}>
                    <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !reagendadoDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {reagendadoDate ? reagendadoDate.toLocaleDateString('es-ES') : "Seleccionar fecha"}
                            </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={reagendadoDate || undefined}
                        onSelect={(date) => {
                          setReagendadoDate(date || null);
                          setIsReagendadoDatePickerOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                          </div>
                        )}

              {/* Checkbox opcional para marcar como cambio */}
              {newStatus === 'REAGENDADO' && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reagendado-as-change"
                      checked={isReagendadoAsChange}
                      onCheckedChange={(checked) => setIsReagendadoAsChange(checked as boolean)}
                    />
                    <Label htmlFor="reagendado-as-change" className="text-sm font-medium">
                      Marcar reagendado como cambio
                    </Label>
                      </div>
                  <p className="text-xs text-gray-600">
                    Opcional: Marca este pedido como un cambio en el backend para seguimiento especial
                  </p>
                  </div>
              )}

              {/* Comprobante de evidencia para devolución o reagendado */}
              {(newStatus === 'DEVOLUCION' || newStatus === 'REAGENDADO') && (
                <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <Label>Comprobante de Comunicación *</Label>
                  <p className="text-xs text-gray-600">
                    Adjunta captura de pantalla del chat o llamada con el cliente para evidenciar la comunicación
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {uploadedEvidence ? (
                      <div className="space-y-3">
                        <img
                          src={uploadedEvidence}
                          alt="Comprobante de comunicación"
                          className="max-w-full h-32 object-contain mx-auto rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUploadedEvidence(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
              </div>
                    ) : (
                      <div className="space-y-3">
                        <Camera className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">Toca para seleccionar comprobante</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'evidence')}
                          className="hidden"
                          id="evidence-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('evidence-upload')?.click()}
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Seleccionar Imagen
                        </Button>
              </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Comentarios (opcional)</Label>
                <Textarea
                  placeholder="Añadir comentarios sobre el cambio de estado..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Botones fijos en la parte inferior */}
              <div className="flex-shrink-0 flex gap-2 pt-4 border-t bg-white">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpdateStatusModal(false);
                    setSelectedOrderForUpdate(null);
                    resetModalState();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateOrderStatus}
                  disabled={
                    !newStatus || 
                    updatingOrder === selectedOrderForUpdate?.id_pedido ||
                    (newStatus === 'ENTREGADO' && !paymentMethod) ||
                    (newStatus === 'ENTREGADO' && (paymentMethod === 'sinpe' || paymentMethod === 'tarjeta') && uploadedReceipts.length === 0) ||
                    (newStatus === 'ENTREGADO' && paymentMethod === '2pagos' && (
                      !firstPaymentMethod || !secondPaymentMethod || 
                      !firstPaymentAmount || !secondPaymentAmount ||
                      (secondPaymentMethod === 'sinpe' && !secondPaymentReceipt) ||
                      (secondPaymentMethod === 'tarjeta' && !secondPaymentReceipt) ||
                      (parseFloat(firstPaymentAmount) + parseFloat(secondPaymentAmount)) !== selectedOrderForUpdate?.valor_total
                    )) ||
                    ((newStatus === 'DEVOLUCION' || newStatus === 'REAGENDADO') && !uploadedEvidence) ||
                    (newStatus === 'REAGENDADO' && !reagendadoDate)
                  }
                  className="flex-1"
                >
                  {updatingOrder === selectedOrderForUpdate?.id_pedido ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Gastos */}
      <Dialog open={showExpensesModal} onOpenChange={setShowExpensesModal}>
        <DialogContent className="sm:max-w-[600px] ">
          <DialogHeader>
            <DialogTitle>Gastos del Mensajero - {selectedExpenses?.mensajero}</DialogTitle>
          </DialogHeader>
          
          {selectedExpenses && (
            <div className="space-y-4">
              {selectedExpenses.gastos.length > 0 ? (
                <div className="space-y-3">
                  {selectedExpenses.gastos.map((gasto, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getExpenseIcon(gasto.tipo_gasto)}
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getExpenseColor(gasto.tipo_gasto)}`}>
                            {gasto.tipo_gasto}
                          </span>
                  </div>
                        <span className="font-bold text-lg">{formatCurrency(gasto.monto)}</span>
                  </div>
                      <p className="text-sm text-gray-600">Fecha: {new Date(gasto.fecha).toLocaleDateString('es-CR')}</p>
                      {gasto.comprobante_link && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewComprobante(gasto.comprobante_link)}
                          className="mt-2"
                        >
                          Ver Comprobante
                        </Button>
                      )}
                  </div>
                  ))}
                  </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay gastos registrados para este mensajero</p>
                </div>
              )}
                  </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pedidos Pendientes */}
      <Dialog open={showPendingOrdersModal} onOpenChange={setShowPendingOrdersModal}>
        <DialogContent className="sm:max-w-[1200px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Pedidos Pendientes - {selectedPendingOrders?.mensajero}</DialogTitle>
          </DialogHeader>
          
          {selectedPendingOrders && (
            <div className="flex-1 overflow-y-auto">
              {selectedPendingOrders.pedidos.length > 0 ? (
                <div className="space-y-6 p-2">
                  {selectedPendingOrders.pedidos.map((pedido) => (
                    <div key={pedido.id_pedido} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Información Principal */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-lg text-gray-800">{pedido.id_pedido}</h4>
                            <div className="flex flex-col gap-2">
                              <Badge 
                                variant="outline"
                                className={`text-sm px-3 py-1 ${
                                  pedido.estado_pedido === 'ENTREGADO' ? 'bg-green-100 text-green-700 border-green-300' :
                                  pedido.estado_pedido === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                  pedido.estado_pedido === 'DEVOLUCION' ? 'bg-red-100 text-red-700 border-red-300' :
                                  pedido.estado_pedido === 'REAGENDADO' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                  'bg-gray-100 text-gray-700 border-gray-300'
                                }`}
                              >
                                {pedido.estado_pedido === 'ENTREGADO' ? 'ENTREGADO' :
                                 pedido.estado_pedido === 'PENDIENTE' ? 'PENDIENTE' :
                                 pedido.estado_pedido === 'DEVOLUCION' ? 'DEVOLUCION' :
                                 pedido.estado_pedido === 'REAGENDADO' ? 'REAGENDADO' :
                                 pedido.estado_pedido || 'PENDIENTE'}
                              </Badge>
                              <Badge variant="outline" className="text-sm px-3 py-1 bg-gray-100 text-gray-700 border-gray-300">
                                {pedido.metodo_pago || 'SIN_METODO'}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-600 min-w-[60px]">Cliente:</span> 
                              <span className="text-gray-800">{pedido.cliente_nombre}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-600 min-w-[60px]">Teléfono:</span> 
                              <span className="text-gray-800">{pedido.cliente_telefono}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-600 min-w-[60px]">Valor:</span> 
                              <span className="font-bold text-green-600 text-lg">{formatCurrency(pedido.valor_total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dirección */}
                        <div className="space-y-3">
                          <h5 className="font-semibold text-gray-700 text-base">📍 Dirección</h5>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700 leading-relaxed">{pedido.direccion}</p>
                          </div>
                        </div>

                        {/* Productos y Acciones */}
                        <div className="space-y-3">
                          <h5 className="font-semibold text-gray-700 text-base">📦 Productos</h5>
                          <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="text-sm text-gray-700 leading-relaxed">{pedido.productos || 'No especificado'}</p>
                          </div>
                          <div className="flex flex-col gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrderStatus(pedido)}
                              className="text-sm h-10 px-6 hover:bg-blue-50 hover:border-blue-300"
                            >
                              ✏️ Editar Estado
                            </Button>
                            <p className="text-xs text-gray-500 text-center">
                              📅 Fecha: {new Date(pedido.fecha_creacion).toLocaleDateString('es-CR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay pedidos pendientes</p>
                  </div>
              )}
                  </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pedidos SINPE */}
      <Dialog open={showSinpeModal} onOpenChange={setShowSinpeModal}>
        <DialogContent className="sm:max-w-[700px] ">
          <DialogHeader>
            <DialogTitle>Comprobantes SINPE</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {selectedSinpeOrders.length > 0 ? (
              <div className="space-y-6 p-2">
                {selectedSinpeOrders.map((pedido) => (
                  <div key={pedido.id_pedido} className="bg-white border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {/* Información Principal */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-lg text-blue-700">{pedido.id_pedido}</h4>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-sm px-3 py-1">
                            📱 SINPE
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600 min-w-[60px]">Cliente:</span> 
                            <span className="text-gray-800">{pedido.cliente_nombre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600 min-w-[60px]">Teléfono:</span> 
                            <span className="text-gray-800">{pedido.cliente_telefono}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600 min-w-[60px]">Valor:</span> 
                            <span className="font-bold text-green-600 text-lg">{formatCurrency(pedido.valor_total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dirección */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-700 text-base">📍 Dirección</h5>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 leading-relaxed">{pedido.direccion}</p>
                        </div>
                      </div>

                      {/* Productos y Acciones */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-700 text-base">📦 Productos</h5>
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed">{pedido.productos || 'No especificado'}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-10 px-6"
                          >
                            📄 Ver Comprobante SINPE
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditOrderStatus(pedido)}
                            className="text-sm h-10 px-6 hover:bg-blue-50 hover:border-blue-300"
                          >
                            ✏️ Editar Estado
                          </Button>
                          <p className="text-xs text-gray-500 text-center">
                            📅 Fecha: {new Date(pedido.fecha_creacion).toLocaleDateString('es-CR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay pedidos pagados con SINPE</p>
                </div>
            )}
              </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pedidos con Tarjeta */}
      <Dialog open={showTarjetaModal} onOpenChange={setShowTarjetaModal}>
        <DialogContent className="sm:max-w-[1200px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Comprobantes de Tarjeta</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {selectedTarjetaOrders.length > 0 ? (
              <div className="space-y-6 p-2">
                {selectedTarjetaOrders.map((pedido) => (
                  <div key={pedido.id_pedido} className="bg-white border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {/* Información Principal */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-lg text-purple-700">{pedido.id_pedido}</h4>
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-sm px-3 py-1">
                            💳 TARJETA
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600 min-w-[60px]">Cliente:</span> 
                            <span className="text-gray-800">{pedido.cliente_nombre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600 min-w-[60px]">Teléfono:</span> 
                            <span className="text-gray-800">{pedido.cliente_telefono}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600 min-w-[60px]">Valor:</span> 
                            <span className="font-bold text-green-600 text-lg">{formatCurrency(pedido.valor_total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dirección */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-700 text-base">📍 Dirección</h5>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 leading-relaxed">{pedido.direccion}</p>
                        </div>
                      </div>

                      {/* Productos y Acciones */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-700 text-base">📦 Productos</h5>
                        <div className="bg-purple-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed">{pedido.productos || 'No especificado'}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm h-10 px-6"
                          >
                            📄 Ver Comprobante de Tarjeta
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditOrderStatus(pedido)}
                            className="text-sm h-10 px-6 hover:bg-purple-50 hover:border-purple-300"
                          >
                            ✏️ Editar Estado
                          </Button>
                          <p className="text-xs text-gray-500 text-center">
                            📅 Fecha: {new Date(pedido.fecha_creacion).toLocaleDateString('es-CR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay pedidos pagados con tarjeta</p>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Loader */}
      {isLoaderVisible && (
        <ProgressLoader
          title="Procesando Liquidaciones"
          isVisible={isLoaderVisible}
          steps={loaderSteps}
          currentStep={loaderCurrentStep}
          overallProgress={loaderProgress}
        />
      )}
    </div>
  );
}