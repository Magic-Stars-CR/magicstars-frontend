'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { mockApi } from '@/lib/mock-api';
import { Company, CompanyStats, MonthlyStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  ArrowLeft,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  BarChart3,
  Download
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CompanyDetailsPage() {
  const params = useParams();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companyRes, statsRes] = await Promise.all([
        mockApi.getCompany(companyId),
        mockApi.getCompanyStats(companyId)
      ]);
      setCompany(companyRes);
      setStats(statsRes);
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2).replace('.', ',')}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Empresa no encontrada</h2>
        <Button asChild>
          <Link href="/dashboard/admin/companies">Volver a Empresas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin/companies">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">Detalles y métricas de la empresa</p>
        </div>
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="font-mono">{company.taxId}</Badge>
              <span className="text-muted-foreground">RUC</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{company.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{company.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{company.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Creada: {new Date(company.createdAt).toLocaleDateString('es-CR')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Resumen Anual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats ? formatCurrency(stats.totalCash + stats.totalSinpe) : '₡0'}
              </div>
              <div className="text-sm text-muted-foreground">Total Ventas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats ? formatCurrency(stats.totalCash + stats.totalSinpe) : '₡0'}
              </div>
              <div className="text-sm text-muted-foreground">Total Entregado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats ? formatPercentage(stats.deliveryRate) : '0%'}
              </div>
              <div className="text-sm text-muted-foreground">Tasa de Entrega</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-purple-600" />
              Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">8</div>
              <div className="text-sm text-muted-foreground">Asesores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-muted-foreground">Mensajeros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">156</div>
              <div className="text-sm text-muted-foreground">Pedidos Activos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              RESULTADOS {company.name.toUpperCase()}
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-pink-100">
                  <th className="border border-pink-200 px-4 py-2 text-left font-bold text-pink-800">AÑO</th>
                  <th className="border border-pink-200 px-4 py-2 text-left font-bold text-pink-800">MES</th>
                  <th className="border border-pink-200 px-4 py-2 text-left font-bold text-pink-800">VENTAS</th>
                  <th className="border border-pink-200 px-4 py-2 text-left font-bold text-pink-800">ENTREGADO</th>
                  <th className="border border-pink-200 px-4 py-2 text-left font-bold text-pink-800">TASA ENTREGA</th>
                </tr>
              </thead>
              <tbody>
                {stats?.monthlyStats.map((monthStat, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{monthStat.year}</td>
                    <td className="border border-gray-200 px-4 py-2 font-medium">{monthStat.monthName}</td>
                    <td className="border border-gray-200 px-4 py-2 font-bold">
                      {monthStat.sales > 0 ? formatCurrency(monthStat.sales) : '₡0'}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 font-bold">
                      {monthStat.delivered > 0 ? formatCurrency(monthStat.delivered) : '₡0'}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 font-bold">
                      {monthStat.deliveryRate > 0 ? formatPercentage(monthStat.deliveryRate) : '0%'}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-pink-100 font-bold">
                  <td className="border border-pink-200 px-4 py-2"></td>
                  <td className="border border-pink-200 px-4 py-2 text-pink-800">TOTAL</td>
                  <td className="border border-pink-200 px-4 py-2 text-pink-800">
                    {stats ? formatCurrency(stats.totalCash + stats.totalSinpe) : '₡0'}
                  </td>
                  <td className="border border-pink-200 px-4 py-2 text-pink-800">
                    {stats ? formatCurrency(stats.totalCash + stats.totalSinpe) : '₡0'}
                  </td>
                  <td className="border border-pink-200 px-4 py-2 text-pink-800">
                    {stats ? formatPercentage(stats.deliveryRate) : '0%'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Métricas de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total de Pedidos</span>
                <Badge variant="outline">{stats?.totalOrders || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Entregados</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats?.deliveredOrders || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Pendientes</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {stats?.pendingOrders || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Devoluciones</span>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {stats?.returnedOrders || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Métricas Financieras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Efectivo</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats ? formatCurrency(stats.totalCash) : '₡0'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Total SINPE</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {stats ? formatCurrency(stats.totalSinpe) : '₡0'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Total General</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {stats ? formatCurrency(stats.totalCash + stats.totalSinpe) : '₡0'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

