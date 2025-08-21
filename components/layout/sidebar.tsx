'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Truck,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    { icon: Package, label: 'Pedidos', href: '/dashboard/admin/orders' },
    { icon: Truck, label: 'Rutas', href: '/dashboard/admin/routes' },
    { icon: Users, label: 'Usuarios', href: '/dashboard/admin/users' },
    { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/admin/stats' },
  ],
  asesor: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/asesor' },
    { icon: Package, label: 'Pedidos', href: '/dashboard/asesor/orders' },
    { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/asesor/stats' },
  ],
  mensajero: [
    { icon: LayoutDashboard, label: 'Mis Pedidos', href: '/dashboard/mensajero' },
    { icon: User, label: 'Mi Perfil', href: '/dashboard/mensajero/profile' },
    { icon: UserCheck, label: 'Actualizar', href: '/dashboard/mensajero/update' },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const userMenuItems = menuItems[user.role] || [];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Magic Stars</h1>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {userMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {isOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-card border-r z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Menú</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}