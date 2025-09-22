'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { mockApi } from '@/lib/mock-api';
import { Order, PedidoTest, OrderStatus } from '@/lib/types';
import { getPedidosByMensajero, getPedidosDelDiaByMensajero, updatePedido } from '@/lib/supabase-pedidos';
import { supabasePedidos } from '@/lib/supabase-pedidos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Package,
  CheckCircle,
  RotateCcw,
  Truck,
  Clock,
  DollarSign,
  Smartphone,
  Navigation,
  Phone,
  MapPin as LocationIcon,
  User,
  Edit3,
  MessageSquare,
  AlertTriangle,
  Building2,
  Plus,
  Receipt,
  Upload,
  Camera,
  FileText,
  Calendar,
  Route,
  Fuel,
  Coffee,
  Car,
  Wrench,
  CreditCard,
  Image as ImageIcon,
  X,
  Save,
  CheckCircle2,
  Banknote,
  Search,
  Filter,
  MessageCircle,
  Map
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Expense {
  id: string;
  type: 'fuel' | 'food' | 'maintenance' | 'other';
  amount: number;
  description: string;
  receipt?: string;
  customType?: string;
  createdAt: string;
}

interface StatusChange {
  id: string;
  orderId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedByName: string;
  timestamp: string;
  comment?: string;
  paymentMethod?: string;
  receipt?: string;
  evidence?: string;
}

