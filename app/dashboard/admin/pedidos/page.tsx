'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PedidoTest } from '@/lib/types';
import { getPedidos, updatePedido } from '@/lib/supabase-pedidos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  MessageSquare,
  AlertTriangle,
  Building2,
  Route,
  CreditCard,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function AdminPedidosPage() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [distritoFilter, setDistritoFilter] = useState('all');
  const [mensajeroFilter, setMensajeroFilter] = useState('all');
  const [selectedPedido, setSelectedPedido] = useState<PedidoTest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingPedido, setUpdatingPedido] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPedidoForAssign, setSelectedPedidoForAssign] = useState<PedidoTest | null>(null);
  const [selectedMessenger, setSelectedMessenger] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadPedidos();
    }
  }, [user]);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      console.log('Cargando pedidos para admin...');
      
      // Limitar a 100 pedidos para mejor rendimiento
      const pedidosData = await getPedidos(100);
      console.log('Pedidos cargados:', pedidosData.length);
      
      setPedidos(pedidosData);
    } catch (error) {
      console.error('Error loading pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePedidoStatus = async (pedidoId: string, updates: Partial<PedidoTest>) => {
    try {
      setUpdatingPedido(pedidoId);
      
      const success = await updatePedido(pedidoId, updates);
      if (success) {
        // Actualizar el estado local sin recargar toda la página
        setPedidos(prevPedidos => 
          prevPedidos.map(pedido => 
            pedido.id_pedido === pedidoId 
              ? { ...pedido, ...updates }
              : pedido
          )
        );
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating pedido:', error);
    } finally {
      setUpdatingPedido(null);
    }
  };

  const assignMessenger = async (pedidoId: string, mensajeroName: string) => {
    try {
      setUpdatingPedido(pedidoId);
      
      const success = await updatePedido(pedidoId, { 
        mensajero_asignado: mensajeroName 
      });
      
      if (success) {
        // Actualizar el estado local
        setPedidos(prevPedidos => 
          prevPedidos.map(pedido => 
            pedido.id_pedido === pedidoId 
              ? { ...pedido, mensajero_asignado: mensajeroName }
              : pedido
          )
        );
        setIsAssignModalOpen(false);
        setSelectedPedidoForAssign(null);
        setSelectedMessenger('');
      }
    } catch (error) {
      console.error('Error assigning messenger:', error);
    } finally {
      setUpdatingPedido(null);
    }
  };

  const markAsDelivered = async (pedidoId: string) => {
    try {
      setUpdatingPedido(pedidoId);
      
      const pedido = pedidos.find(p => p.id_pedido === pedidoId);
      if (!pedido || !pedido.mensajero_asignado) {
        console.error('No se puede marcar como entregado sin mensajero asignado');
        return;
      }
      
      const success = await updatePedido(pedidoId, { 
        mensajero_concretado: pedido.mensajero_asignado 
      });
      
      if (success) {
        // Actualizar el estado local
        setPedidos(prevPedidos => 
          prevPedidos.map(pedido => 
            pedido.id_pedido === pedidoId 
              ? { ...pedido, mensajero_concretado: pedido.mensajero_asignado }
              : pedido
          )
        );
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
    } finally {
      setUpdatingPedido(null);
    }
  };

  // Filtrar pedidos
  const filteredPedidos = pedidos.filter(pedido => {
    // Filtrar pedidos que no tengan id_pedido
    if (!pedido.id_pedido) {
      return false;
    }

    const matchesSearch = 
      (pedido.id_pedido?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.distrito?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.productos?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.mensajero_asignado && pedido.mensajero_asignado.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'asignado' && pedido.mensajero_asignado && !pedido.mensajero_concretado) ||
      (statusFilter === 'entregado' && pedido.mensajero_concretado) ||
      (statusFilter === 'sin_asignar' && !pedido.mensajero_asignado);

    const matchesDistrito = distritoFilter === 'all' || pedido.distrito === distritoFilter;
    const matchesMensajero = mensajeroFilter === 'all' || pedido.mensajero_asignado === mensajeroFilter;

    return matchesSearch && matchesStatus && matchesDistrito && matchesMensajero;
  });

  // Obtener estadísticas
  const stats = {
    total: pedidos.length,
    asignados: pedidos.filter(p => p.mensajero_asignado && !p.mensajero_concretado).length,
    entregados: pedidos.filter(p => p.mensajero_concretado).length,
    sinAsignar: pedidos.filter(p => !p.mensajero_asignado).length,
    valorTotal: pedidos.reduce((sum, p) => sum + p.valor_total, 0)
  };

  // Obtener listas únicas para filtros
  const distritos = Array.from(new Set(pedidos.map(p => p.distrito).filter(Boolean))).sort() as string[];
  const mensajeros = Array.from(new Set(pedidos.map(p => p.mensajero_asignado).filter(Boolean))).sort() as string[];

  const getStatusBadge = (pedido: PedidoTest) => {
    if (pedido.mensajero_concretado) {
      return <Badge className="bg-green-100 text-green-800">Entregado</Badge>;
    } else if (pedido.mensajero_asignado) {
      return <Badge className="bg-blue-100 text-blue-800">Asignado</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Sin Asignar</Badge>;
    }
  };

  // Función para obtener el status como string para el OrderStatusBadge
  const getStatusForBadge = (pedido: PedidoTest): string => {
    if (pedido.mensajero_concretado) {
      return 'entregado';
    } else if (pedido.mensajero_asignado) {
      return 'en_ruta';
    } else {
      return 'pendiente';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
            <p className="text-gray-600">Administra todos los pedidos del sistema</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={loadPedidos} variant="outline">
              <Package className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Truck className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Asignados</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.asignados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Entregados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.entregados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sin Asignar</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.sinAsignar}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">₡{stats.valorTotal.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="ID, distrito, productos, mensajero..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="sin_asignar">Sin Asignar</SelectItem>
                    <SelectItem value="asignado">Asignado</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="distrito">Distrito</Label>
                <Select value={distritoFilter} onValueChange={setDistritoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los distritos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {distritos.map(distrito => (
                      <SelectItem key={distrito} value={distrito}>{distrito}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="mensajero">Mensajero</Label>
                <Select value={mensajeroFilter} onValueChange={setMensajeroFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los mensajeros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {mensajeros.map(mensajero => (
                      <SelectItem key={mensajero} value={mensajero}>{mensajero}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>
              Pedidos ({filteredPedidos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPedidos.map((pedido) => (
                <div key={pedido.id_pedido} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-lg">{pedido.id_pedido || 'Sin ID'}</h3>
                          <p className="text-sm text-gray-600">{pedido.distrito || 'Sin distrito'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(pedido)}
                          <Badge variant="outline">₡{(pedido.valor_total || 0).toLocaleString()}</Badge>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          {pedido.productos || 'Sin productos'}
                        </div>
                        {pedido.mensajero_asignado && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {pedido.mensajero_asignado}
                          </div>
                        )}
                        {pedido.link_ubicacion && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <a 
                              href={pedido.link_ubicacion} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Ver ubicación
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {(pedido.nota_asesor || pedido.notas) && (
                        <div className="mt-2 text-sm text-gray-600">
                          {pedido.nota_asesor && (
                            <p><strong>Nota Asesor:</strong> {pedido.nota_asesor}</p>
                          )}
                          {pedido.notas && (
                            <p><strong>Notas:</strong> {pedido.notas}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPedido(pedido);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalles
                      </Button>
                      
                      {!pedido.mensajero_asignado && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPedidoForAssign(pedido);
                            setIsAssignModalOpen(true);
                          }}
                          disabled={updatingPedido === pedido.id_pedido}
                        >
                          <User className="w-4 h-4 mr-1" />
                          Asignar
                        </Button>
                      )}
                      
                      {pedido.mensajero_asignado && !pedido.mensajero_concretado && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsDelivered(pedido.id_pedido)}
                          disabled={updatingPedido === pedido.id_pedido}
                          className="bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Entregado
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPedidos.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron pedidos con los filtros aplicados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Asignación de Mensajero */}
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Mensajero</DialogTitle>
            </DialogHeader>
            
            {selectedPedidoForAssign && (
              <div className="space-y-4">
                <div>
                  <Label>Pedido</Label>
                  <p className="font-semibold">{selectedPedidoForAssign.id_pedido}</p>
                  <p className="text-sm text-gray-600">{selectedPedidoForAssign.distrito} - ₡{selectedPedidoForAssign.valor_total.toLocaleString()}</p>
                </div>
                
                <div>
                  <Label htmlFor="mensajero">Seleccionar Mensajero</Label>
                  <Select value={selectedMessenger} onValueChange={setSelectedMessenger}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un mensajero" />
                    </SelectTrigger>
                    <SelectContent>
                      {mensajeros.map(mensajero => (
                        <SelectItem key={mensajero} value={mensajero}>{mensajero}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAssignModalOpen(false);
                      setSelectedPedidoForAssign(null);
                      setSelectedMessenger('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedMessenger) {
                        assignMessenger(selectedPedidoForAssign.id_pedido, selectedMessenger);
                      }
                    }}
                    disabled={!selectedMessenger || updatingPedido === selectedPedidoForAssign.id_pedido}
                  >
                    {updatingPedido === selectedPedidoForAssign.id_pedido ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Asignando...
                      </>
                    ) : (
                      'Asignar'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Detalles */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Pedido</DialogTitle>
            </DialogHeader>
            
            {selectedPedido && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID del Pedido</Label>
                    <p className="font-semibold">{selectedPedido.id_pedido}</p>
                  </div>
                  <div>
                    <Label>Distrito</Label>
                    <p className="font-semibold">{selectedPedido.distrito}</p>
                  </div>
                  <div>
                    <Label>Valor Total</Label>
                    <p className="font-semibold">₡{selectedPedido.valor_total.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedPedido)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Productos</Label>
                  <p className="text-sm text-gray-600">{selectedPedido.productos}</p>
                </div>
                
                {selectedPedido.link_ubicacion && (
                  <div>
                    <Label>Ubicación</Label>
                    <a 
                      href={selectedPedido.link_ubicacion} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedPedido.link_ubicacion}
                    </a>
                  </div>
                )}
                
                {selectedPedido.nota_asesor && (
                  <div>
                    <Label>Nota del Asesor</Label>
                    <p className="text-sm text-gray-600">{selectedPedido.nota_asesor}</p>
                  </div>
                )}
                
                {selectedPedido.notas && (
                  <div>
                    <Label>Notas</Label>
                    <p className="text-sm text-gray-600">{selectedPedido.notas}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mensajero Asignado</Label>
                    <p className="font-semibold">{selectedPedido.mensajero_asignado || 'Sin asignar'}</p>
                  </div>
                  <div>
                    <Label>Mensajero Concretado</Label>
                    <p className="font-semibold">{selectedPedido.mensajero_concretado || 'No concretado'}</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
