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
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50 overflow-hidden">
      <Sidebar onMobileMenuChange={setIsMobileMenuOpen} />
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300 ease-in-out",
        "min-w-0", // Evita que el contenido se desborde
        "scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent", // Scrollbar personalizado
        "flex flex-col" // Flex para optimizar espacio
      )}>
        <div className="p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 max-w-full mx-auto w-full flex-1 pb-2">
          <div className="max-w-[1920px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}