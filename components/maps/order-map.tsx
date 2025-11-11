'use client';

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OrderMapProps {
  orders: Array<{
    id: string;
    lat: number;
    lon: number;
    status: string;
    distrito: string;
    link_ubicacion: string | null;
  }>;
}

const PIN_COLORS = {
  'pendiente': '#f97316',
  'en_ruta': '#3b82f6',
  'entregado': '#22c55e',
  'devolucion': '#ef4444',
  'reagendado': '#eab308',
};

// Crear icono con color
function createColoredIcon(color: string) {
  // Sanitizar color: solo permitir colores hex válidos
  const sanitizedColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#f97316';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div style="
          background-color: ${sanitizedColor};
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

// Crear icono para cluster de distrito
function createDistrictClusterIcon(count: number) {
  // Sanitizar count: asegurar que sea un número entero positivo
  const sanitizedCount = Math.max(0, Math.floor(Number(count) || 0));

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        width: 45px;
        height: 45px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      ">
        ${sanitizedCount}
      </div>
    `,
    iconSize: [45, 45],
    iconAnchor: [22.5, 22.5],
  });
}

// Distribuir marcadores en círculo
function distributeMarkersInCircle(
  centerLat: number,
  centerLon: number,
  count: number,
  radiusMeters: number = 50
): Array<{ lat: number; lon: number }> {
  if (count === 1) {
    return [{ lat: centerLat, lon: centerLon }];
  }

  const positions: Array<{ lat: number; lon: number }> = [];
  const earthRadius = 6371000;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const latOffset = (radiusMeters / earthRadius) * (180 / Math.PI);
    const lonOffset = (radiusMeters / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
    const newLat = centerLat + latOffset * Math.cos(angle);
    const newLon = centerLon + lonOffset * Math.sin(angle);
    positions.push({ lat: newLat, lon: newLon });
  }

  return positions;
}

// Componente para trackear el zoom
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

export function OrderMap({ orders }: OrderMapProps) {
  const [currentZoom, setCurrentZoom] = useState(13);

  // Agrupar por distrito
  const groupedByDistrict = useMemo(() => {
    const groups = new Map<string, typeof orders>();
    orders.forEach(order => {
      if (!groups.has(order.distrito)) {
        groups.set(order.distrito, []);
      }
      groups.get(order.distrito)!.push(order);
    });
    return groups;
  }, [orders]);

  // Agrupar por ubicación exacta (para zoom cercano)
  const groupedByLocation = useMemo(() => {
    const groups = new Map<string, typeof orders>();
    orders.forEach(order => {
      const key = `${order.lat.toFixed(6)},${order.lon.toFixed(6)}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(order);
    });
    return Array.from(groups.values());
  }, [orders]);

  // Calcular centro
  const center = useMemo(() => {
    if (orders.length === 0) {
      return [9.9281, -84.0907];
    }
    const avgLat = orders.reduce((sum, o) => sum + o.lat, 0) / orders.length;
    const avgLon = orders.reduce((sum, o) => sum + o.lon, 0) / orders.length;
    return [avgLat, avgLon];
  }, [orders]);

  // Contar por estado
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      const status = order.status || 'pendiente';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Determinar si mostrar por distrito o por ubicación
  const showDistrictClusters = currentZoom < 15;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center as [number, number]}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        <ZoomTracker onZoomChange={setCurrentZoom} />

        {showDistrictClusters ? (
          // Vista alejada: Mostrar clusters por distrito
          Array.from(groupedByDistrict.entries()).map(([distrito, districtOrders]) => {
            const avgLat = districtOrders.reduce((sum, o) => sum + o.lat, 0) / districtOrders.length;
            const avgLon = districtOrders.reduce((sum, o) => sum + o.lon, 0) / districtOrders.length;

            return (
              <Marker
                key={`district-${distrito}`}
                position={[avgLat, avgLon]}
                icon={createDistrictClusterIcon(districtOrders.length)}
              >
                <Tooltip
                  permanent={true}
                  direction="top"
                  offset={[0, -25]}
                  className="custom-tooltip"
                >
                  <div className="text-xs font-semibold">
                    <div className="font-bold text-blue-700">{distrito}</div>
                    <div className="text-gray-600 text-[11px]">
                      {districtOrders.length} {districtOrders.length === 1 ? 'pedido' : 'pedidos'}
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })
        ) : (
          // Vista cercana: Mostrar pins individuales
          groupedByLocation.map((group, groupIndex) => {
            const centerLat = group[0].lat;
            const centerLon = group[0].lon;
            const distrito = group[0].distrito;
            const totalInLocation = group.length;
            const positions = distributeMarkersInCircle(centerLat, centerLon, group.length);

            return group.map((order, index) => {
              const position = positions[index];
              const color = PIN_COLORS[order.status as keyof typeof PIN_COLORS] || PIN_COLORS.pendiente;

              const handleMarkerClick = () => {
                if (order.link_ubicacion) {
                  window.open(order.link_ubicacion, '_blank', 'noopener,noreferrer');
                }
              };

              return (
                <Marker
                  key={`${order.id}-${groupIndex}-${index}`}
                  position={[position.lat, position.lon]}
                  icon={createColoredIcon(color)}
                  eventHandlers={{
                    click: handleMarkerClick
                  }}
                >
                  <Tooltip
                    permanent={true}
                    direction="top"
                    offset={[0, -25]}
                    className="custom-tooltip"
                  >
                    <div className="text-xs font-semibold">
                      <div className="font-bold text-blue-700">{distrito}</div>
                      <div className="text-gray-800 text-[11px] font-bold mt-0.5">
                        {order.id}
                      </div>
                      {totalInLocation > 1 && (
                        <div className="text-gray-600 text-[10px] mt-0.5">
                          {totalInLocation} pedidos aquí
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </Marker>
              );
            });
          })
        )}
      </MapContainer>

      {/* Leyenda flotante */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-[200px]">
        <h4 className="font-bold text-sm mb-2">Estados</h4>
        {Object.entries(PIN_COLORS).map(([status, color]) => {
          const count = statusCounts[status] || 0;

          return (
            <div key={status} className="flex items-center gap-2 text-xs mb-1">
              <div
                style={{ backgroundColor: color }}
                className="w-3 h-3 rounded-full flex-shrink-0"
              />
              <span className={`capitalize truncate ${count === 0 ? 'text-gray-400' : ''}`}>
                {status.replace('_', ' ')}: {count}
              </span>
            </div>
          );
        })}
        <div className="mt-2 pt-2 border-t text-xs font-bold">
          Total: {orders.length}
        </div>
        <div className="mt-2 pt-2 border-t text-[10px] text-gray-500">
          {showDistrictClusters ? '🔍 Zoom: Vista por distrito' : '📍 Zoom: Vista detallada'}
        </div>
      </div>
    </div>
  );
}
