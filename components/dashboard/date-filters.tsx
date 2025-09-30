'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  Activity,
  Filter,
  X
} from 'lucide-react';

interface DateFiltersProps {
  dateFilter: string;
  specificDate: string;
  dateRange: { start: string; end: string };
  showFutureOrders: boolean;
  onDateFilterChange: (filter: string) => void;
  onSpecificDateChange: (date: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onShowFutureOrdersChange: (show: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const dateFilterOptions = [
  { value: 'all', label: 'Todas las fechas', icon: Calendar, color: 'purple' },
  { value: 'today', label: 'Hoy', icon: Activity, color: 'green' },
  { value: 'yesterday', label: 'Ayer', icon: Clock, color: 'orange' },
  { value: 'week', label: 'Última semana', icon: BarChart3, color: 'blue' },
  { value: 'month', label: 'Último mes', icon: TrendingUp, color: 'indigo' },
  { value: 'last_month', label: 'Mes pasado', icon: Calendar, color: 'gray' },
  { value: 'year', label: 'Último año', icon: TrendingUp, color: 'emerald' },
];

export function DateFilters({
  dateFilter,
  specificDate,
  dateRange,
  showFutureOrders,
  onDateFilterChange,
  onSpecificDateChange,
  onDateRangeChange,
  onShowFutureOrdersChange,
  onClearFilters,
  hasActiveFilters,
}: DateFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSpecificDateChange = (date: string) => {
    onSpecificDateChange(date);
    if (date) {
      onDateFilterChange('specific');
    } else {
      onDateFilterChange('all');
    }
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    onDateRangeChange(newRange);
    if (value || newRange.start || newRange.end) {
      onDateFilterChange('range');
    } else {
      onDateFilterChange('all');
    }
  };

  const getButtonClasses = (optionValue: string, color: string) => {
    const isActive = dateFilter === optionValue;
    const baseClasses = "transition-all duration-200 hover:scale-105";
    
    if (isActive) {
      return `${baseClasses} bg-${color}-600 hover:bg-${color}-700 text-white shadow-lg`;
    }
    
    return `${baseClasses} bg-${color}-50 border-${color}-200 text-${color}-700 hover:bg-${color}-100 border-2`;
  };

  return (
    <Card className="border-2 border-gray-100 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filtros de Fecha</h3>
              <p className="text-sm text-gray-600">Selecciona el período de tiempo para filtrar los pedidos</p>
            </div>
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          )}
        </div>

        {/* Filtros Rápidos */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">
              Períodos Predefinidos
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {dateFilterOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onDateFilterChange(option.value);
                      if (option.value !== 'specific' && option.value !== 'range') {
                        onSpecificDateChange('');
                        onDateRangeChange({ start: '', end: '' });
                      }
                    }}
                    className={getButtonClasses(option.value, option.color)}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Filtro de Pedidos Futuros */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Mostrar pedidos futuros
                  </Label>
                  <p className="text-xs text-gray-600">
                    Incluir pedidos con fecha de creación posterior a hoy
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={showFutureOrders ? "default" : "outline"}
                size="sm"
                onClick={() => onShowFutureOrdersChange(!showFutureOrders)}
                className={`transition-all duration-200 ${
                  showFutureOrders 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
                    : "bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                }`}
              >
                {showFutureOrders ? "Ocultar" : "Mostrar"}
              </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                {/* Fecha Específica */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-teal-600" />
                    </div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Fecha específica
                    </Label>
                  </div>
                  <Input
                    type="date"
                    value={specificDate}
                    onChange={(e) => handleSpecificDateChange(e.target.value)}
                    className="w-full h-11 border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg transition-colors"
                    placeholder="Seleccionar fecha"
                  />
                  {specificDate && (
                    <div className="flex items-center gap-2 text-xs text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">
                      <Calendar className="w-3 h-3" />
                      <span>Filtro activo: {new Date(specificDate).toLocaleDateString('es-CR')}</span>
                    </div>
                  )}
                </div>
                
                {/* Rango de Fechas */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-pink-600" />
                    </div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Rango de fechas
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Desde</Label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                        className="w-full h-11 border-2 border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 rounded-lg transition-colors"
                        placeholder="Fecha inicio"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Hasta</Label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                        className="w-full h-11 border-2 border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 rounded-lg transition-colors"
                        placeholder="Fecha fin"
                      />
                    </div>
                  </div>
                  {(dateRange.start || dateRange.end) && (
                    <div className="flex items-center gap-2 text-xs text-pink-600 bg-pink-50 px-3 py-2 rounded-lg">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Filtro activo: {dateRange.start || '...'} hasta {dateRange.end || '...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Indicador de Filtros Activos */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros de fecha activos</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
