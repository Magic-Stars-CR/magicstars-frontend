'use client';

import { useState } from 'react';
import { PedidoTest, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Truck, 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  CreditCard, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  Users, 
  Navigation, 
  Eye, 
  Edit3,
  BarChart3,
  AlertCircle
} from 'lucide-react';

interface PedidosTableProps {
  pedidos: PedidoTest[];
  loading: boolean;
  onEditPedido: (pedido: PedidoTest) => void;
  onViewPedido: (pedido: PedidoTest) => void;
  onUpdateStatus: (pedido: PedidoTest) => void;
  updatingPedido: string | null;
}

export function PedidosTable({
  pedidos,
  loading,
  onEditPedido,
  onViewPedido,
  onUpdateStatus,
  updatingPedido,
}: PedidosTableProps) {
  const [sortField, setSortField] = useState<keyof PedidoTest | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const formatDateSimple = (date: string | null | undefined) => {
    try {
      // Verificar si la fecha es nula o undefined
      if (!date || date === null || date === undefined) {
        return 'Sin fecha';
      }
      
      // Si es una fecha ISO (2025-09-30T00:00:00.000Z), extraer solo la parte de la fecha
      if (typeof date === 'string' && date.includes('T')) {
        const datePart = date.split('T')[0]; // Obtener solo YYYY-MM-DD
        const parts = datePart.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          return `${day}/${month}/${year}`;
        }
      }
      
      // Si es formato YYYY-M-D o YYYY-MM-DD, extraer directamente
      if (typeof date === 'string' && date.includes('-') && !date.includes('T')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          return `${day}/${month}/${year}`;
        }
      }
      
      // Fallback: intentar con Date pero sin zona horaria
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime()) || dateObj.getTime() === 0) {
        return 'Sin fecha';
      }
      
      return dateObj.toLocaleDateString('es-CR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Fecha original:', date);
      return 'Sin fecha';
    }
  };

  const formatDateWithTime = (date: string | null | undefined) => {
    try {
      // Verificar si la fecha es nula o undefined
      if (!date || date === null || date === undefined) {
        return 'Sin fecha';
      }
      
      // Si es una fecha ISO (2025-09-30T00:00:00.000Z), extraer solo la parte de la fecha
      if (typeof date === 'string' && date.includes('T')) {
        const datePart = date.split('T')[0]; // Obtener solo YYYY-MM-DD
        const parts = datePart.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          return `${day}/${month}/${year}`;
        }
      }
      
      // Si es formato YYYY-M-D o YYYY-MM-DD, extraer directamente
      if (typeof date === 'string' && date.includes('-') && !date.includes('T')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          return `${day}/${month}/${year}`;
        }
      }
      
      // Fallback: intentar con Date pero sin zona horaria
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime()) || dateObj.getTime() === 0) {
        return 'Sin fecha';
      }
      
      return dateObj.toLocaleDateString('es-CR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha con hora:', error, 'Fecha original:', date);
      return 'Sin fecha';
    }
  };

  const getStatusForBadge = (pedido: PedidoTest): OrderStatus => {
    if (pedido.mensajero_concretado) {
      return 'entregado';
    } else if (pedido.mensajero_asignado) {
      return 'en_ruta';
    } else {
      return 'pendiente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'entregado': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'en_ruta': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'pendiente': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'devolucion': return <Clock className="w-4 h-4 text-red-600" />;
      case 'reagendado': return <Calendar className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'efectivo': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'sinpe': return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'tarjeta': return <CreditCard className="w-4 h-4 text-purple-600" />;
      case '2pagos': return <FileText className="w-4 h-4 text-orange-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleSort = (field: keyof PedidoTest) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPedidos = [...pedidos].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando pedidos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-10 group-hover:opacity-20 blur transition duration-300"></div>
      <Card className="relative border-0 shadow-lg bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Lista de Pedidos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Información completa de todos los pedidos del sistema
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
              {pedidos.length} pedido{pedidos.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-b border-emerald-200 dark:border-emerald-800">
                  <TableHead 
                    className="font-semibold min-w-[120px] cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
                    onClick={() => handleSort('id_pedido')}
                  >
                    <div className="flex items-center gap-2">
                      ID Pedido
                      {sortField === 'id_pedido' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold min-w-[180px]">Cliente</TableHead>
                  <TableHead 
                    className="font-semibold min-w-[100px] cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
                    onClick={() => handleSort('valor_total')}
                  >
                    <div className="flex items-center gap-2">
                      Valor
                      {sortField === 'valor_total' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Método Pago</TableHead>
                  <TableHead className="font-semibold min-w-[200px]">Dirección Completa</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Tienda</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Mensajero</TableHead>
                  <TableHead 
                    className="font-semibold min-w-[180px] cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
                    onClick={() => handleSort('fecha_creacion')}
                  >
                    <div className="flex items-center gap-2">
                      Fecha Creación / Entrega
                      {sortField === 'fecha_creacion' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Estado</TableHead>
                  <TableHead className="font-semibold min-w-[200px]">Notas</TableHead>
                  <TableHead className="text-right font-semibold min-w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPedidos.map((pedido, index) => (
                  <TableRow 
                    key={pedido.id_pedido} 
                    className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30 transition-all duration-200 border-b border-emerald-100/50 dark:border-emerald-900/30"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold">{pedido.id_pedido}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{pedido.cliente_nombre || 'Sin nombre'}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">📞</span>
                          <span className="text-xs text-muted-foreground">{pedido.cliente_telefono || 'Sin teléfono'}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <p className="font-bold text-sm">{formatCurrency(pedido.valor_total)}</p>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(pedido.metodo_pago || 'efectivo')}
                        <span className="text-xs">
                          {(pedido.metodo_pago || 'Efectivo').charAt(0).toUpperCase() + (pedido.metodo_pago || 'Efectivo').slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium">{pedido.distrito || 'Sin distrito'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{pedido.canton || 'Sin cantón'}</p>
                        <p className="text-xs text-muted-foreground">{pedido.provincia || 'Sin provincia'}</p>
                        {pedido.direccion && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={pedido.direccion}>
                            {pedido.direccion}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-500" />
                        <span className="text-xs">{pedido.tienda || 'Sin tienda'}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {pedido.mensajero_asignado ? (
                            <>
                              <User className="w-3 h-3 text-blue-600" />
                              <span className="text-xs">{pedido.mensajero_asignado}</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin asignar</span>
                          )}
                        </div>
                        {pedido.mensajero_concretado && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">Concretado: {pedido.mensajero_concretado}</span>
                          </div>
                        )}
                        {pedido.jornada_ruta && (
                          <div className="flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-orange-600" />
                            <span className="text-xs text-orange-600">{pedido.jornada_ruta}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-2">
                        {/* Fecha de Creación */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Creación:</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatDateSimple(pedido.fecha_creacion)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Fecha de Entrega */}
                        {pedido.fecha_entrega && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="text-xs text-gray-500 font-medium">Entrega:</div>
                              <div className="text-sm font-semibold text-blue-700">
                                {formatDateSimple(pedido.fecha_entrega)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-2">
                        {/* Estado actual */}
                        <div className="flex items-center gap-2">
                          {getStatusIcon(getStatusForBadge(pedido))}
                          <OrderStatusBadge status={getStatusForBadge(pedido)} />
                        </div>
                        
                        {/* Botón Editar Estado */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateStatus(pedido)}
                            disabled={updatingPedido === pedido.id_pedido}
                            className="h-6 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Editar Estado
                          </Button>
                        </div>
                        
                        {/* Loading indicator */}
                        {updatingPedido === pedido.id_pedido && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            Actualizando...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-2 max-w-[180px]">
                        {pedido.notas && (
                          <div className="bg-blue-50 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <MessageSquare className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-blue-800">Notas:</span>
                            </div>
                            <p className="text-blue-700 truncate" title={pedido.notas}>
                              {pedido.notas}
                            </p>
                          </div>
                        )}
                        {pedido.nota_asesor && (
                          <div className="bg-green-50 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Users className="w-3 h-3 text-green-600" />
                              <span className="font-medium text-green-800">Asesor:</span>
                            </div>
                            <p className="text-green-700 truncate" title={pedido.nota_asesor}>
                              {pedido.nota_asesor}
                            </p>
                          </div>
                        )}
                        {pedido.productos && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Package className="w-3 h-3 text-gray-600" />
                              <span className="font-medium text-gray-800">Productos:</span>
                            </div>
                            <p className="text-gray-700 truncate" title={pedido.productos}>
                              {pedido.productos}
                            </p>
                          </div>
                        )}
                        {pedido.numero_sinpe && (
                          <div className="bg-blue-50 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-blue-800">SINPE:</span>
                            </div>
                            <p className="text-blue-700 font-mono">{pedido.numero_sinpe}</p>
                          </div>
                        )}
                        {pedido.comprobante_sinpe && (
                          <div className="bg-blue-50 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-blue-800">Comprobante:</span>
                            </div>
                            <p className="text-blue-700 truncate" title={pedido.comprobante_sinpe}>
                              {pedido.comprobante_sinpe}
                            </p>
                          </div>
                        )}
                        {pedido.efectivo_2_pagos && (
                          <div className="bg-orange-50 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <DollarSign className="w-3 h-3 text-orange-600" />
                              <span className="font-medium text-orange-800">Efectivo 2P:</span>
                            </div>
                            <p className="text-orange-700">{formatCurrency(parseFloat(pedido.efectivo_2_pagos) || 0)}</p>
                          </div>
                        )}
                        {pedido.sinpe_2_pagos && (
                          <div className="bg-orange-50 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <CreditCard className="w-3 h-3 text-orange-600" />
                              <span className="font-medium text-orange-800">SINPE 2P:</span>
                            </div>
                            <p className="text-orange-700">{formatCurrency(parseFloat(pedido.sinpe_2_pagos) || 0)}</p>
                          </div>
                        )}
                        {pedido.link_ubicacion && (
                          <div className="flex items-center gap-1">
                            <a 
                              href={pedido.link_ubicacion} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              Ver ubicación
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewPedido(pedido)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditPedido(pedido)}
                          disabled={updatingPedido === pedido.id_pedido}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pedidos.length === 0 && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground mb-1">No se encontraron pedidos</p>
                  <p className="text-sm text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
