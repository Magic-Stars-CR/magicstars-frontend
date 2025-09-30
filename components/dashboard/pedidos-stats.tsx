'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface PedidosStatsProps {
  stats: {
    total: number;
    asignados: number;
    entregados: number;
    sinAsignar: number;
    devoluciones: number;
    reagendados: number;
    valorTotal: number;
    efectivo: number;
    sinpe: number;
    tarjeta: number;
    dosPagos: number;
  };
  hasActiveFilters: boolean;
  totalPedidos: number;
}

export function PedidosStats({ stats, hasActiveFilters, totalPedidos }: PedidosStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const getProgressWidth = (value: number, total: number) => {
    return total > 0 ? Math.min((value / total) * 100, 100) : 0;
  };

  // Datos para gráficos
  const statusChartData = [
    { name: 'Entregados', value: stats.entregados, color: '#10b981' },
    { name: 'Sin Asignar', value: stats.sinAsignar, color: '#f59e0b' },
    { name: 'Asignados', value: stats.asignados, color: '#3b82f6' },
    { name: 'Devoluciones', value: stats.devoluciones, color: '#ef4444' },
    { name: 'Reagendados', value: stats.reagendados, color: '#f97316' }
  ];

  const paymentChartData = [
    { name: 'Efectivo', value: stats.efectivo, color: '#10b981' },
    { name: 'SINPE', value: stats.sinpe, color: '#3b82f6' },
    { name: 'Tarjeta', value: stats.tarjeta, color: '#8b5cf6' },
    { name: '2 Pagos', value: stats.dosPagos, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Estadísticas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
                  <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
                  <p className="text-xs text-green-600">
                    {hasActiveFilters ? 'Filtrados' : `${totalPedidos.toLocaleString()} totales`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+12%</span>
                </div>
                <p className="text-xs text-muted-foreground">vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entregados</p>
                  <p className="text-xl font-bold text-green-600">{stats.entregados.toLocaleString()}</p>
                  <p className="text-xs text-green-600">
                    {getPercentage(stats.entregados, stats.total)}% del total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+5%</span>
                </div>
                <p className="text-xs text-muted-foreground">vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sin Asignar</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.sinAsignar.toLocaleString()}</p>
                  <p className="text-xs text-yellow-600">Requieren atención</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Urgente</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPercentage(stats.sinAsignar, stats.total)}% del total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-purple-600 break-words" title={formatCurrency(stats.valorTotal)}>
                    {formatCurrency(stats.valorTotal)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {hasActiveFilters ? 'Filtrado' : 'Todos los pedidos'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">+8%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">vs mes anterior</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métodos de Pago Stats con Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentChartData.map((method) => (
          <Card key={method.name} className={`border-l-4 border-l-${method.color}-500 shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {method.name === 'Efectivo' && <DollarSign className="w-5 h-5 text-green-600" />}
                  {method.name === 'SINPE' && <CreditCard className="w-5 h-5 text-blue-600" />}
                  {method.name === 'Tarjeta' && <CreditCard className="w-5 h-5 text-purple-600" />}
                  {method.name === '2 Pagos' && <FileText className="w-5 h-5 text-orange-600" />}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{method.name}</p>
                    <p className="text-lg font-bold">{method.value.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium" style={{ color: method.color }}>
                    {getPercentage(method.value, stats.total)}%
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${getProgressWidth(method.value, stats.total)}%`,
                    backgroundColor: method.color
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span className="font-medium">{method.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficas de Comparación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Barras - Pedidos por Estado */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Distribución de Pedidos por Estado</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Pedidos']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de Pie - Métodos de Pago */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Distribución de Métodos de Pago</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
