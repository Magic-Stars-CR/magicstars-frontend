'use client';

import { useState, useEffect } from 'react';
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
  Building2,
  Warehouse,
  Network,
  DollarSign,
  Route,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    { icon: Package, label: 'Pedidos', href: '/dashboard/admin/orders' },
    { icon: Warehouse, label: 'Inventario', href: '/dashboard/admin/inventory' },
    { icon: Network, label: 'Logística Externa', href: '/dashboard/admin/red-logistic' },
    { icon: Truck, label: 'Rutas', href: '/dashboard/admin/routes' },
    { icon: Route, label: 'Gestión de Rutas', href: '/dashboard/admin/route-management' },
    { icon: DollarSign, label: 'Liquidación', href: '/dashboard/admin/liquidation' },
    { icon: Users, label: 'Usuarios', href: '/dashboard/admin/users' },
    { icon: Building2, label: 'Empresas', href: '/dashboard/admin/companies' },
    { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/admin/stats' },
  ],
  asesor: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/asesor' },
    { icon: Package, label: 'Pedidos', href: '/dashboard/asesor/orders' },
    { icon: Warehouse, label: 'Inventario', href: '/dashboard/asesor/inventory' },
                    { icon: Network, label: 'Logística Externa', href: '/dashboard/asesor/red-logistic' },
    { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/asesor/stats' },
  ],
  mensajero: [
    { icon: Route, label: 'Mi Ruta de Hoy', href: '/dashboard/mensajero/mi-ruta-hoy' },
    { icon: LayoutDashboard, label: 'Mis Pedidos', href: '/dashboard/mensajero' },
    { icon: Truck, label: 'Historial de Rutas', href: '/dashboard/mensajero/route-history' },
    { icon: User, label: 'Mi Perfil', href: '/dashboard/mensajero/profile' },
  ],
};

export function Sidebar({ onMobileMenuChange }: { onMobileMenuChange?: (isOpen: boolean) => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Notificar al layout cuando cambie el estado del menú móvil
  useEffect(() => {
    onMobileMenuChange?.(isOpen);
  }, [isOpen, onMobileMenuChange]);

  // Cerrar menú con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el menú está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
            {user.role === 'asesor' && user.company ? (
              <h1 className="font-bold text-lg">{user.company.name}</h1>
            ) : (
              <h1 className="font-bold text-lg">Magic Stars</h1>
            )}
            {user.role === 'asesor' && user.company ? (
              <p className="text-xs text-muted-foreground">
                Asesor - {user.company.name}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Navegación principal">
        {userMenuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[48px]",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-accent hover:text-accent-foreground active:bg-accent/80"
              )}
              role="menuitem"
              tabIndex={0}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${item.label}${isActive ? ' (página actual)' : ''}`}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              <span className="font-medium text-base">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground min-h-[48px] px-4 py-3"
          onClick={logout}
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button - mejorado para accesibilidad */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-6 left-6 z-[60] bg-white border shadow-lg hover:bg-gray-50 transition-colors w-14 h-14 rounded-full"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú de navegación"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu className="w-7 h-7" />
      </Button>

      {/* Desktop sidebar - siempre visible y empuja el contenido */}
      <aside className="hidden lg:block w-64 border-r bg-card flex-shrink-0 z-10">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar - overlay que no empuja el contenido */}
      {isOpen && (
        <>
          {/* Backdrop con z-index alto */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-[70]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Sidebar móvil con z-index más alto */}
          <aside 
            id="mobile-sidebar"
            className="lg:hidden fixed left-0 top-0 h-full w-72 bg-card border-r z-[80] shadow-2xl transform transition-transform duration-300 ease-in-out"
            role="navigation"
            aria-label="Menú de navegación principal"
          >
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-700 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold text-lg">Menú</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 text-white w-10 h-10 rounded-full"
                aria-label="Cerrar menú de navegación"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="h-full overflow-y-auto">
              <SidebarContent />
            </div>
          </aside>
        </>
      )}
    </>
  );
}