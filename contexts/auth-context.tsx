'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/lib/types';
import { mockLogin, mockLogout, mockGetUserByToken } from '@/lib/mock-messengers';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const checkStoredSession = async () => {
      console.log('Verificando sesión guardada...');
      const storedToken = localStorage.getItem('magicstars_token');
      const storedUser = localStorage.getItem('magicstars_user');
      
      console.log('Token guardado:', storedToken ? 'Sí' : 'No');
      console.log('Usuario guardado:', storedUser ? 'Sí' : 'No');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        const isValidToken = await mockGetUserByToken(storedToken);
        
        console.log('Token válido:', isValidToken ? 'Sí' : 'No');
        
        if (isValidToken) {
          console.log('Restaurando usuario:', userData);
          setUser(userData);
        } else {
          console.log('Token inválido, limpiando storage');
          // Token inválido, limpiar storage
          localStorage.removeItem('magicstars_token');
          localStorage.removeItem('magicstars_user');
        }
      }
      
      console.log('Finalizando verificación de sesión');
      setLoading(false);
    };

    checkStoredSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Intentando login con:', email);
      const user = await mockLogin(email, password);
      console.log('Login exitoso, usuario:', user);
      
      if (user) {
        // Guardar en localStorage
        localStorage.setItem('magicstars_user', JSON.stringify(user));
        localStorage.setItem('magicstars_token', 'mock_token_' + user.id);
        
        setUser(user);
        console.log('Usuario establecido en contexto');
      } else {
        throw new Error('Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    await mockLogout();
    
    // Limpiar localStorage
    localStorage.removeItem('magicstars_user');
    localStorage.removeItem('magicstars_token');
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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