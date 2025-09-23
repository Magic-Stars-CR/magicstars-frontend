'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/lib/types';
import { mockLogin, mockLogout, mockGetUserByToken } from '@/lib/mock-messengers';
import { useHydration } from '@/hooks/use-hydration';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isHydrated = useHydration();

  // Debug: Monitorear cambios en el estado del usuario
  useEffect(() => {
    console.log('🔄 Estado del usuario cambió:', user ? `${user.name} (${user.role})` : 'null', 'timestamp:', new Date().toISOString());
  }, [user]);

  useEffect(() => {
    console.log('🔄 AuthContext useEffect - isHydrated:', isHydrated, 'timestamp:', new Date().toISOString());
    // Solo ejecutar después de la hidratación
    if (!isHydrated) {
      console.log('⏳ Esperando hidratación...');
      return;
    }
    
    // Verificar si hay una sesión guardada
    const checkStoredSession = async () => {
      console.log('🔍 Verificando sesión guardada...');
      const storedToken = localStorage.getItem('magicstars_token');
      const storedUser = localStorage.getItem('magicstars_user');
      
      console.log('Token guardado:', storedToken ? 'Sí' : 'No');
      console.log('Usuario guardado:', storedUser ? 'Sí' : 'No');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        const isValidToken = await mockGetUserByToken(storedToken);
        
        console.log('Token válido:', isValidToken ? 'Sí' : 'No');
        
        if (isValidToken) {
          console.log('✅ Restaurando usuario:', userData);
          setUser(userData);
        } else {
          console.log('❌ Token inválido, limpiando storage');
          // Token inválido, limpiar storage
          localStorage.removeItem('magicstars_token');
          localStorage.removeItem('magicstars_user');
        }
      }
      
      console.log('🏁 Finalizando verificación de sesión');
      setLoading(false);
    };

    checkStoredSession();
  }, [isHydrated]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login con:', email, 'timestamp:', new Date().toISOString());
      setLoading(true);
      const user = await mockLogin(email, password);
      console.log('✅ Login exitoso, usuario:', user);
      
      if (user) {
        // Solo guardar en localStorage si estamos en el cliente
        if (typeof window !== 'undefined') {
          localStorage.setItem('magicstars_user', JSON.stringify(user));
          localStorage.setItem('magicstars_token', 'mock_token_' + user.id);
        }
        
        setUser(user);
        console.log('👤 Usuario establecido en contexto:', user);
        console.log('🔄 Estado del usuario después de setUser:', user);
        
        // Esperar un poco para que el estado se actualice
        setTimeout(() => {
          setLoading(false);
          console.log('🏁 Loading establecido a false después del login', 'timestamp:', new Date().toISOString());
        }, 50);
        
        return user; // Devolver el usuario para la redirección
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

  console.log('🔍 AuthContext Provider - Valor actual:', {
    user: user ? `${user.name} (${user.role})` : 'null',
    loading,
    isHydrated,
    finalLoading,
    timestamp: new Date().toISOString()
  });

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