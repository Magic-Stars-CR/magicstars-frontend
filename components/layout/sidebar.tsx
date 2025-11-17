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
    { icon: Warehouse, label: 'Inventario', href: '/dashboard/admin/inventory' },
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
  'mensajero-lider': [
    { icon: Route, label: 'Mi Ruta de Hoy', href: '/dashboard/mensajero/mi-ruta-hoy' },
    { icon: LayoutDashboard, label: 'Mis Pedidos', href: '/dashboard/mensajero' },
    { icon: Truck, label: 'Historial de Rutas', href: '/dashboard/mensajero/route-history' },
    { icon: Route, label: 'Rutas', href: '/dashboard/mensajero-lider' },
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
  
  // Fallback para mensajeros anteriores con flag de líder
  if (user.role === 'mensajero' && user.isMessengerLeader) {
    userMenuItems = menuItems['mensajero-lider'];
  }

  // Agregar botón de escaneo para mensajeros
  if (user.role === 'mensajero' || user.role === 'mensajero-lider') {
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
      <div className="p-4 border-b border-slate-200/80 flex-shrink-0 bg-gradient-to-r from-slate-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {user.role === 'asesor' && user.company ? (
              <h1 className="font-semibold text-sm text-slate-900 truncate">{user.company.name}</h1>
            ) : (
              <h1 className="font-semibold text-sm text-slate-900">Magic Stars</h1>
            )}
            {user.role === 'asesor' && user.company ? (
              <p className="text-xs text-slate-500 truncate">
                Asesor
              </p>
            ) : (
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navegación principal - scrollable */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent" role="navigation" aria-label="Navegación principal">
        {userMenuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isExternal = (item as any).isExternal || false;
          
          const content = (
            <>
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0 transition-colors",
                isActive ? "text-white" : "text-slate-600"
              )} />
              <span className={cn(
                "font-medium text-sm truncate",
                isActive ? "text-white" : "text-slate-700"
              )}>{item.label}</span>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 min-h-[40px]",
                  "hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 text-slate-700"
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 min-h-[40px]",
                isActive 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20" 
                  : "hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 text-slate-700"
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
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/80 border border-slate-200/50 mb-2 shadow-sm">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        
        {/* Botón de cerrar sesión - siempre visible */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50/80 min-h-[38px] px-3 py-2 transition-all duration-200 rounded-xl"
          onClick={logout}
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium text-sm truncate">
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
      <aside className="hidden lg:flex w-56 border-r border-slate-200/80 bg-white/95 backdrop-blur-sm flex-shrink-0 z-10 flex-col h-screen shadow-sm">
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
            className="lg:hidden fixed left-0 top-0 h-full w-72 sm:w-80 bg-white/95 backdrop-blur-lg border-r border-slate-200 z-[80] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col"
            role="navigation"
            aria-label="Menú de navegación principal"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm backdrop-blur-sm">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold text-base sm:text-lg truncate">Menú</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 text-white w-10 h-10 rounded-xl flex-shrink-0"
                aria-label="Cerrar menú de navegación"
              >
                <X className="w-5 h-5" />
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