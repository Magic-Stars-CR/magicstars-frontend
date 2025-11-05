'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/lib/types';
import { mockLogin, mockLogout, mockGetUserByToken } from '@/lib/mock-messengers';
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
      const storedToken = localStorage.getItem('magicstars_token');
      const storedUser = localStorage.getItem('magicstars_user');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        const isValidToken = await mockGetUserByToken(storedToken);
        
        if (isValidToken) {
          setUser(userData);
        } else {
          // Token inválido, limpiar storage
          localStorage.removeItem('magicstars_token');
          localStorage.removeItem('magicstars_user');
        }
      }
      
      setLoading(false);
    };

    checkStoredSession();
  }, [isHydrated]);

  const login = async (emailOrName: string, password: string) => {
    try {
      setLoading(true);
      const user = await mockLogin(emailOrName, password);
      
      if (user) {
        // Solo guardar en localStorage si estamos en el cliente
        if (typeof window !== 'undefined') {
          localStorage.setItem('magicstars_user', JSON.stringify(user));
          localStorage.setItem('magicstars_token', 'mock_token_' + user.id);
        }
        
        setUser(user);
        
        // Esperar un poco para que el estado se actualice
        setTimeout(() => {
          setLoading(false);
        }, 50);
        
        return user;
      } else {
        setLoading(false);
        throw new Error('Credenciales inválidas');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await mockLogout();
    
    // Solo limpiar localStorage si estamos en el cliente
    if (typeof window !== 'undefined') {
      localStorage.removeItem('magicstars_user');
      localStorage.removeItem('magicstars_token');
    }
    
    setUser(null);
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