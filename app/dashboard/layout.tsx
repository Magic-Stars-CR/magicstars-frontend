'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log('🔍 Dashboard Layout - Estado actual:', { 
      user: user ? `${user.name} (${user.role})` : 'null', 
      loading,
      shouldRedirect: !loading && !user,
      timestamp: new Date().toISOString()
    });
    if (!loading && !user) {
      console.log('🔄 No hay usuario, redirigiendo a login');
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    console.log('⏳ Dashboard Layout - Mostrando loading...', { 
      loading, 
      user: user ? 'presente' : 'ausente',
      timestamp: new Date().toISOString()
    });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.log('❌ Dashboard Layout - No hay usuario, no renderizando contenido');
    return null;
  }

  console.log('✅ Dashboard Layout - Renderizando dashboard para usuario:', user.name, 'rol:', user.role, 'timestamp:', new Date().toISOString());

  return (
    <div className="flex h-screen bg-gray-50/30 overflow-hidden">
      <Sidebar onMobileMenuChange={setIsMobileMenuOpen} />
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300 ease-in-out",
        // El contenido principal se ajusta automáticamente
        // En desktop: flex-1 (resto del espacio después del sidebar)
        // En móvil: flex-1 (todo el ancho disponible)
        "min-w-0" // Evita que el contenido se desborde
      )}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}