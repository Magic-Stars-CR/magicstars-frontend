'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { RouteLiquidation, RouteLiquidationStats, RouteLiquidationFilters, PedidoTest } from '@/lib/types';
import { getLiquidacionesReales, getMensajerosUnicos, debugTablaPedidos, debugFechasConDatos } from '@/lib/supabase-pedidos';
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
  finalAmount: number; // Monto final a entregar
  orders: PedidoTest[];
  isLiquidated: boolean;
  canEdit: boolean;
}

export default function AdminLiquidationPage() {
  const [liquidations, setLiquidations] = useState<RouteLiquidation[]>([]);
  const [stats, setStats] = useState<RouteLiquidationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RouteLiquidationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [liquidating, setLiquidating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Estados para el módulo de liquidación mejorado
  const [calculations, setCalculations] = useState<LiquidationCalculation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingInitialAmount, setEditingInitialAmount] = useState<string | null>(null);
  const [newInitialAmount, setNewInitialAmount] = useState('');
  const [isEditingRestricted, setIsEditingRestricted] = useState(false);
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationCalculation | null>(null);
  const [showRouteDetailModal, setShowRouteDetailModal] = useState(false);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<LiquidationCalculation | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedOrderNotes, setSelectedOrderNotes] = useState<PedidoTest | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const [showViewAndLiquidateModal, setShowViewAndLiquidateModal] = useState(false);
  const [selectedViewAndLiquidate, setSelectedViewAndLiquidate] = useState<LiquidationCalculation | null>(null);
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
    loadData();
    loadCalculations();
  }, [filters, selectedDate]);

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

  const loadCalculations = async () => {
    try {
      console.log('🚀 Iniciando loadCalculations para fecha:', selectedDate);
      
      // Iniciar loader
      startLoader('Procesando Liquidaciones', [
        { id: 'mensajeros', label: 'Obteniendo mensajeros únicos', status: 'pending' },
        { id: 'pedidos', label: 'Cargando pedidos del día', status: 'pending' },
        { id: 'calculations', label: 'Calculando liquidaciones', status: 'pending' },
        { id: 'finalization', label: 'Finalizando proceso', status: 'pending' }
      ]);
      
      // Paso 1: Obtener liquidaciones reales
      setStepStatus('mensajeros', 'loading', 'Buscando mensajeros en la base de datos...');
      const liquidacionesReales = await getLiquidacionesReales(selectedDate);
      console.log('✅ Liquidaciones reales obtenidas:', liquidacionesReales.length);
      
      // LOG DETALLADO DE PEDIDOS Y ESTADOS
      console.log('📋 ===== ANÁLISIS DETALLADO DE PEDIDOS =====');
      liquidacionesReales.forEach((liquidation, index) => {
        console.log(`\n👤 Mensajero ${index + 1}: ${liquidation.mensajero}`);
        console.log(`📦 Total de pedidos: ${liquidation.pedidos.length}`);
        
        if (liquidation.pedidos.length > 0) {
          console.log('📊 Estados de pedidos:');
          const estados = liquidation.pedidos.reduce((acc, pedido) => {
            const estado = pedido.estado_pedido || 'sin_estado';
            acc[estado] = (acc[estado] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          Object.entries(estados).forEach(([estado, count]) => {
            console.log(`   - ${estado}: ${count} pedidos`);
          });
          
          console.log('🔍 Primeros 3 pedidos:');
          liquidation.pedidos.slice(0, 3).forEach((pedido, i) => {
            console.log(`   ${i + 1}. ID: ${pedido.id_pedido}, Estado: "${pedido.estado_pedido || 'sin_estado'}", Cliente: ${pedido.cliente_nombre}, Valor: ₡${pedido.valor_total}`);
          });
        } else {
          console.log('   ⚠️ No hay pedidos para este mensajero');
        }
      });
      console.log('📋 ===========================================\n');
      
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
      
      // Cerrar loader
      setTimeout(() => {
        closeLoader();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error loading calculations:', error);
      
      // Marcar pasos como error
      setStepStatus('calculations', 'error', 'Error en el cálculo');
      setStepStatus('finalization', 'error', 'Proceso falló');
      
      // Cerrar loader después de mostrar el error
      setTimeout(() => {
        closeLoader();
      }, 3000);
      
      // Fallback a datos vacíos si hay error
      setCalculations([]);
    }
  };

  const calculateLiquidation = (calculation: LiquidationCalculation): LiquidationCalculation => {
    // Los datos ya vienen calculados de Supabase, pero podemos recalcular si es necesario
    const totalCollected = calculation.orders.reduce((sum, order) => {
      if (order.estado_pedido === 'entregado') {
        return sum + order.valor_total;
      }
      return sum;
    }, 0);

    const sinpePayments = calculation.orders.reduce((sum, order) => {
      if (order.estado_pedido === 'entregado' && order.metodo_pago === 'sinpe') {
        return sum + order.valor_total;
      }
      return sum;
    }, 0);

    const cashPayments = calculation.orders.reduce((sum, order) => {
      if (order.estado_pedido === 'entregado' && order.metodo_pago === 'efectivo') {
        return sum + order.valor_total;
      }
      return sum;
    }, 0);

    const totalSpent = calculation.totalSpent; // Usar el valor ya calculado
    const finalAmount = calculation.initialAmount + totalCollected - totalSpent;

    return {
      ...calculation,
      totalCollected,
      totalSpent,
      sinpePayments,
      cashPayments,
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

  const handleViewAndLiquidate = (calculation: LiquidationCalculation) => {
    setSelectedViewAndLiquidate(calculation);
    setInitialAmountInput('0'); // Siempre empezar en 0
    setShowViewAndLiquidateModal(true);
  };

  const handleViewNotes = (pedido: PedidoTest) => {
    setSelectedOrderNotes(pedido);
    setShowNotesModal(true);
  };

  const handleViewMap = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleViewComprobante = (comprobante: string) => {
    // Aquí podrías implementar la lógica para ver el comprobante
    alert(`Ver comprobante: ${comprobante}`);
  };

  const confirmLiquidation = async (calculation: LiquidationCalculation, initialAmount?: number) => {
    try {
      const finalAmount = initialAmount ? initialAmount + calculation.totalCollected - calculation.totalSpent : calculation.finalAmount;
      
      // Enviar al endpoint de liquidación
      const response = await fetch('https://primary-production-2b25b.up.railway.app/webhook/add-liquidacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: selectedDate,
          mensajero: calculation.messengerName,
          plata_inicial: initialAmount || calculation.initialAmount,
          total_recaudado: calculation.totalCollected,
          pagos_sinpe: calculation.sinpePayments,
          pagos_efectivo: calculation.cashPayments,
          gastos: calculation.totalSpent,
          monto_final: finalAmount
        })
      });

      if (!response.ok) {
        throw new Error(`Error al enviar liquidación: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Liquidación enviada exitosamente:', responseData);

      // Marcar como liquidado
      setCalculations(prev => 
        prev.map(calc => 
          calc.messengerId === calculation.messengerId 
            ? { ...calc, isLiquidated: true, canEdit: false, initialAmount: initialAmount || calculation.initialAmount }
            : calc
        )
      );
      
      // Restringir edición de pedidos
      setIsEditingRestricted(true);
      
      setShowLiquidationModal(false);
      setShowViewAndLiquidateModal(false);
      alert(`Liquidación completada para ${calculation.messengerName}`);
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
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Button 
            variant="outline"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setSelectedDate(today);
            }}
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
            <strong>Sin liquidaciones para esta fecha:</strong> No se encontraron pedidos entregados para el {selectedDate}. 
            Se muestran los mensajeros disponibles con liquidaciones en cero. 
            Verifica que la fecha seleccionada tenga pedidos con estado "entregado".
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
                <p className="text-sm font-medium text-muted-foreground">Mensajeros Activos</p>
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
                    name === 'recaudado' ? 'Recaudado' : 
                    name === 'gastos' ? 'Gastos' : 'Monto Final'
                  ]}
                />
                <Legend />
                <Bar dataKey="recaudado" fill="#10b981" name="Recaudado" />
                <Bar dataKey="gastos" fill="#f59e0b" name="Gastos" />
                <Bar dataKey="final" fill="#8b5cf6" name="Monto Final" />
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
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[
                    {
                      name: 'Efectivo',
                      value: calculations.reduce((sum, calc) => 
                        sum + calc.orders.filter(o => o.metodo_pago === 'efectivo').length, 0
                      ),
                      color: '#10b981'
                    },
                    {
                      name: 'SINPE',
                      value: calculations.reduce((sum, calc) => 
                        sum + calc.orders.filter(o => o.metodo_pago === 'sinpe').length, 0
                      ),
                      color: '#3b82f6'
                    },
                    {
                      name: 'Tarjeta',
                      value: calculations.reduce((sum, calc) => 
                        sum + calc.orders.filter(o => o.metodo_pago === 'tarjeta').length, 0
                      ),
                      color: '#8b5cf6'
                    },
                    {
                      name: '2 Pagos',
                      value: calculations.reduce((sum, calc) => 
                        sum + calc.orders.filter(o => o.metodo_pago === '2pagos').length, 0
                      ),
                      color: '#f59e0b'
                    }
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
                    { name: 'Efectivo', value: 0, color: '#10b981' },
                    { name: 'SINPE', value: 0, color: '#3b82f6' },
                    { name: 'Tarjeta', value: 0, color: '#8b5cf6' },
                    { name: '2 Pagos', value: 0, color: '#f59e0b' }
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
                <TableHead>Monto Final</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.map((calculation) => {
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
                              variant="outline"
                              onClick={() => handleViewRouteDetail(calculated)}
                              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
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
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                                variant={pedido.estado_pedido === 'entregado' ? 'default' : 'outline'}
                                className={pedido.estado_pedido === 'entregado' ? 'bg-green-100 text-green-800' : ''}
                              >
                                {pedido.estado_pedido || 'pendiente'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Cliente: {pedido.cliente_nombre}</div>
                              <div>Valor: {formatCurrency(pedido.valor_total)}</div>
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
                          <p className="text-sm font-medium text-muted-foreground">Monto Final</p>
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
                                      {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleDateString('es-CR') : 'N/A'}
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
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 p-1">
                
                {/* Columna Izquierda - Resumen y Cálculos */}
                <div className="xl:col-span-1 space-y-4">
                  
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
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Minus className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Gastos</span>
                          </div>
                          <p className="text-xl font-bold text-red-900">
                            {formatCurrency(selectedViewAndLiquidate.totalSpent)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Smartphone className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">SINPE</span>
                          </div>
                          <p className="text-lg font-bold text-blue-900">
                            {formatCurrency(selectedViewAndLiquidate.sinpePayments)}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Banknote className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Efectivo</span>
                          </div>
                          <p className="text-lg font-bold text-green-900">
                            {formatCurrency(selectedViewAndLiquidate.cashPayments)}
                          </p>
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
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">+ Total Recaudado:</span>
                                <span className="font-bold text-blue-600">{formatCurrency(selectedViewAndLiquidate.totalCollected)}</span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">- Gastos:</span>
                                <span className="font-bold text-red-600">{formatCurrency(selectedViewAndLiquidate.totalSpent)}</span>
                              </div>
                              <div className="border-t pt-2 flex items-center justify-between">
                                <span className="text-gray-800 font-semibold">= Monto Final:</span>
                                <span className="font-bold text-purple-600 text-base">
                                  {formatCurrency((parseFloat(initialAmountInput) || 0) + selectedViewAndLiquidate.totalCollected - selectedViewAndLiquidate.totalSpent)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resultado Final - Mucho Más Prominente */}
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-xl border-2 border-purple-300 shadow-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-purple-200 rounded-xl">
                              <Calculator className="w-6 h-6 text-purple-700" />
                            </div>
                            <div className="flex-1">
                              <span className="font-bold text-purple-800 text-lg">Monto final a entregar</span>
                              <p className="text-xs text-purple-600 mt-1">
                                {((parseFloat(initialAmountInput) || 0) + selectedViewAndLiquidate.totalCollected - selectedViewAndLiquidate.totalSpent) >= 0 
                                  ? '✅ El mensajero debe entregar este monto' 
                                  : '⚠️ El mensajero debe pagar este monto'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <span className="text-2xl font-bold text-purple-900 break-words">
                              {formatCurrency((parseFloat(initialAmountInput) || 0) + selectedViewAndLiquidate.totalCollected - selectedViewAndLiquidate.totalSpent)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna Derecha - Pedidos */}
                <div className="xl:col-span-4 space-y-4 flex flex-col h-full">

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
                        <div className="bg-blue-50 p-2 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Package className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">Total</span>
                          </div>
                          <p className="text-lg font-bold text-blue-900">{selectedViewAndLiquidate.orders.length}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-800">Entregados</span>
                          </div>
                          <p className="text-lg font-bold text-green-900">
                            {selectedViewAndLiquidate.orders.filter(p => p.estado_pedido === 'entregado').length}
                          </p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span className="text-xs font-medium text-red-800">Devoluciones</span>
                          </div>
                          <p className="text-lg font-bold text-red-900">
                            {selectedViewAndLiquidate.orders.filter(p => p.estado_pedido === 'devolucion').length}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-800">Reagendados</span>
                          </div>
                          <p className="text-lg font-bold text-orange-900">
                            {selectedViewAndLiquidate.orders.filter(p => p.estado_pedido === 'reagendado').length}
                          </p>
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
                          Detalle de Pedidos ({selectedViewAndLiquidate.orders.length})
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
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead className="w-40">Cliente</TableHead>
                        <TableHead className="w-24">Teléfono</TableHead>
                        <TableHead className="w-48">Dirección</TableHead>
                        <TableHead className="w-24">Valor</TableHead>
                        <TableHead className="w-24">Método</TableHead>
                        <TableHead className="w-24">Estado</TableHead>
                        <TableHead className="w-24">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedViewAndLiquidate.orders
                        .filter(pedido => 
                          orderStatusFilter === 'all' || 
                          pedido.estado_pedido === orderStatusFilter
                        )
                        .map((pedido) => (
                        <TableRow key={pedido.id_pedido} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-xs">
                            {pedido.id_pedido}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">{pedido.cliente_nombre}</span>
                              <span className="text-xs text-gray-500">{pedido.distrito}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {pedido.cliente_telefono ? pedido.cliente_telefono.replace('506', '') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="max-w-48 text-wrap leading-tight" title={pedido.direccion}>
                              {pedido.direccion ? (
                                <div className="space-y-1">
                                  {pedido.direccion.split(',').map((part, index) => (
                                    <div key={index} className="text-xs leading-tight">
                                      {part.trim()}
                                    </div>
                                  ))}
                                </div>
                              ) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-green-600 text-xs">
                              {formatCurrency(pedido.valor_total)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {pedido.metodo_pago === 'efectivo' && <Banknote className="w-4 h-4 text-green-600" />}
                              {pedido.metodo_pago === 'sinpe' && <Smartphone className="w-4 h-4 text-blue-600" />}
                              {pedido.metodo_pago === 'tarjeta' && <CreditCard className="w-4 h-4 text-purple-600" />}
                              {pedido.metodo_pago === '2pagos' && <Receipt className="w-4 h-4 text-orange-600" />}
                              <span className="text-xs font-medium">{pedido.metodo_pago || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {pedido.estado_pedido === 'entregado' && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {pedido.estado_pedido === 'devolucion' && <AlertCircle className="w-4 h-4 text-red-600" />}
                              {pedido.estado_pedido === 'reagendado' && <Clock className="w-4 h-4 text-orange-600" />}
                              {(!pedido.estado_pedido || pedido.estado_pedido === 'pendiente') && <Package className="w-4 h-4 text-gray-600" />}
                              <Badge 
                                variant={pedido.estado_pedido === 'entregado' ? 'default' : 'outline'}
                                className={`text-xs px-2 py-1 ${
                                  pedido.estado_pedido === 'entregado' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : pedido.estado_pedido === 'devolucion'
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : pedido.estado_pedido === 'reagendado'
                                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                }`}
                              >
                                {pedido.estado_pedido === 'entregado' ? 'ENTREGADO' : 
                                 pedido.estado_pedido === 'devolucion' ? 'DEVOLUCIÓN' :
                                 pedido.estado_pedido === 'reagendado' ? 'REAGENDADO' :
                                 'PENDIENTE'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleDateString('es-CR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            }) : 'N/A'}
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
    </div>
  );
}
