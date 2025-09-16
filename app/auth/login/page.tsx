'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Star, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { email: 'admin@magicstars.com', role: 'Administrador', password: 'Admin1234' },
    { email: 'alex@magicstars.com', role: 'Mensajero - Alex', password: 'Alex1234' },
    { email: 'andrey@magicstars.com', role: 'Mensajero - Andrey', password: 'Andrey5678' },
    { email: 'anibal@magicstars.com', role: 'Mensajero - Anibal', password: 'Anibal9012' },
    { email: 'anthony@magicstars.com', role: 'Mensajero - Anthony', password: 'Anthony3456' },
    { email: 'gabriel@magicstars.com', role: 'Mensajero - Gabriel', password: 'Gabriel7890' },
    { email: 'gerson@magicstars.com', role: 'Mensajero - Gerson', password: 'Gerson2468' },
    { email: 'irving@magicstars.com', role: 'Mensajero - Irving', password: 'Irving1357' },
    { email: 'javier@magicstars.com', role: 'Mensajero - Javier', password: 'Javier4680' },
    { email: 'jose@magicstars.com', role: 'Mensajero - Jose', password: 'Jose8024' },
    { email: 'josue@magicstars.com', role: 'Mensajero - Josue', password: 'Josue1593' },
    { email: 'loria@magicstars.com', role: 'Mensajero - Loria', password: 'Loria7531' },
    { email: 'luisq@magicstars.com', role: 'Mensajero - LuisQ', password: 'LuisQ9642' },
    { email: 'manuel@magicstars.com', role: 'Mensajero - Manuel', password: 'Manuel8520' },
    { email: 'michael@magicstars.com', role: 'Mensajero - Michael', password: 'Michael7410' },
    { email: 'pablo@magicstars.com', role: 'Mensajero - Pablo', password: 'Pablo9630' },
    { email: 'pablonocturna@magicstars.com', role: 'Mensajero - PabloNocturna', password: 'PabloNocturna2580' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sistema de Delivery
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión Multi-Empresa de Pedidos
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@magicstars.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Alex1234"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Users */}
        <Card className="shadow-lg border-0 bg-white/60 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Usuarios de Demostración</CardTitle>
            <CardDescription className="text-xs">
              Haz clic para usar las credenciales de mensajeros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoUsers.map((user) => (
              <Button
                key={user.email}
                variant="outline"
                className="w-full justify-start text-xs h-auto py-2"
                onClick={() => {
                  setEmail(user.email);
                  setPassword(user.password);
                }}
                disabled={loading}
              >
                <div className="text-left">
                  <div className="font-medium">{user.role}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}