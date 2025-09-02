'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { Company } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Eye,
  Users,
  Package,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const companiesRes = await mockApi.getCompanies();
      setCompanies(companiesRes);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      const newCompany = await mockApi.createCompany(formData);
      setCompanies([...companies, newCompany]);
      setShowCreateForm(false);
      setFormData({ name: '', taxId: '', address: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;
    
    try {
      const updatedCompany = await mockApi.updateCompany(editingCompany.id, formData);
      setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));
      setEditingCompany(null);
      setFormData({ name: '', taxId: '', address: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta empresa?')) return;
    
    try {
      await mockApi.deleteCompany(companyId);
      setCompanies(companies.filter(c => c.id !== companyId));
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const startEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      taxId: company.taxId,
      address: company.address,
      phone: company.phone,
      email: company.email
    });
  };

  const cancelEdit = () => {
    setEditingCompany(null);
    setFormData({ name: '', taxId: '', address: '', phone: '', email: '' });
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Empresas</h1>
          <p className="text-muted-foreground">
            Administra todas las empresas del sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar empresas por nombre, RUC o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingCompany) && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nombre de la Empresa</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <label className="text-sm font-medium">RUC</label>
                <Input
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  placeholder="RUC de la empresa"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Teléfono de contacto"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Email de contacto"
                  type="email"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Dirección completa de la empresa"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={editingCompany ? handleUpdateCompany : handleCreateCompany}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingCompany ? 'Actualizar' : 'Crear'} Empresa
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">RUC: {company.taxId}</p>
                  </div>
                </div>
                <Badge variant={company.isActive ? "default" : "secondary"}>
                  {company.isActive ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{company.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{company.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{company.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Creada: {new Date(company.createdAt).toLocaleDateString('es-CR')}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">12</div>
                  <div className="text-xs text-muted-foreground">Usuarios</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">156</div>
                  <div className="text-xs text-muted-foreground">Pedidos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">89%</div>
                  <div className="text-xs text-muted-foreground">Entrega</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/admin/companies/${company.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalles
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => startEdit(company)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeleteCompany(company.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCompanies.length === 0 && (
        <Card className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No hay empresas</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No se encontraron empresas con los criterios de búsqueda.' : 'Comienza creando la primera empresa.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Empresa
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