interface RouteData {
  orders: Order[];
  expenses: Expense[];
  totalExpenses: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

export default function MiRutaHoy() {
  const { user } = useAuth();
  const [routeData, setRouteData] = useState<RouteData>({
    orders: [],
    expenses: [],
    totalExpenses: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [accountingMetrics, setAccountingMetrics] = useState({
    totalCash: 0,
    totalSinpe: 0,
    totalReturns: 0
  });
  const [activeFilter, setActiveFilter] = useState<'todos' | 'en_ruta' | 'completados' | 'reagendados' | 'devoluciones'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newExpense, setNewExpense] = useState({
    type: 'fuel' as 'fuel' | 'food' | 'maintenance' | 'other',
    amount: '',
    description: '',
    receipt: null as File | null,
    customType: ''
  });
  const [uploadedReceiptImage, setUploadedReceiptImage] = useState<string | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('en_ruta');
  const [statusComment, setStatusComment] = useState('');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedOrderForNotes, setSelectedOrderForNotes] = useState<Order | null>(null);
  const [newNote, setNewNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [uploadedReceipt, setUploadedReceipt] = useState<string | null>(null);
  const [uploadedEvidence, setUploadedEvidence] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estados para pagos múltiples
  const [isDualPayment, setIsDualPayment] = useState(false);
  const [firstPaymentMethod, setFirstPaymentMethod] = useState<string>('');
  const [firstPaymentAmount, setFirstPaymentAmount] = useState<string>('');
  const [secondPaymentMethod, setSecondPaymentMethod] = useState<string>('');
  const [secondPaymentAmount, setSecondPaymentAmount] = useState<string>('');
  const [firstPaymentReceipt, setFirstPaymentReceipt] = useState<string | null>(null);
  const [secondPaymentReceipt, setSecondPaymentReceipt] = useState<string | null>(null);
  const [isReagendadoAsChange, setIsReagendadoAsChange] = useState(false);
  const [reagendadoDate, setReagendadoDate] = useState<Date | undefined>(undefined);
  const [isReagendadoDatePickerOpen, setIsReagendadoDatePickerOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedOrderForTimeline, setSelectedOrderForTimeline] = useState<Order | null>(null);
  const [statusChanges, setStatusChanges] = useState<StatusChange[]>([]);

  useEffect(() => {
    if (user) {
      loadRouteData();
    }
  }, [user, selectedDate, dateFilter]);

  // Countdown para el modal de éxito
  useEffect(() => {
    if (isSuccessModalOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSuccessModalOpen && countdown === 0) {
      setIsSuccessModalOpen(false);
      setCountdown(3);
      setSuccessMessage('');
    }
  }, [isSuccessModalOpen, countdown]);

  const loadRouteData = async () => {
    try {
      setLoading(true);
      
      // Determinar la fecha objetivo basada en el filtro activo
      let targetDateISO: string;
      let targetDateString: string;
      
      if (selectedDate) {
        // Si hay una fecha específica seleccionada, usar esa
        targetDateISO = selectedDate.toISOString().split('T')[0];
        targetDateString = selectedDate.toDateString();
      } else {
        // Usar el filtro de período por defecto
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            targetDateISO = now.toISOString().split('T')[0];
            targetDateString = now.toDateString();
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            targetDateISO = yesterday.toISOString().split('T')[0];
            targetDateString = yesterday.toDateString();
            break;
          case 'thisWeek':
            // Para esta semana, usar hoy por defecto
            targetDateISO = now.toISOString().split('T')[0];
            targetDateString = now.toDateString();
            break;
          case 'thisMonth':
            // Para este mes, usar hoy por defecto
            targetDateISO = now.toISOString().split('T')[0];
            targetDateString = now.toDateString();
            break;
          default:
            targetDateISO = now.toISOString().split('T')[0];
            targetDateString = now.toDateString();
        }
      }
      
      console.log('📅 Fecha objetivo (formato completo):', targetDateString);
      console.log('📅 Fecha objetivo (ISO):', targetDateISO);
      console.log('📅 Filtro activo:', dateFilter);
      
      // Obtener pedidos de Supabase filtrados por mensajero Y fecha objetivo
      const pedidosSupabase = await getPedidosDelDiaByMensajero(user?.name || '', targetDateISO);
      console.log('=== LOG DE PEDIDOS EN MI RUTA HOY ===');
      console.log('Usuario autenticado:', user?.name, '(', user?.email, ')');
      console.log('Rol del usuario:', user?.role);
      console.log('Fecha de consulta:', targetDateISO);
      console.log('Total de pedidos del día cargados:', pedidosSupabase.length);
      console.log('Pedidos completos:', pedidosSupabase);
      console.log('=== FIN DEL LOG DE PEDIDOS ===');
      
      // Si no hay pedidos para la fecha objetivo y es el filtro de "hoy", 
      // buscar en todas las fechas disponibles para mostrar algo
      let pedidosDelDia = pedidosSupabase.filter(pedido => {
        if (!pedido.fecha_creacion) return false;
        const pedidoDate = new Date(pedido.fecha_creacion).toISOString().split('T')[0];
        return pedidoDate === targetDateISO;
      });

      // Si no hay pedidos para hoy y es el filtro de "hoy", buscar en todas las fechas
      if (pedidosDelDia.length === 0 && dateFilter === 'today') {
        console.log('🔍 No hay pedidos para hoy, buscando en todas las fechas...');
        const { data: allPedidos, error: allError } = await supabasePedidos
          .from('pedidos')
          .select('*')
          .or(`mensajero_asignado.ilike.${user?.name || ''},mensajero_concretado.ilike.${user?.name || ''}`);
        
        if (!allError && allPedidos) {
          console.log('📊 Pedidos encontrados en todas las fechas:', allPedidos.length);
          // Mostrar los pedidos más recientes (últimos 10)
          pedidosDelDia = allPedidos
            .sort((a, b) => new Date(b.fecha_creacion || '').getTime() - new Date(a.fecha_creacion || '').getTime())
            .slice(0, 10);
          console.log('📊 Mostrando los 10 pedidos más recientes:', pedidosDelDia.length);
        }
      }
      
      console.log('🔍 Filtrado adicional por fecha:');
      console.log('Pedidos antes del filtro:', pedidosSupabase.length);
      console.log('Pedidos después del filtro:', pedidosDelDia.length);
      
      // Convertir pedidos de Supabase al formato de la aplicación
      console.log('🔄 Iniciando conversión de pedidos en Mi Ruta Hoy...');
      const orders: Order[] = pedidosDelDia.map((pedido, index) => {
        try {
          // Determinar el estado del pedido basado en los campos disponibles
             let status: OrderStatus = 'pendiente';
             
             // Mapear estados específicos del CSV
             if (pedido.estado_pedido) {
               const estado = pedido.estado_pedido.toLowerCase();
               if (estado === 'entregado') {
                 status = 'entregado';
               } else if (estado === 'devolucion') {
                 status = 'devolucion';
               } else if (estado === 'reagendado' || estado === 'reagendo') {
                 status = 'reagendado';
               } else if (estado === 'en_ruta' || estado === 'en ruta') {
                 status = 'en_ruta';
               } else if (estado === 'pendiente') {
                 status = 'pendiente';
               } else {
                 // Para otros estados, usar lógica de mensajero
                 if (pedido.mensajero_concretado) {
                   status = 'entregado';
                 } else if (pedido.mensajero_asignado) {
                   status = 'en_ruta';
                 }
               }
             } else {
               // Si estado_pedido es null, vacío o empty, usar lógica de mensajero
               if (pedido.mensajero_concretado) {
                 status = 'entregado';
               } else if (pedido.mensajero_asignado) {
                 status = 'en_ruta';
               }
             }

          // Usar la fecha de creación del pedido si está disponible, sino usar la fecha actual
          const createdAt = pedido.fecha_creacion ? 
            new Date(pedido.fecha_creacion).toISOString() : 
            new Date().toISOString();

          // Validar campos críticos
          if (!pedido.id_pedido) {
            console.warn(`⚠️ Pedido sin ID en índice ${index}:`, pedido);
          }
          if (pedido.valor_total === null || pedido.valor_total === undefined) {
            console.warn(`⚠️ Pedido sin valor_total en índice ${index}:`, pedido);
          }

        return {
          id: pedido.id_pedido || `pedido-${index}`,
          customerName: pedido.cliente_nombre || `Cliente ${pedido.id_pedido || index}`,
          customerPhone: pedido.cliente_telefono || '0000-0000',
          customerAddress: pedido.direccion || pedido.distrito || 'Dirección no disponible',
          customerProvince: pedido.provincia || 'San José',
          customerCanton: pedido.canton || 'Central',
          customerDistrict: pedido.distrito || 'Distrito no disponible',
          customerLocationLink: pedido.link_ubicacion || undefined,
          items: [],
          productos: pedido.productos || 'Productos no especificados', // Items vacíos por ahora
          totalAmount: pedido.valor_total ? parseFloat(pedido.valor_total.toString()) : 0,
          status,
          paymentMethod: (() => {
            const metodo = pedido.metodo_pago?.toLowerCase();
            if (metodo === 'sinpe') return 'sinpe' as const;
            if (metodo === 'tarjeta') return 'tarjeta' as const;
            if (metodo === '2pagos' || metodo === '2 pagos') return '2pagos' as const;
            return 'efectivo' as const;
          })(),
          metodoPagoOriginal: pedido.metodo_pago || 'No especificado',
          origin: 'csv' as const,
          createdAt,
          updatedAt: createdAt,
          scheduledDate: pedido.fecha_entrega || undefined,
          deliveryDate: pedido.fecha_entrega || undefined,
          notes: pedido.notas || '',
          deliveryNotes: pedido.nota_asesor || '',
          tienda: pedido.tienda || 'ALL STARS',
               assignedMessenger: pedido.mensajero_concretado ? {
                 id: '1',
                 name: pedido.mensajero_concretado,
                 email: '',
                 role: 'mensajero' as const,
                 createdAt: new Date().toISOString(),
                 isActive: true
               } : undefined,
        };
        } catch (error) {
          console.error(`❌ Error procesando pedido en índice ${index}:`, error);
          console.error('Pedido problemático:', pedido);
          // Devolver un pedido por defecto en caso de error
          return {
            id: `error-${index}`,
            customerName: 'Error en pedido',
            customerPhone: '0000-0000',
            customerAddress: 'Error',
            customerProvince: 'San José',
            customerCanton: 'Central',
            customerDistrict: 'Error',
            items: [],
            totalAmount: 0,
            status: 'pendiente' as const,
            paymentMethod: 'efectivo' as const,
            origin: 'csv' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: 'Error al procesar pedido',
            deliveryNotes: '',
          };
        }
      });
      
      console.log('✅ Conversión completada en Mi Ruta Hoy. Pedidos convertidos:', orders.length);

      // Simular gastos del día (en una implementación real, esto vendría de la API)
      const mockExpenses: Expense[] = [
        {
          id: '1',
          type: 'fuel',
          amount: 5000,
          description: 'Combustible para la ruta',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'food',
          amount: 3000,
          description: 'Almuerzo',
          createdAt: new Date().toISOString()
        }
      ];

      const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const completedOrders = orders.filter(order => order.status === 'entregado').length;

      // Calcular métricas de contabilidad
      const totalCash = orders
        .filter(order => order.paymentMethod === 'efectivo' && order.status === 'entregado')
        .reduce((sum, order) => sum + order.totalAmount, 0);
      
      const totalSinpe = orders
        .filter(order => order.paymentMethod === 'sinpe' && order.status === 'entregado')
        .reduce((sum, order) => sum + order.totalAmount, 0);
      
      const totalReturns = orders.filter(order => order.status === 'devolucion').length;

      setRouteData({
        orders,
        expenses: mockExpenses,
        totalExpenses,
        totalOrders: orders.length,
        completedOrders,
        totalRevenue
      });

      setAccountingMetrics({
        totalCash,
        totalSinpe,
        totalReturns
      });
    } catch (error) {
      console.error('Error loading route data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedReceiptImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setNewExpense(prev => ({ ...prev, receipt: file }));
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description || !newExpense.receipt) return;
    if (newExpense.type === 'other' && !newExpense.customType.trim()) return;

    setIsAddingExpense(true);
    try {
      const expense: Expense = {
        id: Date.now().toString(),
        type: newExpense.type,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        receipt: uploadedReceiptImage || '',
        customType: newExpense.type === 'other' ? newExpense.customType : undefined,
        createdAt: new Date().toISOString()
      };

      setRouteData(prev => ({
        ...prev,
        expenses: [...prev.expenses, expense],
        totalExpenses: prev.totalExpenses + expense.amount
      }));

      setNewExpense({
        type: 'fuel',
        amount: '',
        description: '',
        receipt: null,
        customType: ''
      });
      setUploadedReceiptImage(null);
      setIsExpenseModalOpen(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsAddingExpense(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'en_ruta' | 'entregado' | 'devolucion' | 'reagendado') => {
    try {
      setUpdatingOrder(orderId);
      await mockApi.updateOrderStatus(orderId, status);
      await loadRouteData();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrderForUpdate || !newStatus) return;
    
    try {
      setUpdatingOrder(selectedOrderForUpdate.id);
      
      // Registrar el cambio en el timeline
      addStatusChange(
        selectedOrderForUpdate.id,
        selectedOrderForUpdate.status,
        newStatus,
        statusComment,
        paymentMethod,
        uploadedReceipt || undefined,
        uploadedEvidence || undefined
      );
      
      // Actualizar el estado manteniendo el routeOrder
      const updatedOrder = {
        ...selectedOrderForUpdate,
        status: newStatus as any,
        notes: statusComment ? `${selectedOrderForUpdate.notes || ''}\n[${new Date().toLocaleString()}] ${statusComment}`.trim() : selectedOrderForUpdate.notes
      };
      
      // Llamar al webhook de actualización de pedidos
      try {
        // Preparar datos de pago
        let metodoPagoData = paymentMethod || selectedOrderForUpdate.paymentMethod || 'efectivo';
        let pagosDetalle = null;
        
        if (paymentMethod === '2pagos') {
          metodoPagoData = '2pagos';
          pagosDetalle = {
            primerPago: {
              metodo: firstPaymentMethod,
              monto: parseFloat(firstPaymentAmount) || 0,
              comprobante: firstPaymentReceipt
            },
            segundoPago: {
              metodo: secondPaymentMethod,
              monto: parseFloat(secondPaymentAmount) || 0,
              comprobante: secondPaymentReceipt
            }
          };
        }

        const webhookData = {
          // Datos ya conocidos desde antes
          idPedido: selectedOrderForUpdate.id,
          mensajero: user?.name || 'Mensajero',
          
          // Datos tomados del formulario
          estadoPedido: newStatus,
          metodoPago: metodoPagoData,
          pagosDetalle: pagosDetalle,
          nota: statusComment || '',
          
          // Datos específicos para reagendado
          reagendadoComoCambio: newStatus === 'reagendado' ? isReagendadoAsChange : false,
          fechaReagendado: newStatus === 'reagendado' && reagendadoDate ? reagendadoDate.toISOString().split('T')[0] : null,
          
          // Datos adicionales del pedido
          clienteNombre: selectedOrderForUpdate.customerName,
          clienteTelefono: selectedOrderForUpdate.customerPhone,
          direccion: selectedOrderForUpdate.customerAddress,
          provincia: selectedOrderForUpdate.customerProvince,
          canton: selectedOrderForUpdate.customerCanton,
          distrito: selectedOrderForUpdate.customerDistrict,
          valorTotal: selectedOrderForUpdate.totalAmount,
          productos: selectedOrderForUpdate.productos || 'No especificados',
          
          // Ejemplo adicional de base64 para imagen (si aplica)
          imagenBase64: uploadedReceipt || uploadedEvidence || null,
          mimeType: uploadedReceipt || uploadedEvidence ? "image/jpeg" : null
        };

        console.log('🚀 Enviando datos al webhook:', webhookData);

        const response = await fetch("https://primary-production-2b25b.up.railway.app/webhook/actualizar-pedido", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(webhookData)
        });

        const resultado = await response.json();
        console.log("📡 Respuesta del webhook:", resultado);
        
        if (!response.ok) {
          console.error('❌ Error en la respuesta del webhook:', resultado);
        } else {
          console.log('✅ Webhook ejecutado exitosamente');
        }
      } catch (webhookError) {
        console.error('❌ Error al llamar al webhook:', webhookError);
        // No interrumpir el flujo principal si falla el webhook
      }
      
      // El webhook ya se ejecutó exitosamente, no necesitamos el mock API
      // await mockApi.updateOrderStatus(selectedOrderForUpdate.id, newStatus as any, statusComment);
      await loadRouteData();
      
      // Mostrar modal de éxito
      const statusLabels = {
        'entregado': 'Entregado',
        'en_ruta': 'En Ruta',
        'devolucion': 'Devolución',
        'reagendado': 'Reagendado'
      };
      
      setSuccessMessage(`El pedido ${selectedOrderForUpdate.id} fue actualizado a ${statusLabels[newStatus as keyof typeof statusLabels] || newStatus} con éxito`);
      setIsSuccessModalOpen(true);
      setCountdown(3);
      
      setIsUpdateStatusModalOpen(false);
      setSelectedOrderForUpdate(null);
      resetModalState();
    } catch (error) {
      console.error('Error updating order status:', error);
      setErrorMessage(`Error al actualizar el pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleOpenNotes = (order: Order) => {
    setSelectedOrderForNotes(order);
    setIsNotesModalOpen(true);
  };

  const handleCloseNotes = () => {
    setIsNotesModalOpen(false);
    setSelectedOrderForNotes(null);
    setNewNote('');
  };

  const handleAddNote = async () => {
    if (!selectedOrderForNotes || !newNote.trim()) return;
    
    try {
      const timestamp = new Date().toLocaleString('es-CR');
      const noteWithTimestamp = `[${timestamp}] ${newNote.trim()}`;
      
      // Aquí podrías hacer una llamada a la API para actualizar las notas
      // Por ahora solo actualizamos el estado local
      console.log('Agregando nota:', noteWithTimestamp);
      
      setNewNote('');
      handleCloseNotes();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'receipt' | 'evidence') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'receipt') {
        setUploadedReceipt(result);
      } else {
        setUploadedEvidence(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDualPaymentFileUpload = (event: React.ChangeEvent<HTMLInputElement>, paymentNumber: 'first' | 'second') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (paymentNumber === 'first') {
        setFirstPaymentReceipt(result);
      } else {
        setSecondPaymentReceipt(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetModalState = () => {
    setNewStatus('en_ruta');
    setStatusComment('');
    setPaymentMethod('');
    setUploadedReceipt(null);
    setUploadedEvidence(null);
    setIsUploading(false);
    setIsDualPayment(false);
    setFirstPaymentMethod('');
    setFirstPaymentAmount('');
    setSecondPaymentMethod('');
    setSecondPaymentAmount('');
    setFirstPaymentReceipt(null);
    setSecondPaymentReceipt(null);
    setIsReagendadoAsChange(false);
    setReagendadoDate(undefined);
    setIsReagendadoDatePickerOpen(false);
    setErrorMessage('');
  };

  const handleOpenTimeline = (order: Order) => {
    setSelectedOrderForTimeline(order);
    setIsTimelineModalOpen(true);
  };

  const handleCloseTimeline = () => {
    setIsTimelineModalOpen(false);
    setSelectedOrderForTimeline(null);
  };

  const addStatusChange = (orderId: string, fromStatus: string, toStatus: string, comment?: string, paymentMethod?: string, receipt?: string, evidence?: string) => {
    const newChange: StatusChange = {
      id: `change-${Date.now()}`,
      orderId,
      fromStatus,
      toStatus,
      changedBy: user?.id || 'unknown',
      changedByName: user?.name || 'Usuario',
      timestamp: new Date().toISOString(),
      comment,
      paymentMethod,
      receipt,
      evidence
    };
    
    setStatusChanges(prev => [newChange, ...prev]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_ruta': return '🚚';
      case 'entregado': return '✅';
      case 'devolucion': return '❌';
      case 'reagendado': return '📅';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_ruta': return 'text-blue-600 bg-blue-50';
      case 'entregado': return 'text-green-600 bg-green-50';
      case 'devolucion': return 'text-red-600 bg-red-50';
      case 'reagendado': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'en_ruta': return 'border-l-blue-500';
      case 'entregado': return 'border-l-green-500';
      case 'devolucion': return 'border-l-red-500';
      case 'reagendado': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStatusIndicatorColor = (status: string) => {
    switch (status) {
      case 'en_ruta': return 'bg-blue-500';
      case 'entregado': return 'bg-green-500';
      case 'devolucion': return 'bg-red-500';
      case 'reagendado': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getTodayInfo = () => {
    const today = new Date();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    return {
      dayName: dayNames[today.getDay()],
      day: today.getDate(),
      month: monthNames[today.getMonth()],
      year: today.getFullYear(),
      fullDate: today.toLocaleDateString('es-CR')
    };
  };


  // Filtrar y buscar pedidos
  const filteredOrders = routeData.orders
    .filter(order => {
      // Filtro por estado
      const statusMatch = activeFilter === 'todos' || 
        (activeFilter === 'en_ruta' && order.status === 'en_ruta') ||
        (activeFilter === 'completados' && order.status === 'entregado') ||
        (activeFilter === 'reagendados' && order.status === 'reagendado') ||
        (activeFilter === 'devoluciones' && order.status === 'devolucion');
      
      // Búsqueda por texto
      const searchMatch = searchTerm === '' || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      // Ordenar por número de ruta (routeOrder) - menor número primero
      const routeOrderA = a.routeOrder || 999;
      const routeOrderB = b.routeOrder || 999;
      
      return routeOrderA - routeOrderB;
    });

  const getFilterCount = (filter: string) => {
    switch (filter) {
      case 'en_ruta': return routeData.orders.filter(o => o.status === 'en_ruta').length;
      case 'completados': return routeData.orders.filter(o => o.status === 'entregado').length;
      case 'reagendados': return routeData.orders.filter(o => o.status === 'reagendado').length;
      case 'devoluciones': return routeData.orders.filter(o => o.status === 'devolucion').length;
      default: return routeData.orders.length;
    }
  };

  const getExpenseIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <Fuel className="w-4 h-4" />;
      case 'food': return <Coffee className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getExpenseColor = (type: string) => {
    switch (type) {
      case 'fuel': return 'bg-blue-100 text-blue-600';
      case 'food': return 'bg-green-100 text-green-600';
      case 'maintenance': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 rounded-xl shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full shadow-inner">
              <Route className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Mi Ruta de Hoy</h1>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {selectedDate ? 
                    selectedDate.toLocaleDateString('es-CR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    }) : 
                    getTodayInfo().dayName + ' ' + getTodayInfo().day + ' de ' + getTodayInfo().month
                  }
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {selectedDate ? selectedDate.toLocaleDateString('es-CR') : getTodayInfo().fullDate}
              </Badge>
            </div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span className="text-sm font-medium">Estado actual</span>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600">
                En Ruta
              </Badge>
            </div>
            <p className="text-xs opacity-75 mt-1">
              {routeData.totalOrders} pedidos del día • {routeData.completedOrders} completados
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">Completados</p>
                <p className="text-lg font-bold text-green-700">{routeData.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-medium">Ingresos</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(routeData.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Contabilidad */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            Contabilidad del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Total Recaudado en Efectivo */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Banknote className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Total Efectivo</p>
                  <p className="text-xs text-green-600">Pedidos entregados en efectivo</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(accountingMetrics.totalCash)}
                </p>
              </div>
            </div>

            {/* Total Recaudado en SINPE */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Total SINPE</p>
                  <p className="text-xs text-blue-600">Pedidos entregados con SINPE</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(accountingMetrics.totalSinpe)}
                </p>
              </div>
            </div>

            {/* Total Pedidos para Devolver */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Para Devolver</p>
                  <p className="text-xs text-red-600">Pedidos marcados como devolución</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-700">
                  {accountingMetrics.totalReturns}
                </p>
              </div>
            </div>
          </div>

          {/* Resumen Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total Recaudado:</span>
              <span className="font-bold text-xl text-green-700">
                {formatCurrency(accountingMetrics.totalCash + accountingMetrics.totalSinpe)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gastos del Día */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                Gastos del Día
              </CardTitle>
              <div className="text-sm text-orange-600 mt-1">
                <span className="font-medium">{user?.name}</span> • {getTodayInfo().dayName} {getTodayInfo().day} de {getTodayInfo().month}
              </div>
            </div>
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Agregar Gasto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="type">Tipo de Gasto</Label>
                    <select
                      id="type"
                      value={newExpense.type}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value as 'fuel' | 'food' | 'maintenance' | 'other', customType: '' }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="fuel">Combustible</option>
                      <option value="food">Alimentación</option>
                      <option value="maintenance">Mantenimiento</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  
                  {newExpense.type === 'other' && (
                    <div>
                      <Label htmlFor="customType">Especificar Tipo de Gasto *</Label>
                      <Input
                        id="customType"
                        placeholder="Ej: Peaje, Estacionamiento, Herramientas..."
                        value={newExpense.customType}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, customType: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe el gasto..."
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label>Comprobante del Gasto *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {uploadedReceiptImage ? (
                        <div className="space-y-3">
                          <img
                            src={uploadedReceiptImage}
                            alt="Comprobante"
                            className="max-w-full h-32 object-contain mx-auto rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUploadedReceiptImage(null);
                              setNewExpense(prev => ({ ...prev, receipt: null }));
                            }}
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
                            onChange={handleImageUpload}
                            className="hidden"
                            id="receipt-upload"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('receipt-upload')?.click()}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Seleccionar Imagen
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsExpenseModalOpen(false);
                        setUploadedReceiptImage(null);
      setNewExpense({
        type: 'fuel',
        amount: '',
        description: '',
        receipt: null,
        customType: ''
      });
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddExpense}
                      disabled={
                        !newExpense.amount || 
                        !newExpense.description || 
                        !newExpense.receipt || 
                        isAddingExpense ||
                        (newExpense.type === 'other' && !newExpense.customType.trim())
                      }
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {isAddingExpense ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Agregar'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {routeData.expenses.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay gastos registrados</p>
            </div>
          ) : (
            <>
              {routeData.expenses.map((expense) => (
                <div key={expense.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getExpenseColor(expense.type)}`}>
                        {getExpenseIcon(expense.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{expense.description}</p>
                        <p className="text-xs text-gray-500">
                          {expense.type === 'other' && expense.customType ? expense.customType : 
                           expense.type === 'fuel' ? 'Combustible' :
                           expense.type === 'food' ? 'Alimentación' :
                           expense.type === 'maintenance' ? 'Mantenimiento' : 'Otro'} • {formatDate(expense.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-orange-600">{formatCurrency(expense.amount)}</p>
                  </div>
                  {expense.receipt && (
                    <div className="mt-2">
                      <img
                        src={expense.receipt}
                        alt="Comprobante"
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Gastos:</span>
                  <span className="font-bold text-lg text-orange-600">
                    {formatCurrency(routeData.totalExpenses)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Filtros y Búsqueda */}
      <Card className="border-2 border-blue-100">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
          <div className="text-sm text-blue-600 mt-1">
            <span className="font-medium">{user?.name}</span> • {getTodayInfo().dayName} {getTodayInfo().day} de {getTodayInfo().month}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {/* Barra de búsqueda mejorada */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
            <Input
              placeholder="Buscar por ID, cliente o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
          
          {/* Filtros con mejor diseño */}
          <div className="space-y-3">
            {/* Todos - Ocupa las dos columnas */}
            <Button
              variant={activeFilter === 'todos' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('todos')}
              className={`justify-start gap-2 h-12 w-full ${
                activeFilter === 'todos' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                  : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Todos</span>
                <span className="text-xs opacity-75">({getFilterCount('todos')})</span>
              </div>
            </Button>
            
            {/* En Ruta y Completados - Primera fila de dos columnas */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={activeFilter === 'en_ruta' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('en_ruta')}
                className={`justify-start gap-2 h-12 ${
                  activeFilter === 'en_ruta' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">En Ruta</span>
                  <span className="text-xs opacity-75">({getFilterCount('en_ruta')})</span>
                </div>
              </Button>
              <Button
                variant={activeFilter === 'completados' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('completados')}
                className={`justify-start gap-2 h-12 ${
                  activeFilter === 'completados' 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                    : 'border-green-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Completados</span>
                  <span className="text-xs opacity-75">({getFilterCount('completados')})</span>
                </div>
              </Button>
            </div>
            
            {/* Reagendados y Devoluciones - Segunda fila de dos columnas */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={activeFilter === 'reagendados' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('reagendados')}
                className={`justify-start gap-2 h-12 ${
                  activeFilter === 'reagendados' 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md' 
                    : 'border-orange-200 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Reagendados</span>
                  <span className="text-xs opacity-75">({getFilterCount('reagendados')})</span>
                </div>
              </Button>
              <Button
                variant={activeFilter === 'devoluciones' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('devoluciones')}
                className={`justify-start gap-2 h-12 ${
                  activeFilter === 'devoluciones' 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' 
                    : 'border-red-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Devoluciones</span>
                  <span className="text-xs opacity-75">({getFilterCount('devoluciones')})</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Filtros de fecha rápida */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {/* Selector de fecha específica */}
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
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
                      setDateFilter('all');
                      setIsDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                onClick={() => {
                  setDateFilter('today');
                  setSelectedDate(undefined);
                }}
                className={`justify-start gap-2 h-10 text-sm ${
                  dateFilter === 'today' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Hoy
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                onClick={() => {
                  setDateFilter('yesterday');
                  setSelectedDate(undefined);
                }}
                className={`justify-start gap-2 h-10 text-sm ${
                  dateFilter === 'yesterday' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Ayer
              </Button>
            </div>
          </div>
          
          {/* Resumen de resultados */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Mostrando <span className="font-semibold text-gray-800">{filteredOrders.length}</span> de <span className="font-semibold text-gray-800">{routeData.orders.length}</span> pedidos
              </span>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-700 h-6 px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Pedidos del Día */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Pedidos del Día
          </CardTitle>
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-medium">{user?.name}</span> • {getTodayInfo().dayName} {getTodayInfo().day} de {getTodayInfo().month}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {searchTerm ? 'No se encontraron pedidos con ese criterio' : 'No hay pedidos asignados para hoy'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="min-w-[120px]">ID Pedido</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[200px]">Productos</TableHead>
                    <TableHead className="min-w-[250px]">Dirección</TableHead>
                    <TableHead className="w-24 text-right">Monto</TableHead>
                    <TableHead className="w-24">Pago</TableHead>
                    <TableHead className="w-24">Estado</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order, index) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusIndicatorColor(order.status)}`} />
                          {order.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-xs text-gray-500">{order.customerPhone}</div>
                          </div>
                          
                          {/* Botones de contacto */}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => order.customerPhone && window.open(`tel:${order.customerPhone}`)}
                              className="h-7 px-2 text-xs bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                              disabled={!order.customerPhone}
                              title="Llamar"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Llamar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (order.customerPhone) {
                                  const messengerName = user?.name || 'Mensajero';
                                  const tiendaName = order.tienda || 'ALL STARS';
                                  const products = order.productos || 'Productos no especificados';
                                  const orderNumber = order.routeOrder ? `#${order.routeOrder}` : order.id;
                                  
                                  const message = `Buen día *${order.customerName}* 📍 Soy el mensajero que va entregar tu pedido de *${products}* de la tienda *${tiendaName}* Y me dirijo a la dirección *${order.customerAddress}* en *${order.customerCanton}* en el distrito *${order.customerDistrict}* en la provincia *${order.customerProvince}* 📍. Por favor confirmame que te encuentras ahí.`;

                                  // Remover +506 del número si está presente
                                  const cleanPhone = order.customerPhone.replace(/^\+506/, '');
                                  const encodedMessage = encodeURIComponent(message);
                                  const whatsappUrl = `https://wa.me/506${cleanPhone}?text=${encodedMessage}`;
                                  window.open(whatsappUrl);
                                }
                              }}
                              className="h-7 px-2 text-xs bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700"
                              disabled={!order.customerPhone}
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" />
                              WhatsApp
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={order.productos || 'No especificados'}>
                          {order.productos || 'No especificados'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {/* Dirección principal */}
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {order.customerAddress || 'Dirección no especificada'}
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Provincia:</span> {order.customerProvince || 'No especificada'}
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Cantón:</span> {order.customerCanton || 'No especificado'}
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Distrito:</span> {order.customerDistrict || 'No especificado'}
                            </div>
                          </div>
                          
                          {/* Botón de Maps */}
                          {order.customerLocationLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(order.customerLocationLink, '_blank');
                              }}
                              className="h-7 px-2 text-xs bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                              title="Abrir en Maps"
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              Maps
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            order.paymentMethod === 'efectivo' ? 'bg-green-50 text-green-700 border-green-200' :
                            order.paymentMethod === 'sinpe' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.paymentMethod === 'tarjeta' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            order.paymentMethod === '2pagos' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {order.paymentMethod === '2pagos' ? '💰 2 Pagos' : (order.metodoPagoOriginal || 'No especificado')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
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
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrderForUpdate(order);
                              setNewStatus('en_ruta');
                              setPaymentMethod(order.paymentMethod || 'efectivo');
                              setIsUpdateStatusModalOpen(true);
                            }}
                            className="h-8 w-8 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                            disabled={updatingOrder === order.id}
                            title="Actualizar Estado"
                          >
                            {updatingOrder === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Edit3 className="w-3 h-3" />
                            )}
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

      {/* Modal para subir comprobante */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Subir Comprobante</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Pedido: {selectedOrder.id}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-600">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
              
              <div className="space-y-3">
                <Label>Tipo de Comprobante</Label>
                <select className="w-full p-2 border rounded-md">
                  <option value="payment">Comprobante de Pago</option>
                  <option value="sinpe">Comprobante SINPE</option>
                  <option value="reschedule">Comprobante de Reagendado</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label>Subir Imagen</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Toca para seleccionar imagen</p>
                  <input type="file" accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-1" />
                  Subir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para actualizar estado */}
      <Dialog open={isUpdateStatusModalOpen} onOpenChange={setIsUpdateStatusModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="flex-shrink-0 p-6 pb-4">
              <DialogTitle>Actualizar Estado del Pedido</DialogTitle>
            </DialogHeader>
            {selectedOrderForUpdate && (
              <div className="flex-1 overflow-y-auto px-6 space-y-4 min-h-0">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Pedido: {selectedOrderForUpdate.id}</p>
                <p className="text-sm text-gray-600">{selectedOrderForUpdate.customerName}</p>
                <p className="text-sm text-gray-600">{formatCurrency(selectedOrderForUpdate.totalAmount)}</p>
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
                      {selectedOrderForUpdate.paymentMethod === 'efectivo' ? '💵 Efectivo' :
                       selectedOrderForUpdate.paymentMethod === 'sinpe' ? '📱 SINPE' :
                       selectedOrderForUpdate.paymentMethod === 'tarjeta' ? '💳 Tarjeta' :
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
                      💰 2 Pagos
                    </Button>
                  </div>
                  
                  {/* Comprobante para SINPE o Tarjeta */}
                  {(paymentMethod === 'sinpe' || paymentMethod === 'tarjeta') && (
                    <div className="space-y-2">
                      <Label>Comprobante de Transacción *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {uploadedReceipt ? (
                          <div className="space-y-3">
                            <img
                              src={uploadedReceipt}
                              alt="Comprobante"
                              className="max-w-full h-32 object-contain mx-auto rounded-lg"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadedReceipt(null)}
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
                              onChange={(e) => handleFileUpload(e, 'receipt')}
                              className="hidden"
                              id="receipt-upload"
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('receipt-upload')?.click()}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Seleccionar Imagen
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
                            <Select value={firstPaymentMethod} onValueChange={setFirstPaymentMethod}>
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
                              value={firstPaymentAmount}
                              onChange={(e) => setFirstPaymentAmount(e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                        
                        {/* Comprobante para primer pago si es SINPE o Tarjeta */}
                        {(firstPaymentMethod === 'sinpe' || firstPaymentMethod === 'tarjeta') && (
                          <div className="space-y-2">
                            <Label className="text-xs">Comprobante del Primer Pago *</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                              {firstPaymentReceipt ? (
                                <div className="space-y-2">
                                  <img
                                    src={firstPaymentReceipt}
                                    alt="Comprobante primer pago"
                                    className="max-w-full h-24 object-contain mx-auto rounded-lg"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFirstPaymentReceipt(null)}
                                    className="text-red-600 hover:text-red-700 h-6 text-xs"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Eliminar
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Camera className="w-6 h-6 mx-auto text-gray-400" />
                                  <p className="text-xs text-gray-600">Comprobante del primer pago</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleDualPaymentFileUpload(e, 'first')}
                                    className="hidden"
                                    id="first-payment-upload"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('first-payment-upload')?.click()}
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
                          <span className="font-bold">{formatCurrency(selectedOrderForUpdate?.totalAmount || 0)}</span>
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
                              (parseFloat(firstPaymentAmount) || 0) + (parseFloat(secondPaymentAmount) || 0) === (selectedOrderForUpdate?.totalAmount || 0)
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency((parseFloat(firstPaymentAmount) || 0) + (parseFloat(secondPaymentAmount) || 0) - (selectedOrderForUpdate?.totalAmount || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selector de fecha obligatorio para reagendado */}
              {newStatus === 'reagendado' && (
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
                        selected={reagendadoDate}
                        onSelect={(date) => {
                          setReagendadoDate(date);
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
              {newStatus === 'reagendado' && (
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
              {(newStatus === 'devolucion' || newStatus === 'reagendado') && (
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

              </div>
            )}
            {/* Botones fijos en la parte inferior */}
            {selectedOrderForUpdate && (
              <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-white">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUpdateStatusModalOpen(false);
                    setSelectedOrderForUpdate(null);
                    resetModalState();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={
                    !newStatus || 
                    updatingOrder === selectedOrderForUpdate?.id ||
                    (newStatus === 'entregado' && !paymentMethod) ||
                    (newStatus === 'entregado' && (paymentMethod === 'sinpe' || paymentMethod === 'tarjeta') && !uploadedReceipt) ||
                    (newStatus === 'entregado' && paymentMethod === '2pagos' && (
                      !firstPaymentMethod || !secondPaymentMethod || 
                      !firstPaymentAmount || !secondPaymentAmount ||
                      (firstPaymentMethod === 'sinpe' && !firstPaymentReceipt) ||
                      (firstPaymentMethod === 'tarjeta' && !firstPaymentReceipt) ||
                      (secondPaymentMethod === 'sinpe' && !secondPaymentReceipt) ||
                      (secondPaymentMethod === 'tarjeta' && !secondPaymentReceipt) ||
                      (parseFloat(firstPaymentAmount) + parseFloat(secondPaymentAmount)) !== selectedOrderForUpdate?.totalAmount
                    )) ||
                    ((newStatus === 'devolucion' || newStatus === 'reagendado') && !uploadedEvidence) ||
                    (newStatus === 'reagendado' && !reagendadoDate)
                  }
                  className="flex-1"
                >
                  {updatingOrder === selectedOrderForUpdate?.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar'
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Notas */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-600" />
              Notas del Pedido
            </DialogTitle>
          </DialogHeader>
          {selectedOrderForNotes && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Pedido: {selectedOrderForNotes.id}</p>
                <p className="text-sm text-gray-600">{selectedOrderForNotes.customerName}</p>
                <p className="text-sm text-gray-600">{selectedOrderForNotes.customerProvince} • {selectedOrderForNotes.customerCanton} • {selectedOrderForNotes.customerDistrict}</p>
              </div>
              
              {/* Notas existentes */}
              {selectedOrderForNotes.notes && (
                <div className="space-y-3">
                  <Label>Notas del Asesor</Label>
                  <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-200">
                    <p className="text-sm whitespace-pre-wrap">{selectedOrderForNotes.notes}</p>
                  </div>
                </div>
              )}
              
              {/* Agregar nueva nota */}
              <div className="space-y-3">
                <Label>Agregar Nota del Mensajero</Label>
                <Textarea
                  placeholder="Escribe una nota sobre este pedido..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseNotes}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Agregar Nota
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal del Timeline */}
      <Dialog open={isTimelineModalOpen} onOpenChange={setIsTimelineModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Timeline del Pedido
            </DialogTitle>
          </DialogHeader>
          {selectedOrderForTimeline && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Pedido: {selectedOrderForTimeline.id}</p>
                <p className="text-sm text-gray-600">{selectedOrderForTimeline.customerName}</p>
                <p className="text-sm text-gray-600">{formatCurrency(selectedOrderForTimeline.totalAmount)}</p>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Historial de Cambios de Estado</h4>
                
                {statusChanges.filter(change => change.orderId === selectedOrderForTimeline.id).length > 0 ? (
                  <div className="space-y-3">
                    {statusChanges.filter(change => change.orderId === selectedOrderForTimeline.id).map((change, index) => (
                      <div key={change.id} className="relative">
                        {/* Línea conectora */}
                        {index < statusChanges.filter(change => change.orderId === selectedOrderForTimeline.id).length - 1 && (
                          <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          {/* Icono del estado */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${getStatusColor(change.toStatus)}`}>
                            {getStatusIcon(change.toStatus)}
                          </div>
                          
                          {/* Contenido del cambio */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {change.fromStatus} → {change.toStatus}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {change.changedByName}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-2">
                              {formatTimestamp(change.timestamp)}
                            </p>
                            
                            {/* Información adicional */}
                            <div className="space-y-1">
                              {change.comment && (
                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                  <strong>Comentario:</strong> {change.comment}
                                </p>
                              )}
                              
                              {change.paymentMethod && (
                                <p className="text-sm text-gray-700">
                                  <strong>Método de pago:</strong> {change.paymentMethod}
                                </p>
                              )}
                              
                              {change.receipt && (
                                <div className="text-sm text-gray-700">
                                  <strong>Comprobante:</strong> 
                                  <img src={change.receipt} alt="Comprobante" className="mt-1 max-w-32 h-20 object-contain rounded border" />
                                </div>
                              )}
                              
                              {change.evidence && (
                                <div className="text-sm text-gray-700">
                                  <strong>Evidencia:</strong> 
                                  <img src={change.evidence} alt="Evidencia" className="mt-1 max-w-32 h-20 object-contain rounded border" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay cambios de estado registrados para este pedido</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseTimeline}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Éxito */}
      <AlertDialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              ¡Actualización Exitosa!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center py-4">
              <div className="space-y-3">
                <p className="text-lg font-medium text-gray-900">
                  {successMessage}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Cerrando automáticamente en {countdown} segundos...</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Error */}
      {errorMessage && (
        <AlertDialog open={!!errorMessage} onOpenChange={() => setErrorMessage('')}>
          <AlertDialogContent className="sm:max-w-[400px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Error en la Actualización
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center py-4">
                <div className="space-y-3">
                  <p className="text-lg font-medium text-gray-900">
                    {errorMessage}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setErrorMessage('')}
                    className="w-full"
                  >
                    Cerrar
                  </Button>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
