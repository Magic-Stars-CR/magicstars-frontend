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
  ScanLine,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    { icon: Package, label: 'Pedidos', href: '/dashboard/admin/pedidos' },
    // { icon: Warehouse, label: 'Inventario', href: '/dashboard/admin/inventory' },
    // { icon: Network, label: 'Logística Externa', href: '/dashboard/admin/red-logistic' },
    { icon: Truck, label: 'Rutas', href: '/dashboard/admin/routes' },
    // { icon: Route, label: 'Gestión de Rutas', href: '/dashboard/admin/route-management' },
    { icon: DollarSign, label: 'Liquidación', href: '/dashboard/admin/liquidation' },
    { icon: Users, label: 'Usuarios', href: '/dashboard/admin/usuarios' },
    // { icon: Building2, label: 'Empresas', href: '/dashboard/admin/companies' },
    { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/admin/stats' },
  ],
  asesor: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/asesor' },
    { icon: Package, label: 'Pedidos Sin Confirmar', href: '/dashboard/asesor/pedidos-sin-confirmar' },
    { icon: Warehouse, label: 'Inventario', href: '/dashboard/asesor/inventory' },
                    { icon: Network, label: 'Logística Externa', href: '/dashboard/asesor/red-logistic' },
    { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/asesor/stats' },
  ],
  mensajero: [
    { icon: Route, label: 'Mi Ruta de Hoy', href: '/dashboard/mensajero/mi-ruta-hoy' },
    { icon: MapPin, label: 'Mapa', href: '/dashboard/mensajero/mapa' },
    { icon: LayoutDashboard, label: 'Mis Pedidos', href: '/dashboard/mensajero' },
    { icon: Truck, label: 'Historial de Rutas', href: '/dashboard/mensajero/route-history' },
    { icon: User, label: 'Mi Perfil', href: '/dashboard/mensajero/profile' },
  ] as any[],
  tienda: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/tienda' },
    { icon: Package, label: 'Pedidos', href: '/dashboard/tienda/orders' },
    { icon: DollarSign, label: 'Liquidación', href: '/dashboard/tienda/liquidacion' },
    // { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/tienda/stats' },
    // { icon: User, label: 'Mi Perfil', href: '/dashboard/tienda/profile' },
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

  // Obtener menú base según el rol
  let userMenuItems = menuItems[user.role] || [];
  
  // Si es el líder de mensajeros, agregar la opción de ver todas las rutas
  if (user.role === 'mensajero' && user.isMessengerLeader) {
    userMenuItems = [
      ...userMenuItems.slice(0, 1), // Mantener "Mi Ruta de Hoy"
      { icon: Truck, label: 'Rutas de Mensajeros', href: '/dashboard/mensajero/rutas-mensajeros' },
      ...userMenuItems.slice(1), // Resto del menú
    ];
  }

  // Agregar botón de escaneo para mensajeros
  if (user.role === 'mensajero') {
    const messengerName = user.name || '';
    const escaneoUrl = `https://inventario-magic-stars.vercel.app/?mensajero=${encodeURIComponent(messengerName)}`;
    userMenuItems = [
      ...userMenuItems,
      { icon: ScanLine, label: 'Escaneo', href: escaneoUrl, isExternal: true },
    ];
  }

  const SidebarContent = () => (
    <>
      {/* Header del sidebar */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            {user.role === 'asesor' && user.company ? (
              <h1 className="font-bold text-sm">{user.company.name}</h1>
            ) : (
              <h1 className="font-bold text-sm">Magic Stars</h1>
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

      {/* Navegación principal - scrollable */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto" role="navigation" aria-label="Navegación principal">
        {userMenuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isExternal = (item as any).isExternal || false;
          
          const content = (
            <>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-xs truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
              )}
            </>
          );

          if (isExternal) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 min-h-[36px]",
                  "hover:bg-accent hover:text-accent-foreground active:bg-accent/80"
                )}
                role="menuitem"
                tabIndex={0}
                aria-label={item.label}
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 min-h-[36px]",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-accent hover:text-accent-foreground active:bg-accent/80"
              )}
              role="menuitem"
              tabIndex={0}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${item.label}${isActive ? ' (página actual)' : ''}`}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Sección del usuario y logout - fija en la parte inferior */}
      <div className="p-2 border-t bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        
        {/* Botón de cerrar sesión - siempre visible */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-red-50 hover:text-red-600 min-h-[32px] px-2 py-1.5 transition-all duration-200"
          onClick={logout}
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-3 h-3 flex-shrink-0" />
          <span className="font-medium text-xs truncate">
            Cerrar Sesión
          </span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button - mejorado para accesibilidad y responsive */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 sm:top-6 sm:left-6 z-[60] bg-white border shadow-lg hover:bg-gray-50 transition-colors w-12 h-12 sm:w-14 sm:h-14 rounded-full"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú de navegación"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>

      {/* Desktop sidebar - siempre visible y empuja el contenido */}
      <aside className="hidden lg:flex w-48 border-r bg-card flex-shrink-0 z-10 flex-col h-screen">
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
            className="lg:hidden fixed left-0 top-0 h-full w-72 sm:w-80 bg-card border-r z-[80] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col"
            role="navigation"
            aria-label="Menú de navegación principal"
          >
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-blue-600 to-purple-700 text-white flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold text-base sm:text-lg truncate">Menú</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                aria-label="Cerrar menú de navegación"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <SidebarContent />
            </div>
          </aside>
        </>
      )}
    </>
  );
}