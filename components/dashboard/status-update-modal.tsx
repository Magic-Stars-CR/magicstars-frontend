'use client';

import { useState, useEffect } from 'react';
import { PedidoTest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Camera,
  X,
  Calendar,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoTest | null;
  onUpdate: (updates: Partial<PedidoTest>) => Promise<boolean>;
  updating: boolean;
  userRole?: 'admin' | 'mensajero' | 'tienda';
}

export function StatusUpdateModal({
  isOpen,
  onClose,
  pedido,
  onUpdate,
  updating,
  userRole = 'admin'
}: StatusUpdateModalProps) {
  // Estados del modal
  const [newStatus, setNewStatus] = useState<string>('en_ruta');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [statusComment, setStatusComment] = useState('');
  const [isDualPayment, setIsDualPayment] = useState(false);
  
  // Estados para pagos duales
  const [firstPaymentMethod, setFirstPaymentMethod] = useState<string>('efectivo');
  const [firstPaymentAmount, setFirstPaymentAmount] = useState('');
  const [firstPaymentReceipt, setFirstPaymentReceipt] = useState<string | null>(null);
  const [secondPaymentMethod, setSecondPaymentMethod] = useState<string>(''); // Vacío por defecto
  const [secondPaymentAmount, setSecondPaymentAmount] = useState('');
  const [secondPaymentReceipt, setSecondPaymentReceipt] = useState<string | null>(null);
  
  // Estados para reagendado
  const [reagendadoDate, setReagendadoDate] = useState<Date | undefined>(undefined);
  const [isReagendadoDatePickerOpen, setIsReagendadoDatePickerOpen] = useState(false);
  const [isReagendadoAsChange, setIsReagendadoAsChange] = useState(false);
  
  // Estados para comprobantes
  const [uploadedReceipts, setUploadedReceipts] = useState<string[]>([]);
  const [uploadedEvidence, setUploadedEvidence] = useState<string | null>(null);

  // Resetear estado del modal cuando se abre
  useEffect(() => {
    if (isOpen && pedido) {
      setNewStatus(pedido.estado_pedido || 'en_ruta');
      setPaymentMethod(pedido.metodo_pago || 'efectivo');
      setStatusComment('');
      setIsDualPayment(pedido.metodo_pago === '2pagos');
      // Cuando se abre el modal con 2pagos, establecer primer método como efectivo
      setFirstPaymentMethod(pedido.metodo_pago === '2pagos' ? 'efectivo' : 'efectivo');
      setFirstPaymentAmount('');
      setFirstPaymentReceipt(null);
      setSecondPaymentMethod(''); // Segundo método vacío para que el usuario lo seleccione
      setSecondPaymentAmount('');
      setSecondPaymentReceipt(null);
      setReagendadoDate(undefined);
      setIsReagendadoAsChange(false);
      setUploadedReceipts([]);
      setUploadedEvidence(null);
    }
  }, [isOpen, pedido]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'receipt' | 'evidence') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'receipt') {
          setUploadedReceipts(prev => [...prev, result]);
        } else {
          setUploadedEvidence(result);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDualPaymentFileUpload = (e: React.ChangeEvent<HTMLInputElement>, payment: 'first' | 'second') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (payment === 'first') {
        setFirstPaymentReceipt(result);
      } else {
        setSecondPaymentReceipt(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetModalState = () => {
    setNewStatus('en_ruta');
    setPaymentMethod('efectivo');
    setStatusComment('');
    setIsDualPayment(false);
    setFirstPaymentMethod('efectivo');
    setFirstPaymentAmount('');
    setFirstPaymentReceipt(null);
    setSecondPaymentMethod(''); // Segundo método vacío por defecto
    setSecondPaymentAmount('');
    setSecondPaymentReceipt(null);
    setReagendadoDate(undefined);
    setIsReagendadoAsChange(false);
    setUploadedReceipts([]);
    setUploadedEvidence(null);
  };

  const handleUpdate = async () => {
    if (!pedido) return;

    const updates: Partial<PedidoTest> = {
      estado_pedido: newStatus
    };

    // Si es entregado, actualizar método de pago
    if (newStatus === 'entregado') {
      updates.metodo_pago = paymentMethod;
      
      if (isDualPayment && paymentMethod === '2pagos') {
        updates.efectivo_2_pagos = firstPaymentAmount;
        updates.sinpe_2_pagos = secondPaymentAmount;
      }
    }

    // Si hay notas, añadirlas
    if (statusComment) {
      updates.notas = statusComment;
    }

    // Si es entregado, marcar como concretado
    if (newStatus === 'entregado') {
      updates.mensajero_concretado = pedido.mensajero_asignado || 'Admin';
    }

    // Si es en_ruta, asignar mensajero
    if (newStatus === 'en_ruta') {
      updates.mensajero_asignado = 'Admin';
    }

    const success = await onUpdate(updates);
    if (success) {
      onClose();
      resetModalState();
    }
  };

  const isUpdateDisabled = () => {
    if (!newStatus) return true;
    if (updating) return true;
    if (newStatus === 'entregado' && !paymentMethod) return true;
    if (newStatus === 'entregado' && (paymentMethod === 'sinpe' || paymentMethod === 'tarjeta') && uploadedReceipts.length === 0) return true;
    if (newStatus === 'entregado' && paymentMethod === '2pagos' && (
      !firstPaymentMethod || !secondPaymentMethod || 
      !firstPaymentAmount || !secondPaymentAmount ||
      (firstPaymentMethod === 'sinpe' && !firstPaymentReceipt) ||
      (firstPaymentMethod === 'tarjeta' && !firstPaymentReceipt) ||
      (secondPaymentMethod === 'sinpe' && !secondPaymentReceipt) ||
      (secondPaymentMethod === 'tarjeta' && !secondPaymentReceipt) ||
      (parseFloat(firstPaymentAmount) + parseFloat(secondPaymentAmount)) !== pedido?.valor_total
    )) return true;
    if ((newStatus === 'devolucion' || newStatus === 'reagendado') && !uploadedEvidence) return true;
    if (newStatus === 'reagendado' && !reagendadoDate) return true;
    
    return false;
  };

  if (!pedido) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle>Actualizar Estado del Pedido</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 space-y-4 min-h-0">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">Pedido: {pedido.id_pedido}</p>
              <p className="text-sm text-gray-600">{pedido.cliente_nombre}</p>
              <p className="text-sm text-gray-600">{formatCurrency(pedido.valor_total)}</p>
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
                    {paymentMethod === 'efectivo' ? '💵 Efectivo' :
                     paymentMethod === 'sinpe' ? '📱 SINPE' :
                     paymentMethod === 'tarjeta' ? '💳 Tarjeta' :
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
                        <span className="font-bold">{formatCurrency(pedido?.valor_total || 0)}</span>
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
                            (parseFloat(firstPaymentAmount) || 0) + (parseFloat(secondPaymentAmount) || 0) === (pedido?.valor_total || 0)
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency((parseFloat(firstPaymentAmount) || 0) + (parseFloat(secondPaymentAmount) || 0) - (pedido?.valor_total || 0))}
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
          
          {/* Botones fijos en la parte inferior */}
          <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                resetModalState();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdateDisabled()}
              className="flex-1"
            >
              {updating ? (
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
      </DialogContent>
    </Dialog>
  );
}
