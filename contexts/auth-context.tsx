'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/lib/types';
import {
  getUsuarioByEmail,
  loginUsuario,
  mapUsuarioRowToUser,
} from '@/lib/supabase-usuarios';
import { useHydration } from '@/hooks/use-hydration';

interface AuthContextType {
  user: User | null;
  login: (emailOrName: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isHydrated = useHydration();

  useEffect(() => {
    // Solo ejecutar después de la hidratación
    if (!isHydrated) {
      return;
    }
    
    // Verificar si hay una sesión guardada
    const checkStoredSession = async () => {
      try {
        const storedToken = localStorage.getItem('magicstars_token');
        const storedUser = localStorage.getItem('magicstars_user');

        if (!storedToken || !storedUser) {
          setLoading(false);
          return;
        }

        let tokenData: { source?: string; email?: string } | null = null;

        try {
          tokenData = JSON.parse(storedToken);
        } catch {
          if (storedToken.startsWith('supabase:')) {
            tokenData = { source: 'supabase', email: storedToken.replace('supabase:', '') };
          }
        }

        if (tokenData?.source !== 'supabase' || !tokenData.email) {
          // Limpiar tokens legacy o inválidos
          localStorage.removeItem('magicstars_token');
          localStorage.removeItem('magicstars_user');
          setLoading(false);
          return;
        }

        const usuario = await getUsuarioByEmail(tokenData.email);

        if (usuario) {
          const authUser = mapUsuarioRowToUser(usuario);
          setUser(authUser);
          localStorage.setItem('magicstars_user', JSON.stringify(authUser));
        } else {
          localStorage.removeItem('magicstars_token');
          localStorage.removeItem('magicstars_user');
        }
      } catch (error) {
        console.error('❌ Error verificando sesión almacenada:', error);
        localStorage.removeItem('magicstars_token');
        localStorage.removeItem('magicstars_user');
      } finally {
        setLoading(false);
      }
    };

    checkStoredSession();
  }, [isHydrated]);

  const login = async (emailOrName: string, password: string) => {
    setLoading(true);

    try {
      const usuario = await loginUsuario(emailOrName, password);
      const authUser = mapUsuarioRowToUser(usuario);

      if (typeof window !== 'undefined') {
        localStorage.setItem('magicstars_user', JSON.stringify(authUser));
        localStorage.setItem(
          'magicstars_token',
          JSON.stringify({ source: 'supabase', email: usuario.email })
        );
      }

      setUser(authUser);
      return authUser;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Solo limpiar localStorage si estamos en el cliente
    if (typeof window !== 'undefined') {
      localStorage.removeItem('magicstars_user');
      localStorage.removeItem('magicstars_token');
    }
    
    setUser(null);
    setLoading(false);
  };

  const finalLoading = loading || !isHydrated;
  
  const contextValue = {
    user,
    login,
    logout,
    loading: finalLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};