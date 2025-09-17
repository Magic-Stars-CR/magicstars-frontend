'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { mockMessengers, mockLogin } from '@/lib/mock-messengers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Mail, Phone, Building2 } from 'lucide-react';

export default function DebugAuthPage() {
  const { user, logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleQuickLogin = async (email: string) => {
    // Simular login directo usando la función mockLogin
    const user = mockMessengers.find(u => u.email === email);
    if (user) {
      try {
        // Usar la función mockLogin para simular el proceso completo
        const loginResult = await mockLogin(email, 'test123');
        if (loginResult) {
          localStorage.setItem('magicstars_user', JSON.stringify(loginResult));
          console.log('✅ Login exitoso para:', loginResult.name);
          window.location.reload();
        } else {
          console.error('❌ Error en el login para:', email);
        }
      } catch (error) {
        console.error('❌ Error en el login:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    setSelectedUser('');
  };

  const testAllMessengers = async () => {
    console.log('🧪 Iniciando prueba de login para todos los mensajeros...');
    const messengers = mockMessengers.filter(u => u.role === 'mensajero');
    console.log(`📊 Total de mensajeros a probar: ${messengers.length}`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const messenger of messengers) {
      try {
        console.log(`\n--- Probando login para ${messenger.name} (${messenger.email}) ---`);
        const result = await mockLogin(messenger.email, 'test123');
        if (result) {
          console.log(`✅ ${messenger.name}: Login exitoso`);
          successCount++;
        } else {
          console.log(`❌ ${messenger.name}: Login fallido`);
          failCount++;
        }
      } catch (error) {
        console.log(`❌ ${messenger.name}: Error -`, error);
        failCount++;
      }
    }
    console.log(`\n🏁 Prueba completada:`);
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Fallidos: ${failCount}`);
    console.log(`📊 Total: ${messengers.length}`);
  };

  const testSpecificUser = async (email: string) => {
    console.log(`\n🎯 Probando usuario específico: ${email}`);
    try {
      const result = await mockLogin(email, 'test123');
      if (result) {
        console.log(`✅ ${email}: Login exitoso`);
        console.log('Detalles del usuario:', result);
      } else {
        console.log(`❌ ${email}: Login fallido`);
      }
    } catch (error) {
      console.log(`❌ ${email}: Error -`, error);
    }
  };

  const usersByRole = mockMessengers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, typeof mockMessengers>);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Debug de Autenticación - Magic Stars
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Usuario Actual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span>{user.company?.name}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'asesor' ? 'default' : 'secondary'}>
                      {user.role.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No hay usuario autenticado</p>
                <p className="text-sm text-gray-400">Selecciona un usuario para hacer login rápido</p>
              </div>
            )}
          </CardContent>
        </Card>

        {!user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(usersByRole).map(([role, users]) => (
              <Card key={role}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant={role === 'admin' ? 'destructive' : role === 'asesor' ? 'default' : 'secondary'}>
                      {role.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">({users.length} usuarios)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUser === user.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickLogin(user.email);
                          }}
                          className="ml-2"
                        >
                          Login
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Información de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>Total de usuarios disponibles:</strong> {mockMessengers.length}</p>
                <p><strong>Admins:</strong> {usersByRole.admin?.length || 0}</p>
                <p><strong>Asesores:</strong> {usersByRole.asesor?.length || 0}</p>
                <p><strong>Mensajeros:</strong> {usersByRole.mensajero?.length || 0}</p>
                <p><strong>Usuario seleccionado:</strong> {selectedUser || 'Ninguno'}</p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Pruebas de Autenticación</h4>
                <div className="space-y-2">
                  <Button 
                    onClick={testAllMessengers} 
                    variant="outline" 
                    className="w-full"
                  >
                    🧪 Probar Login de Todos los Mensajeros
                  </Button>
                  <Button 
                    onClick={() => testSpecificUser('anibal@magicstars.com')} 
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Probar Anibal Específicamente
                  </Button>
                  <Button 
                    onClick={() => testSpecificUser('anthony@magicstars.com')} 
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Probar Anthony Específicamente
                  </Button>
                  <Button 
                    onClick={() => testSpecificUser('luis@magicstars.com')} 
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Probar Luis Específicamente
                  </Button>
                  <Button 
                    onClick={() => testSpecificUser('luisq@magicstars.com')} 
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Probar LuisQ Específicamente
                  </Button>
                  <Button 
                    onClick={() => testSpecificUser('javier@magicstars.com')} 
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Probar Javier Específicamente
                  </Button>
                  <Button 
                    onClick={() => testSpecificUser('gerson@magicstars.com')} 
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Probar Gerson Específicamente
                  </Button>
                  <Button 
                    onClick={() => testSpecificUser('irving@magicstars.com')} 
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Probar Irving Específicamente
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Abre la consola para ver los resultados de la prueba
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
