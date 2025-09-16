'use client';

import { useState, useEffect } from 'react';
import { getPedidos } from '@/lib/supabase-pedidos';
import { PedidoTest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Database } from 'lucide-react';

export default function SupabaseConnectionTest() {
  const [pedidos, setPedidos] = useState<PedidoTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('idle');
      
      console.log('🔍 Probando conexión a Supabase...');
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Key presente:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      const pedidosData = await getPedidos();
      console.log('✅ Conexión exitosa! Pedidos obtenidos:', pedidosData.length);
      
      setPedidos(pedidosData);
      setConnectionStatus('success');
    } catch (err) {
      console.error('❌ Error de conexión:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'success':
        return `Conexión exitosa! Se encontraron ${pedidos.length} pedidos.`;
      case 'error':
        return `Error de conexión: ${error}`;
      default:
        return 'Haz clic en "Probar Conexión" para verificar la configuración.';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Prueba de Conexión a Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {getStatusMessage()}
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-4">
            <Button 
              onClick={testConnection} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              {loading ? 'Probando...' : 'Probar Conexión'}
            </Button>
          </div>

          {/* Información de configuración */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Configuración actual:</h3>
            <div className="text-sm space-y-1">
              <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'No configurada'}</p>
              <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'No configurada'}</p>
            </div>
          </div>

          {/* Mostrar pedidos si la conexión fue exitosa */}
          {connectionStatus === 'success' && pedidos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Pedidos encontrados ({pedidos.length}):</h3>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {pedidos.slice(0, 10).map((pedido) => (
                  <div key={pedido.id_pedido} className="border rounded p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{pedido.id_pedido}</p>
                        <p className="text-gray-600">{pedido.distrito} - ₡{pedido.valor_total.toLocaleString()}</p>
                        <p className="text-gray-500">{pedido.productos}</p>
                      </div>
                      <div className="text-right">
                        {pedido.mensajero_asignado && (
                          <p className="text-blue-600">Asignado: {pedido.mensajero_asignado}</p>
                        )}
                        {pedido.mensajero_concretado && (
                          <p className="text-green-600">Entregado: {pedido.mensajero_concretado}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {pedidos.length > 10 && (
                  <p className="text-center text-gray-500 text-sm">
                    ... y {pedidos.length - 10} pedidos más
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
