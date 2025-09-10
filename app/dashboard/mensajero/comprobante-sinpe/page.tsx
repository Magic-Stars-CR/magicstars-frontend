'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { mockApi } from '@/lib/mock-api';
import { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Upload,
  Camera,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Smartphone,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Package,
  ArrowLeft,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SINPEReceipt {
  id: string;
  orderId: string;
  amount: number;
  reference: string;
  bank: string;
  accountNumber: string;
  customerName: string;
  customerPhone: string;
  receiptImage: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ComprobanteSINPE() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState({
    reference: '',
    bank: '',
    accountNumber: '',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const today = new Date().toDateString();
      
      // Obtener pedidos del día que son pagos SINPE
      const allOrders = await mockApi.getOrders({ 
        assignedMessengerId: user?.id,
        date: today
      });
      
      const sinpeOrders = allOrders.filter(order => order.paymentMethod === 'sinpe');
      setOrders(sinpeOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedOrder || !uploadedImage || !receiptData.reference) return;

    setIsUploading(true);
    try {
      // Simular subida de comprobante
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí iría la lógica real para subir el comprobante
      console.log('Comprobante subido:', {
        orderId: selectedOrder.id,
        receiptData,
        image: uploadedImage
      });

      // Limpiar formulario
      setReceiptData({
        reference: '',
        bank: '',
        accountNumber: '',
        amount: '',
        notes: ''
      });
      setUploadedImage(null);
      setIsUploadModalOpen(false);
      setSelectedOrder(null);

      // Mostrar mensaje de éxito
      alert('Comprobante subido exitosamente');
    } catch (error) {
      console.error('Error uploading receipt:', error);
      alert('Error al subir el comprobante');
    } finally {
      setIsUploading(false);
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
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/dashboard/mensajero">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            <h1 className="text-xl font-bold">Comprobante SINPE</h1>
          </div>
        </div>
        <p className="text-sm opacity-90">
          Sube comprobantes de transferencias bancarias
        </p>
      </div>

      {/* Instrucciones */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Instrucciones:</strong> Selecciona un pedido y sube el comprobante de la transferencia SINPE. 
          Asegúrate de que la imagen sea clara y legible.
        </AlertDescription>
      </Alert>

      {/* Lista de pedidos SINPE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            Pedidos con Pago SINPE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay pedidos con pago SINPE para hoy</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <h3 className="font-semibold">{order.id}</h3>
                  </div>
                  <Badge variant="outline" className="border-green-200 text-green-600">
                    SINPE
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{order.customerPhone || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{order.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setSelectedOrder(order);
                    setReceiptData(prev => ({
                      ...prev,
                      amount: order.totalAmount.toString()
                    }));
                    setIsUploadModalOpen(true);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Comprobante
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal para subir comprobante */}
      {isUploadModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Subir Comprobante SINPE</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Información del pedido */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium mb-2">Información del Pedido</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pedido:</span>
                    <span className="font-medium">{selectedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Datos del comprobante */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="reference">Referencia de Transferencia *</Label>
                  <Input
                    id="reference"
                    placeholder="Ej: 1234567890"
                    value={receiptData.reference}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, reference: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="bank">Banco</Label>
                  <select
                    id="bank"
                    value={receiptData.bank}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, bank: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Seleccionar banco</option>
                    <option value="bcr">Banco de Costa Rica</option>
                    <option value="bncr">Banco Nacional</option>
                    <option value="bac">BAC San José</option>
                    <option value="scotiabank">Scotiabank</option>
                    <option value="promerica">Promerica</option>
                    <option value="coopenae">Coopenae</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="accountNumber">Número de Cuenta</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Número de cuenta destino"
                    value={receiptData.accountNumber}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Monto Recibido</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={receiptData.amount}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas (Opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Cualquier información adicional..."
                    value={receiptData.notes}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              {/* Subir imagen */}
              <div className="space-y-3">
                <Label>Comprobante de Transferencia *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {uploadedImage ? (
                    <div className="space-y-3">
                      <img
                        src={uploadedImage}
                        alt="Comprobante"
                        className="max-w-full h-48 object-contain mx-auto rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadedImage(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Camera className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">Toca para seleccionar imagen</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Seleccionar Imagen
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1"
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUploadReceipt}
                  disabled={!uploadedImage || !receiptData.reference || isUploading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Comprobante
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
