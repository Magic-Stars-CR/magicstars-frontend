'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PedidoTest } from '@/lib/types';
import { getPedidos, updatePedido } from '@/lib/supabase-pedidos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  RotateCcw,
  Truck,
  Clock,
  DollarSign,
  MapPin,
  User,
  Edit3,
  Save,
  Phone,
  MessageCircle,
  Building2,
  CreditCard,
  FileText
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function AdminPedidoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [pedido, setPedido] = useState<PedidoTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para edición
  const [editForm, setEditForm] = useState({
    estado: '',
    mensajero: '',
    fecha: '',
    notas: '',
    metodo_pago: '',
    nota_asesor: ''
  });

  useEffect(() => {
    if (user && params.id) {
      loadPedido();
    }
  }, [user, params.id]);

  const loadPedido = async () => {
    try {
      setLoading(true);
      const pedidosData = await getPedidos(1000); // Cargar más pedidos para encontrar el específico
      const foundPedido = pedidosData.find(p => p.id_pedido === params.id);
      
      if (foundPedido) {
        setPedido(foundPedido);
        setEditForm({
          estado: foundPedido.estado_pedido || '',
          mensajero: foundPedido.mensajero_asignado || '',
          fecha: foundPedido.fecha_entrega || '',
          notas: foundPedido.notas || '',
          metodo_pago: foundPedido.metodo_pago || '',
          nota_asesor: foundPedido.nota_asesor || ''
        });
      }
    } catch (error) {
      console.error('Error loading pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!pedido) return;

    try {
      setUpdating(true);
      
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

      const success = await updatePedido(pedido.id_pedido, updates);
      if (success) {
        setPedido(prev => prev ? { ...prev, ...updates } : null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating pedido:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusForBadge = (pedido: PedidoTest): string => {
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
      month: 'long',
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

  if (!pedido) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Pedido no encontrado</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detalle del Pedido</h1>
          <p className="text-muted-foreground">
            ID: {pedido.id_pedido} - {pedido.cliente_nombre || 'Sin nombre'}
          </p>
        </div>
        <div className="ml-auto">
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Información del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID del Pedido</Label>
                  <p className="font-semibold">{pedido.id_pedido}</p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">
                    <OrderStatusBadge status={getStatusForBadge(pedido)} />
                  </div>
                </div>
                <div>
                  <Label>Valor Total</Label>
                  <p className="font-semibold text-lg">{formatCurrency(pedido.valor_total)}</p>
                </div>
                <div>
                  <Label>Método de Pago</Label>
                  <p className="font-semibold">{pedido.metodo_pago || 'Efectivo'}</p>
                </div>
              </div>

              <div>
                <Label>Productos</Label>
                <p className="text-sm text-muted-foreground mt-1">{pedido.productos || 'Sin productos especificados'}</p>
              </div>

              {pedido.link_ubicacion && (
                <div>
                  <Label>Ubicación</Label>
                  <a 
                    href={pedido.link_ubicacion} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2 mt-1"
                  >
                    <MapPin className="w-4 h-4" />
                    Ver ubicación en mapa
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <p className="font-semibold">{pedido.cliente_nombre || 'Sin nombre'}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {pedido.cliente_telefono || 'Sin teléfono'}
                  </p>
                </div>
                <div>
                  <Label>Provincia</Label>
                  <p className="font-semibold">{pedido.provincia || 'Sin provincia'}</p>
                </div>
                <div>
                  <Label>Cantón</Label>
                  <p className="font-semibold">{pedido.canton || 'Sin cantón'}</p>
                </div>
                <div className="col-span-2">
                  <Label>Distrito</Label>
                  <p className="font-semibold">{pedido.distrito || 'Sin distrito'}</p>
                </div>
                <div className="col-span-2">
                  <Label>Dirección</Label>
                  <p className="font-semibold">{pedido.direccion || 'Sin dirección'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Notas y Comentarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="notas">Notas Generales</Label>
                    <Textarea
                      id="notas"
                      value={editForm.notas}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notas: e.target.value }))}
                      placeholder="Notas adicionales..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nota_asesor">Nota del Asesor</Label>
                    <Textarea
                      id="nota_asesor"
                      value={editForm.nota_asesor}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nota_asesor: e.target.value }))}
                      placeholder="Nota del asesor..."
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  {pedido.notas && (
                    <div>
                      <Label>Notas Generales</Label>
                      <p className="text-sm text-muted-foreground mt-1">{pedido.notas}</p>
                    </div>
                  )}
                  {pedido.nota_asesor && (
                    <div>
                      <Label>Nota del Asesor</Label>
                      <p className="text-sm text-muted-foreground mt-1">{pedido.nota_asesor}</p>
                    </div>
                  )}
                  {!pedido.notas && !pedido.nota_asesor && (
                    <p className="text-muted-foreground">No hay notas disponibles</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Asignación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div>
                  <Label htmlFor="mensajero">Mensajero Asignado</Label>
                  <Select value={editForm.mensajero} onValueChange={(value) => setEditForm(prev => ({ ...prev, mensajero: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar mensajero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {/* Aquí podrías cargar la lista de mensajeros disponibles */}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Mensajero Asignado</Label>
                  <p className="font-semibold mt-1">{pedido.mensajero_asignado || 'Sin asignar'}</p>
                </div>
              )}

              <div>
                <Label>Mensajero Concretado</Label>
                <p className="font-semibold mt-1">{pedido.mensajero_concretado || 'No concretado'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Fecha de Creación</Label>
                <p className="font-semibold mt-1">{formatDate(pedido.fecha_creacion)}</p>
              </div>

              {isEditing ? (
                <div>
                  <Label htmlFor="fecha">Fecha de Entrega</Label>
                  <Input
                    id="fecha"
                    type="datetime-local"
                    value={editForm.fecha}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fecha: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              ) : (
                <div>
                  <Label>Fecha de Entrega</Label>
                  <p className="font-semibold mt-1">
                    {pedido.fecha_entrega ? formatDate(pedido.fecha_entrega) : 'Sin fecha programada'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tienda</Label>
                <p className="font-semibold mt-1">{pedido.tienda || 'Sin tienda especificada'}</p>
              </div>

              <div>
                <Label>Jornada de Ruta</Label>
                <p className="font-semibold mt-1">{pedido.jornada_ruta || 'Sin jornada especificada'}</p>
              </div>

              {pedido.comprobante_sinpe && (
                <div>
                  <Label>Comprobante SINPE</Label>
                  <p className="font-semibold mt-1">{pedido.comprobante_sinpe}</p>
                </div>
              )}

              {pedido.numero_sinpe && (
                <div>
                  <Label>Número SINPE</Label>
                  <p className="font-semibold mt-1">{pedido.numero_sinpe}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isEditing && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? (
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
