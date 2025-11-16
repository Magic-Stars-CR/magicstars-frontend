'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Building,
  Shield,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  PlusCircle,
  ClipboardCopy,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  UsuarioRow,
  fetchUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from '@/lib/supabase-usuarios';

type FormMode = 'create' | 'edit';

type UsuarioFormState = {
  email: string;
  nombre: string;
  rol: 'admin' | 'asesor' | 'mensajero' | string;
  password: string;
  telefono: string;
  empresa: string;
  estado: string;
};

const DEFAULT_FORM_STATE: UsuarioFormState = {
  email: '',
  nombre: '',
  rol: 'mensajero',
  password: '',
  telefono: '',
  empresa: '',
  estado: 'Activo',
};

const isUsuarioActivo = (estado?: string | null) =>
  estado?.trim().toLowerCase() === 'activo' || estado?.trim().toLowerCase() === 'active';

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'No disponible';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('es-CR');
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'asesor':
      return 'default';
    case 'mensajero':
      return 'secondary';
    case 'mensajero-extra':
      return 'outline';
    default:
      return 'outline';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'asesor':
      return 'Asesor';
    case 'mensajero':
      return 'Mensajero';
    case 'mensajero-extra':
      return 'Mensajero Extra';
    default:
      return role;
  }
};

export default function UsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UsuarioRow[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UsuarioRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [formState, setFormState] = useState<UsuarioFormState>(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioRow | null>(null);
  const [passwordPreview, setPasswordPreview] = useState<UsuarioRow | null>(null);

  const buildToastSummary = (usuario: UsuarioRow | null) => {
    if (!usuario) return null;

    return (
      <div className="rounded-md border border-muted bg-background/80 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {usuario.nombre ?? 'Sin nombre'}
            </p>
            <p className="text-xs text-muted-foreground">
              {usuario.email ?? 'Sin email'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={getRoleBadgeVariant(usuario.rol)}>
              {getRoleLabel(usuario.rol)}
            </Badge>
            <Badge variant={isUsuarioActivo(usuario.estado) ? 'default' : 'secondary'}>
              {isUsuarioActivo(usuario.estado) ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <span>{usuario.email ?? 'Sin email'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-emerald-600" />
            <span>{usuario.telefono ?? 'Sin teléfono'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-3.5 w-3.5 text-purple-600" />
            <span>{usuario.empresa ?? 'Sin empresa'}</span>
          </div>
        </div>
      </div>
    );
  };

  const handleCopyPassword = async (password: string | undefined) => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: 'Contraseña copiada',
        description: 'La contraseña se copió al portapapeles.',
      });
    } catch (error) {
      console.error('❌ Error al copiar contraseña:', error);
      toast({
        title: 'Error al copiar contraseña',
        description: 'No se pudo copiar la contraseña.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = users.filter((usuario) => {
      const matchesSearch =
        !normalizedSearch ||
        usuario.nombre?.toLowerCase().includes(normalizedSearch) ||
        usuario.email?.toLowerCase().includes(normalizedSearch) ||
        usuario.telefono?.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === 'todos' || usuario.rol === roleFilter;

      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'activos' && isUsuarioActivo(usuario.estado)) ||
        (statusFilter === 'inactivos' && !isUsuarioActivo(usuario.estado));

      return matchesSearch && matchesRole && matchesStatus;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const activos = users.filter((u) => isUsuarioActivo(u.estado)).length;
    const inactivos = total - activos;
    const admins = users.filter((u) => u.rol === 'admin').length;
    const asesores = users.filter((u) => u.rol === 'asesor').length;
    const mensajeros = users.filter((u) => u.rol === 'mensajero').length;
    const mensajerosExtra = users.filter((u) => u.rol === 'mensajero-extra').length;

    return { total, activos, inactivos, admins, asesores, mensajeros, mensajerosExtra };
  }, [users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsuarios();
      setUsers(data);
    } catch (error: any) {
      console.error('❌ Error al cargar usuarios:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar usuarios',
        description: error?.message ?? 'Ocurrió un error inesperado.',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormMode('create');
    setFormState(DEFAULT_FORM_STATE);
    setSelectedUser(null);
    setFormError('');
    setFormOpen(true);
  };

  const openEditModal = (usuario: UsuarioRow) => {
    setFormMode('edit');
    setSelectedUser(usuario);
    setFormState({
      email: usuario.email ?? '',
      nombre: usuario.nombre ?? '',
      rol: (usuario.rol as UsuarioFormState['rol']) ?? 'mensajero',
      password: '',
      telefono: usuario.telefono ?? '',
      empresa: usuario.empresa ?? '',
      estado: usuario.estado ?? (isUsuarioActivo(usuario.estado) ? 'Activo' : 'Inactivo'),
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setFormOpen(false);
      setFormError('');
      setSelectedUser(null);
      setProcessing(false);
    } else {
      setFormOpen(true);
    }
  };

  const handleFormChange = (field: keyof UsuarioFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setFormError('');

    const payload = {
      email: formState.email.trim(),
      nombre: formState.nombre.trim(),
      rol: formState.rol.trim(),
      password: formState.password.trim(),
      telefono: formState.telefono.trim(),
      empresa: formState.empresa.trim(),
      estado: formState.estado.trim() || 'Activo',
    };

    if (!payload.email || !payload.nombre) {
      setFormError('Email y nombre son obligatorios.');
      setProcessing(false);
      return;
    }

    if (formMode === 'create' && !payload.password) {
      setFormError('La contraseña es obligatoria para crear un usuario.');
      setProcessing(false);
      return;
    }

    try {
      if (formMode === 'create') {
        const nuevoUsuario = await createUsuario({
          email: payload.email,
          nombre: payload.nombre,
          rol: payload.rol,
          password: payload.password,
          telefono: payload.telefono || null,
          empresa: payload.empresa || null,
          estado: payload.estado || 'Activo',
        });
        toast({
          title: 'Usuario creado',
          description: buildToastSummary(nuevoUsuario),
        });
      } else if (selectedUser) {
        const usuarioActualizado = await updateUsuario(selectedUser, {
          email: payload.email,
          nombre: payload.nombre,
          rol: payload.rol,
          password: payload.password || undefined,
          telefono: payload.telefono || null,
          empresa: payload.empresa || null,
          estado: payload.estado || 'Activo',
        });
        toast({
          title: 'Usuario actualizado',
          description: buildToastSummary(usuarioActualizado),
        });
      }

      setFormOpen(false);
      setFormState(DEFAULT_FORM_STATE);
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('❌ Error guardando usuario:', error);
      setFormError(error?.message ?? 'No se pudo guardar el usuario.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setProcessing(true);
      const deletedSnapshot = deleteTarget;
      await deleteUsuario(deleteTarget);
      toast({
        title: 'Usuario eliminado',
        description: buildToastSummary(deletedSnapshot),
        variant: 'destructive',
      });
      setDeleteTarget(null);
      await loadUsers();
    } catch (error: any) {
      console.error('❌ Error eliminando usuario:', error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar usuario',
        description: error?.message ?? 'No se pudo eliminar el usuario.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportToCSV = () => {
    const header = ['Email', 'Nombre', 'Rol', 'Teléfono', 'Empresa', 'Estado', 'Fecha Creación'];
    const rows = filteredUsers.map((usuario) => [
      usuario.email ?? '',
      usuario.nombre ?? '',
      getRoleLabel(usuario.rol),
      usuario.telefono ?? '',
      usuario.empresa ?? '',
      isUsuarioActivo(usuario.estado) ? 'Activo' : 'Inactivo',
      formatDate(usuario.created_at),
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'usuarios-magicstars.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra todos los usuarios del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-2"
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPasswords ? 'Ocultar' : 'Mostrar'} Contraseñas
          </Button>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Nuevo Usuario
          </Button>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
          <Button
            onClick={() => window.open('/usuarios-login.csv', '_blank')}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Eye className="w-4 h-4" />
            Ver CSV de Contraseñas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Inactivos</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Asesores</p>
                <p className="text-2xl font-bold text-orange-600">{stats.asesores}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Mensajeros</p>
                <p className="text-2xl font-bold text-blue-600">{stats.mensajeros}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Mensajeros Extra</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.mensajerosExtra}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="asesor">Asesor</SelectItem>
                  <SelectItem value="mensajero">Mensajero</SelectItem>
                  <SelectItem value="mensajero-extra">Mensajero Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activos">Activos</SelectItem>
                  <SelectItem value="inactivos">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
          <CardDescription>Información completa de todos los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  {showPasswords && <TableHead>Contraseña</TableHead>}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((usuario) => (
                  <TableRow key={usuario.id ?? usuario.email}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{usuario.nombre ?? 'Sin nombre'}</p>
                        <p className="text-sm text-gray-500">{usuario.email ?? 'Sin email'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(usuario.rol)}>
                        {getRoleLabel(usuario.rol)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{usuario.telefono ?? 'Sin teléfono'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{usuario.empresa ?? 'Sin empresa'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isUsuarioActivo(usuario.estado) ? 'default' : 'secondary'}>
                        {isUsuarioActivo(usuario.estado) ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">{formatDate(usuario.created_at)}</span>
                    </TableCell>
                    {showPasswords && (
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {usuario.password ?? 'Sin contraseña'}
                        </code>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPasswordPreview(usuario)}
                          aria-label="Ver contraseña"
                          disabled={!usuario.password}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(usuario)}
                          aria-label="Editar usuario"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-600"
                          onClick={() => setDeleteTarget(usuario)}
                          aria-label="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron usuarios con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

      <Dialog open={formOpen} onOpenChange={handleFormClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{formMode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}</DialogTitle>
          <DialogDescription>
            {formMode === 'create'
              ? 'Completa la información para registrar un nuevo usuario.'
              : 'Actualiza la información del usuario seleccionado.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-2">
          <form id="usuario-form" onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) => handleFormChange('email', event.target.value)}
                required
                disabled={processing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formState.nombre}
                onChange={(event) => handleFormChange('nombre', event.target.value)}
                required
                disabled={processing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select
                value={formState.rol}
                onValueChange={(value) => handleFormChange('rol', value)}
                disabled={processing}
              >
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="asesor">Asesor</SelectItem>
                  <SelectItem value="mensajero">Mensajero</SelectItem>
                  <SelectItem value="mensajero-extra">Mensajero Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña{' '}
                {formMode === 'edit' && (
                  <span className="text-xs text-gray-500">(dejar en blanco para no cambiar)</span>
                )}
              </Label>
              <Input
                id="password"
                type="text"
                value={formState.password}
                onChange={(event) => handleFormChange('password', event.target.value)}
                placeholder={formMode === 'edit' ? '••••••••' : ''}
                required={formMode === 'create'}
                disabled={processing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formState.telefono}
                onChange={(event) => handleFormChange('telefono', event.target.value)}
                placeholder="+506 8888-0000"
                disabled={processing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formState.empresa}
                onChange={(event) => handleFormChange('empresa', event.target.value)}
                placeholder="Nombre de la empresa"
                disabled={processing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formState.estado}
                onValueChange={(value) => handleFormChange('estado', value)}
                disabled={processing}
              >
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </form>
        </ScrollArea>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => handleFormClose(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button type="submit" form="usuario-form" disabled={processing}>
            {processing ? 'Guardando...' : formMode === 'create' ? 'Crear' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Seguro que deseas eliminar al usuario{' '}
            <span className="font-semibold">
              {deleteTarget?.nombre ?? deleteTarget?.email ?? 'seleccionado'}
            </span>
            ? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing} onClick={() => setDeleteTarget(null)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
            disabled={processing}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={!!passwordPreview} onOpenChange={(open) => !open && setPasswordPreview(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Contraseña del usuario</AlertDialogTitle>
          <AlertDialogDescription>
            Revisa la contraseña actual del usuario seleccionado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-md border border-muted bg-muted/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {passwordPreview?.nombre ?? 'Sin nombre'}
              </p>
              <p className="text-xs text-muted-foreground">{passwordPreview?.email}</p>
            </div>
            <Badge variant={getRoleBadgeVariant(passwordPreview?.rol ?? '')}>
              {getRoleLabel(passwordPreview?.rol ?? '')}
            </Badge>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Contraseña</p>
            <code className="mt-1 inline-block rounded bg-background px-2 py-1 text-sm font-semibold">
              {passwordPreview?.password ?? 'Sin contraseña'}
            </code>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPasswordPreview(null)}>
            Cerrar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              handleCopyPassword(passwordPreview?.password);
            }}
            disabled={!passwordPreview?.password}
          >
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copiar contraseña
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

