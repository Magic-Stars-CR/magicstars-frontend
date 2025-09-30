'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  FilterX, 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  RotateCcw, 
  RefreshCw,
  CreditCard,
  DollarSign,
  FileText,
  Building2,
  User,
  MapPin
} from 'lucide-react';

interface PedidosFiltersProps {
  filters: {
    searchTerm: string;
    statusFilter: string;
    distritoFilter: string;
    mensajeroFilter: string;
    tiendaFilter: string;
    metodoPagoFilter: string;
  };
  filterOptions: {
    distritos: string[];
    mensajeros: string[];
    tiendas: string[];
    metodosPago: string[];
  };
  stats: {
    total: number;
    asignados: number;
    entregados: number;
    sinAsignar: number;
    devoluciones: number;
    reagendados: number;
    efectivo: number;
    sinpe: number;
    tarjeta: number;
    dosPagos: number;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function PedidosFilters({
  filters,
  filterOptions,
  stats,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: PedidosFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Todos', icon: Package, count: stats.total, color: 'blue' },
    { value: 'sin_asignar', label: 'Sin Asignar', icon: Clock, count: stats.sinAsignar, color: 'yellow' },
    { value: 'asignado', label: 'Asignados', icon: Truck, count: stats.asignados, color: 'blue' },
    { value: 'entregado', label: 'Entregados', icon: CheckCircle, count: stats.entregados, color: 'green' },
    { value: 'devolucion', label: 'Devoluciones', icon: RotateCcw, count: stats.devoluciones, color: 'red' },
    { value: 'reagendado', label: 'Reagendados', icon: RefreshCw, count: stats.reagendados, color: 'orange' },
  ];

  const paymentOptions = [
    { value: 'all', label: 'Todos los métodos', icon: CreditCard, count: stats.total, color: 'gray' },
    { value: 'efectivo', label: 'Efectivo', icon: DollarSign, count: stats.efectivo, color: 'green' },
    { value: 'sinpe', label: 'SINPE', icon: CreditCard, count: stats.sinpe, color: 'blue' },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard, count: stats.tarjeta, color: 'purple' },
    { value: '2pagos', label: '2 Pagos', icon: FileText, count: stats.dosPagos, color: 'orange' },
  ];

  const getButtonClasses = (isActive: boolean, color: string) => {
    const baseClasses = "transition-all duration-200 hover:scale-105";
    
    if (isActive) {
      return `${baseClasses} bg-${color}-600 hover:bg-${color}-700 text-white shadow-lg`;
    }
    
    return `${baseClasses} bg-${color}-50 border-${color}-200 text-${color}-700 hover:bg-${color}-100 border-2`;
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== 'all' && value !== ''
  ).length;

  return (
    <Card className="border-2 border-gray-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Filtros de Pedidos
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                {activeFiltersCount} activos
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilters}
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 transition-colors"
            >
              <FilterX className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, cliente, teléfono, distrito, productos..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
          />
        </div>

        {/* Filtros por Estado */}
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-3 block">
            Estado del Pedido
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {statusOptions.map((option) => {
              const IconComponent = option.icon;
              const isActive = filters.statusFilter === option.value;
              
              return (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => onFilterChange({ statusFilter: option.value })}
                  className={getButtonClasses(isActive, option.color)}
                >
                  <IconComponent className="w-4 h-4 mr-1" />
                  <span className="truncate">{option.label}</span>
                  <span className="ml-1 text-xs opacity-75">({option.count})</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Filtros por Método de Pago */}
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-3 block">
            Método de Pago
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {paymentOptions.map((option) => {
              const IconComponent = option.icon;
              const isActive = filters.metodoPagoFilter === option.value;
              
              return (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => onFilterChange({ metodoPagoFilter: option.value })}
                  className={getButtonClasses(isActive, option.color)}
                >
                  <IconComponent className="w-4 h-4 mr-1" />
                  <span className="truncate">{option.label}</span>
                  <span className="ml-1 text-xs opacity-75">({option.count})</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Filtros Avanzados */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-semibold text-gray-700">
              Filtros Avanzados
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avanzados
            </Button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              {/* Distrito */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Distrito
                </Label>
                <Select 
                  value={filters.distritoFilter} 
                  onValueChange={(value) => onFilterChange({ distritoFilter: value })}
                >
                  <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Seleccionar distrito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los distritos</SelectItem>
                    {filterOptions.distritos.map(distrito => (
                      <SelectItem key={distrito} value={distrito}>{distrito}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mensajero */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Mensajero
                </Label>
                <Select 
                  value={filters.mensajeroFilter} 
                  onValueChange={(value) => onFilterChange({ mensajeroFilter: value })}
                >
                  <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Seleccionar mensajero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los mensajeros</SelectItem>
                    {filterOptions.mensajeros.map(mensajero => (
                      <SelectItem key={mensajero} value={mensajero}>{mensajero}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tienda */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Tienda
                </Label>
                <Select 
                  value={filters.tiendaFilter} 
                  onValueChange={(value) => onFilterChange({ tiendaFilter: value })}
                >
                  <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Seleccionar tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tiendas</SelectItem>
                    {filterOptions.tiendas.map(tienda => (
                      <SelectItem key={tienda} value={tienda}>{tienda}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de Filtros Activos */}
        {hasActiveFilters && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros activos: {activeFiltersCount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
