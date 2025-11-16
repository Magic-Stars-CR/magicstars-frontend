'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mock-api';
import { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Shield,
  Route,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const usersRes = await mockApi.getUsers();
      setUsers(usersRes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      'admin': 'Administrador',
      'asesor': 'Asesor',
      'mensajero': 'Mensajero',
      'mensajero-lider': 'Mensajero Líder',
      'mensajero-extra': 'Mensajero Extra',
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'asesor': 'bg-blue-100 text-blue-800 border-blue-200',
      'mensajero': 'bg-green-100 text-green-800 border-green-200',
      'mensajero-lider': 'bg-purple-100 text-purple-800 border-purple-200',
      'mensajero-extra': 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.isActive === (statusFilter === 'active');

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const messengers = users.filter(u => u.role === 'mensajero');
  const messengerLeaders = users.filter(u => u.role === 'mensajero-lider');
  const advisors = users.filter(u => u.role === 'asesor');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra mensajeros, asesores y usuarios del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/admin/users/new">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensajeros</p>
                <p className="text-2xl font-bold">{messengers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Route className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensajeros Líder</p>
                <p className="text-2xl font-bold">{messengerLeaders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Asesores</p>
                <p className="text-2xl font-bold">{advisors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactivos</p>
                <p className="text-2xl font-bold">{users.filter(u => !u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="mensajero">Mensajeros</SelectItem>
                <SelectItem value="mensajero-lider">Mensajeros Líder</SelectItem>
                <SelectItem value="asesor">Asesores</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.phone || 'No especificado'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">No especificada</span>
                  </div>

                  <div>
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>

                  <div>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
