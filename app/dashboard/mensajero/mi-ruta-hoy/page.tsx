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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  MapPin,
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
  CheckCircle2
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Expense {
  id: string;
  type: 'fuel' | 'food' | 'maintenance' | 'other';
  amount: number;
  description: string;
  receipt?: string;
  createdAt: string;
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
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newExpense, setNewExpense] = useState({
    type: 'fuel' as const,
    amount: '',
    description: '',
    receipt: null as File | null
  });
  const [uploadedReceiptImage, setUploadedReceiptImage] = useState<string | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  useEffect(() => {
    if (user) {
      loadRouteData();
    }
  }, [user]);

  const loadRouteData = async () => {
    try {
      setLoading(true);
      const today = new Date().toDateString();
      
      // Obtener pedidos del día
      const orders = await mockApi.getOrders({ 
        assignedMessengerId: user?.id,
        date: today
      });

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

      setRouteData({
        orders,
        expenses: mockExpenses,
        totalExpenses,
        totalOrders: orders.length,
        completedOrders,
        totalRevenue
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

    setIsAddingExpense(true);
    try {
      const expense: Expense = {
        id: Date.now().toString(),
        type: newExpense.type,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        receipt: uploadedReceiptImage || '',
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
        receipt: null
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
      await mockApi.updateOrderStatus(orderId, status);
      await loadRouteData();
    } catch (error) {
      console.error('Error updating order:', error);
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Route className="w-6 h-6" />
            <h1 className="text-xl font-bold">Mi Ruta de Hoy</h1>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {new Date().toLocaleDateString('es-CR')}
          </Badge>
        </div>
        <p className="text-sm opacity-90">
          {routeData.totalOrders} pedidos asignados • {routeData.completedOrders} completados
        </p>
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

      {/* Gastos del Día */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-600" />
              Gastos del Día
            </CardTitle>
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
                      onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="fuel">Combustible</option>
                      <option value="food">Alimentación</option>
                      <option value="maintenance">Mantenimiento</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
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
                          receipt: null
                        });
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddExpense}
                      disabled={!newExpense.amount || !newExpense.description || !newExpense.receipt || isAddingExpense}
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
                        <p className="text-xs text-gray-500">{formatDate(expense.createdAt)}</p>
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

      {/* Pedidos del Día */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Pedidos del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {routeData.orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay pedidos asignados para hoy</p>
            </div>
          ) : (
            routeData.orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      order.status === 'entregado' ? 'bg-green-500' :
                      order.status === 'en_ruta' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`} />
                    <h3 className="font-semibold">{order.id}</h3>
                  </div>
                  <Badge variant={
                    order.status === 'entregado' ? 'default' :
                    order.status === 'en_ruta' ? 'secondary' :
                    'outline'
                  }>
                    {order.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{order.customerName}</span>
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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => order.customerPhone && window.open(`tel:${order.customerPhone}`)}
                    className="flex-1"
                    disabled={!order.customerPhone}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Llamar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (order.deliveryAddress) {
                        const encodedAddress = encodeURIComponent(order.deliveryAddress);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
                      }
                    }}
                    className="flex-1"
                    disabled={!order.deliveryAddress}
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Ruta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsReceiptModalOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Comprobante
                  </Button>
                </div>

                {order.status !== 'entregado' && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'entregado')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Entregado
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'devolucion')}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Devolver
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
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
    </div>
  );
}
