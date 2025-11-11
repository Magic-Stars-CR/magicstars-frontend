'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getPedidosDelDiaByMensajero } from '@/lib/supabase-pedidos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Importar el mapa dinámicamente para evitar errores de SSR
const OrderMapDynamic = dynamic(
  () => import('@/components/maps/order-map').then(mod => mod.OrderMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }
);

// Función helper para obtener fecha en zona horaria de Costa Rica
const getCostaRicaDate = () => {
  const now = new Date();
  const costaRicaOffset = -6 * 60; // UTC-6
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const costaRicaTime = new Date(utc + (costaRicaOffset * 60000));
  return costaRicaTime;
};

export default function MapaPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(getCostaRicaDate());
  const [orders, setOrders] = useState<Array<{
    id: string;
    lat: number;
    lon: number;
    status: string;
    distrito: string;
    link_ubicacion: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, selectedDate]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      // Formatear fecha como YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log('📅 Cargando pedidos para:', user?.name, 'en fecha:', dateStr);

      const pedidos = await getPedidosDelDiaByMensajero(user?.name || '', dateStr);

      console.log('📦 Pedidos obtenidos:', pedidos.length);

      // Función para normalizar estados
      const normalizeStatus = (status: string | null | undefined): string => {
        if (!status) return 'pendiente';
        const normalized = status.toLowerCase().trim();

        // Mapear variaciones de estados
        const statusMap: Record<string, string> = {
          'reagendo': 'reagendado',
          'en ruta': 'en_ruta',
          'devolucion': 'devolucion',
          'devolución': 'devolucion',
        };

        return statusMap[normalized] || normalized;
      };

      // Convertir a formato para el mapa, solo pedidos con coordenadas válidas
      const converted = pedidos
        .filter(p => {
          const hasCoords = p.lon != null && p.lat != null && !isNaN(p.lon) && !isNaN(p.lat);
          if (!hasCoords) {
            console.warn(`⚠️ Pedido ${p.id_pedido} sin coordenadas válidas`);
          }
          return hasCoords;
        })
        .map(p => ({
          id: p.id_pedido,
          lat: p.lat!,
          lon: p.lon!,
          status: normalizeStatus(p.estado_pedido),
          distrito: p.distrito || 'Sin distrito',
          link_ubicacion: p.link_ubicacion || null
        }));

      console.log('📍 Pedidos con coordenadas:', converted.length);

      setOrders(converted);
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = () => {
    const today = getCostaRicaDate();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-[2000]">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/mensajero">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold">Mapa de Pedidos</h1>
          </div>
        </div>

        {/* Selector de fecha */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {isToday() ? 'Hoy' : formatDate(selectedDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[2100]" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setIsDatePickerOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <Card className="p-8">
              <CardContent className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <div className="text-center">
                  <p className="font-medium">Cargando pedidos...</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedDate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : orders.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <Card className="p-8 max-w-md">
              <CardContent className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-lg">No hay pedidos para mostrar</p>
                  <p className="text-sm text-gray-600 mt-2">
                    No se encontraron pedidos con coordenadas para el {formatDate(selectedDate)}
                  </p>
                </div>
                {!isToday() && (
                  <Button
                    onClick={() => setSelectedDate(getCostaRicaDate())}
                    variant="outline"
                    className="mt-2"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver pedidos de hoy
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <OrderMapDynamic orders={orders} />
        )}
      </div>
    </div>
  );
}
