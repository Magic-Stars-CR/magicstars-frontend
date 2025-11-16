'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPedidosDelDia, supabasePedidos } from '@/lib/supabase-pedidos';
import { Order, Stats, User, PedidoTest } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_URLS, apiRequest } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgressLoader, LoaderStep } from '@/components/ui/progress-loader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Package,
  CheckCircle,
  RotateCcw,
  Truck,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  UserCheck,
  Clock,
  RefreshCw,
  ArrowRight,
  BookCopy,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const CONTROL_TASK_NAME = 'Sincronizar_sheets_y_supabase';
const COSTA_RICA_UTC_OFFSET_MINUTES = 6 * 60;

const getCostaRicaNowInfo = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const getPartValue = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(part => part.type === type)?.value ?? '0');

  const year = getPartValue('year');
  const month = getPartValue('month');
  const day = getPartValue('day');
  const hour = getPartValue('hour');
  const minute = getPartValue('minute');
  const second = getPartValue('second');

  const utcTimestamp =
    Date.UTC(year, month - 1, day, hour, minute, second) +
    COSTA_RICA_UTC_OFFSET_MINUTES * 60 * 1000;

  return { year, month, day, hour, minute, second, utcTimestamp };
};

const parseActivationTimeToUTC = (timeValue: string | null) => {
  if (!timeValue) return null;

  const match = timeValue.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, hourStr, minuteStr, secondStr] = match;
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const second = Number(secondStr);

  if ([hour, minute, second].some(value => Number.isNaN(value))) {
    return null;
  }

  const { year, month, day, utcTimestamp: nowUTC } = getCostaRicaNowInfo();
  let activationUTC =
    Date.UTC(year, month - 1, day, hour, minute, second) +
    COSTA_RICA_UTC_OFFSET_MINUTES * 60 * 1000;

  if (activationUTC > nowUTC) {
    activationUTC -= 24 * 60 * 60 * 1000;
  }

  return activationUTC;
};

const formatLastSyncForDisplay = (timestamp: number | null) => {
  if (!timestamp) return 'Sin datos';

  const formatter = new Intl.DateTimeFormat('es-CR', {
    timeZone: 'America/Costa_Rica',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date(timestamp));
};

const INITIAL_LOADER_STEPS: LoaderStep[] = [
  {
    id: 'fetch-today',
    label: 'Cargando pedidos del día',
    status: 'pending',
    description: 'Consultando pedidos recientes en Supabase...',
  },
  {
    id: 'fetch-all',
    label: 'Analizando historial',
    status: 'pending',
    description: 'Recopilando pedidos históricos para estadísticas...',
  },
  {
    id: 'transform-orders',
    label: 'Preparando órdenes',
    status: 'pending',
    description: 'Formateando pedidos para mostrar en el panel...',
  },
  {
    id: 'compute-stats',
    label: 'Generando métricas',
    status: 'pending',
    description: 'Calculando totales, tasas y montos globales...',
  },
  {
    id: 'finalize',
    label: 'Renderizando dashboard',
    status: 'pending',
    description: 'Aplicando datos a las vistas principales...',
  },
];

const statsPaletteStyles = {
  blue: {
    card: 'border-blue-100 bg-blue-50/70',
    title: 'text-blue-900/70',
    value: 'text-lg font-semibold text-blue-900',
    icon: 'border-blue-100 bg-white/70 text-blue-500',
    accent: 'bg-blue-400/60',
  },
  amber: {
    card: 'border-amber-100 bg-amber-50/70',
    title: 'text-amber-900/70',
    value: 'text-lg font-semibold text-amber-900',
    icon: 'border-amber-100 bg-white/70 text-amber-500',
    accent: 'bg-amber-400/60',
  },
  emerald: {
    card: 'border-emerald-100 bg-emerald-50/70',
    title: 'text-emerald-900/70',
    value: 'text-lg font-semibold text-emerald-900',
    icon: 'border-emerald-100 bg-white/70 text-emerald-500',
    accent: 'bg-emerald-300/60',
  },
  teal: {
    card: 'border-teal-100 bg-teal-50/70',
    title: 'text-teal-900/70',
    value: 'text-lg font-semibold text-teal-900',
    icon: 'border-teal-100 bg-white/70 text-teal-500',
    accent: 'bg-teal-300/60',
  },
  rose: {
    card: 'border-rose-100 bg-rose-50/70',
    title: 'text-rose-900/70',
    value: 'text-lg font-semibold text-rose-900',
    icon: 'border-rose-100 bg-white/70 text-rose-500',
    accent: 'bg-rose-300/60',
  },
  indigo: {
    card: 'border-indigo-100 bg-indigo-50/70',
    title: 'text-indigo-900/70',
    value: 'text-lg font-semibold text-indigo-900',
    icon: 'border-indigo-100 bg-white/70 text-indigo-500',
    accent: 'bg-indigo-300/60',
  },
  violet: {
    card: 'border-violet-100 bg-violet-50/70',
    title: 'text-violet-900/70',
    value: 'text-lg font-semibold text-violet-900',
    icon: 'border-violet-100 bg-white/70 text-violet-500',
    accent: 'bg-violet-300/60',
  },
  slate: {
    card: 'border-slate-200 bg-slate-50/70',
    title: 'text-slate-900/70',
    value: 'text-lg font-semibold text-slate-900',
    icon: 'border-slate-200 bg-white/70 text-slate-500',
    accent: 'bg-slate-300/60',
  },
} as const;

type StatsPaletteKey = keyof typeof statsPaletteStyles;

type DashboardEntityMetrics = {
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  returnedOrders: number;
  rescheduledOrders: number;
  totalAmount: number;
};

type DerivedEntity<T extends User> = {
  user: T;
  metrics: DashboardEntityMetrics;
};

type DerivedUsersAndMetrics = {
  messengers: Array<DerivedEntity<User>>;
  advisors: Array<DerivedEntity<User>>;
};

const IGNORED_NAMES = new Set([
  '',
  'SIN ASIGNAR',
  'SIN MENSAJERO',
  'SIN MENSAJEROS',
  'SIN NOMBRE',
  'SIN TIENDA',
  'SIN DEFINIR',
  'SIN DATOS',
  'NO ASIGNADO',
  'NO ASIGNAR',
  'NO APLICA',
  'NO DISPONIBLE',
  'NINGUNO',
  'NINGUNA',
  'PENDIENTE',
  'PENDIENTES',
  'POR ASIGNAR',
  'S/N',
  'S/N.',
  'N/A',
  'NA',
  '--',
  '-',
  'POR DEFINIR',
]);

const toIsoString = (value: string | null): string => {
  if (!value) return new Date().toISOString();
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();
  const fallback = new Date(`${value}T00:00:00`);
  if (!Number.isNaN(fallback.getTime())) return fallback.toISOString();
  return new Date().toISOString();
};

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatNameForDisplay = (value: string): string =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(segment => {
      if (segment.length <= 2) {
        return segment.toUpperCase();
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(' ');

const parseEntityName = (rawValue: string | null): null | { key: string; display: string; slug: string } => {
  if (!rawValue) return null;
  const trimmed = rawValue.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (IGNORED_NAMES.has(upper)) return null;
  const slugValue = slugify(trimmed);
  return {
    key: upper,
    display: formatNameForDisplay(trimmed),
    slug: slugValue,
  };
};

const normalizeStatus = (status: string | null): string => {
  if (!status) return 'pendiente';
  const normalized = status.toLowerCase().trim();
  if (normalized.includes('entreg')) return 'entregado';
  if (normalized.includes('devol')) return 'devolucion';
  if (normalized.includes('reagen')) return 'reagendado';
  if (normalized.includes('cancel')) return 'cancelado';
  return normalized;
};

const createEmptyMetrics = (): DashboardEntityMetrics => ({
  totalOrders: 0,
  deliveredOrders: 0,
  pendingOrders: 0,
  returnedOrders: 0,
  rescheduledOrders: 0,
  totalAmount: 0,
});

const updateMetricsByStatus = (metrics: DashboardEntityMetrics, status: string) => {
  switch (status) {
    case 'entregado':
      metrics.deliveredOrders += 1;
      break;
    case 'devolucion':
      metrics.returnedOrders += 1;
      break;
    case 'reagendado':
      metrics.rescheduledOrders += 1;
      break;
    default:
      metrics.pendingOrders += 1;
      break;
  }
};

const deriveUsersAndMetricsFromPedidos = (pedidos: PedidoTest[]): DerivedUsersAndMetrics => {
  const messengerMap = new Map<string, DerivedEntity<User>>();
  const advisorMap = new Map<string, DerivedEntity<User>>();

  const ensureMessenger = (rawName: string | null, createdAt: string): DerivedEntity<User> | null => {
    const parsed = parseEntityName(rawName);
    if (!parsed) return null;
    let entry = messengerMap.get(parsed.key);
    if (!entry) {
      const slugSegment = parsed.slug && parsed.slug.length > 0 ? parsed.slug : `mensajero-${messengerMap.size + 1}`;
      const userId = slugSegment.startsWith('mensajero-') ? slugSegment : `mensajero-${slugSegment}`;
      entry = {
        user: {
          id: userId,
          name: parsed.display,
          email: `${userId}@mensajeros.magicstars.com`,
          role: 'mensajero',
          phone: '+506 0000-0000',
          createdAt,
          isActive: true,
        },
        metrics: createEmptyMetrics(),
      };
      messengerMap.set(parsed.key, entry);
    } else if (createdAt < entry.user.createdAt) {
      entry.user.createdAt = createdAt;
    }
    return entry;
  };

  const ensureAdvisor = (rawName: string | null, createdAt: string): DerivedEntity<User> | null => {
    const parsed = parseEntityName(rawName);
    if (!parsed) return null;
    let entry = advisorMap.get(parsed.key);
    if (!entry) {
      const slugSegment = parsed.slug && parsed.slug.length > 0 ? parsed.slug : `asesor-${advisorMap.size + 1}`;
      const userId = slugSegment.startsWith('asesor-') ? slugSegment : `asesor-${slugSegment}`;
      entry = {
        user: {
          id: userId,
          name: parsed.display,
          email: `${userId}@asesores.magicstars.com`,
          role: 'asesor',
          phone: '+506 0000-0000',
          createdAt,
          isActive: true,
        },
        metrics: createEmptyMetrics(),
      };
      advisorMap.set(parsed.key, entry);
    } else if (createdAt < entry.user.createdAt) {
      entry.user.createdAt = createdAt;
    }
    return entry;
  };

  pedidos.forEach(pedido => {
    const createdAt = toIsoString(pedido.fecha_creacion);
    const orderValue =
      typeof pedido.valor_total === 'number'
        ? pedido.valor_total
        : Number.parseFloat(String(pedido.valor_total || 0)) || 0;
    const status = normalizeStatus(pedido.estado_pedido);

    let messengerEntry = ensureMessenger(pedido.mensajero_asignado, createdAt);
    if (!messengerEntry) {
      messengerEntry = ensureMessenger(pedido.mensajero_concretado, createdAt);
    }
    if (messengerEntry) {
      messengerEntry.metrics.totalOrders += 1;
      messengerEntry.metrics.totalAmount += orderValue;
      updateMetricsByStatus(messengerEntry.metrics, status);
    }

    const advisorEntry = ensureAdvisor(pedido.tienda, createdAt);
    if (advisorEntry) {
      advisorEntry.metrics.totalOrders += 1;
      advisorEntry.metrics.totalAmount += orderValue;
      updateMetricsByStatus(advisorEntry.metrics, status);
    }
  });

  const sortByName = (entries: Array<DerivedEntity<User>>) =>
    entries.sort((a, b) => a.user.name.localeCompare(b.user.name, 'es', { sensitivity: 'base' }));

  return {
    messengers: sortByName(Array.from(messengerMap.values())),
    advisors: sortByName(Array.from(advisorMap.values())),
  };
};

export default function AdminDashboard() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 10;
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messengerMetricsMap, setMessengerMetricsMap] = useState<Record<string, DashboardEntityMetrics>>({});
  const [advisorMetricsMap, setAdvisorMetricsMap] = useState<Record<string, DashboardEntityMetrics>>({});
  const [loaderSteps, setLoaderSteps] = useState<LoaderStep[]>(() => INITIAL_LOADER_STEPS.map(step => ({ ...step })));
  const [loaderCurrentStep, setLoaderCurrentStep] = useState<string | undefined>(undefined);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [isLoaderVisible, setIsLoaderVisible] = useState(false);
  const [loaderHasError, setLoaderHasError] = useState(false);
  const [, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [, forceCooldownUpdate] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isShowingTodayOrders, setIsShowingTodayOrders] = useState(true);
  const activeLoaderStepRef = useRef<string | null>(null);

  const resetLoaderSteps = useCallback(() => {
    setLoaderSteps(INITIAL_LOADER_STEPS.map(step => ({ ...step })));
    setLoaderCurrentStep(undefined);
    setLoaderProgress(0);
    setLoaderHasError(false);
    activeLoaderStepRef.current = null;
  }, []);

  const setLoaderStepStatus = useCallback(
    (stepId: string, status: LoaderStep['status'], description?: string) => {
      setLoaderSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? {
                ...step,
                status,
                ...(description !== undefined ? { description } : {}),
              }
            : step,
        ),
      );

      if (status === 'loading') {
        activeLoaderStepRef.current = stepId;
        setLoaderCurrentStep(stepId);
        setIsLoaderVisible(true);
      } else if (status === 'completed') {
        if (activeLoaderStepRef.current === stepId) {
          activeLoaderStepRef.current = null;
        }
        setLoaderCurrentStep(undefined);
      } else if (status === 'error') {
        activeLoaderStepRef.current = stepId;
        setLoaderCurrentStep(stepId);
      }
    },
    [],
  );

  useEffect(() => {
    const completed = loaderSteps.filter(step => step.status === 'completed').length;
    const total = loaderSteps.length || 1;
    setLoaderProgress((completed / total) * 100);
  }, [loaderSteps]);

  const getLatestSyncTimestamp = useCallback(async (): Promise<number | null> => {
    try {
      console.log('[SyncButton] Consultando MSControl...');
      const { data, error } = await supabasePedidos
        .from('MSControl')
        .select('ultima_activacion')
        .eq('nombre', CONTROL_TASK_NAME)
        .limit(1)
        .maybeSingle<{ ultima_activacion: string | null }>();

      if (error) {
        console.error('Error al obtener última sincronización desde MSControl:', error);
        return null;
      }

      if (!data) {
        console.warn('[SyncButton] No se encontró registro en MSControl');
        return null;
      }

      const parsedTime = parseActivationTimeToUTC(data.ultima_activacion as string | null);
      console.log('[SyncButton] Data MSControl:', data, 'Parsed UTC:', parsedTime, 'Display CR:', formatLastSyncForDisplay(parsedTime));
      return parsedTime;
    } catch (error) {
      console.error('Error inesperado al consultar MSControl:', error);
      return null;
    }
  }, []);

  const fetchLastSyncTime = useCallback(async () => {
    const latest = await getLatestSyncTimestamp();
    if (latest === null) {
      setLastSyncTime(null);
    } else {
      setLastSyncTime(latest);
    }
  }, [getLatestSyncTimestamp]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchLastSyncTime();
  }, [fetchLastSyncTime]);

useEffect(() => {
  const interval = setInterval(() => {
    fetchLastSyncTime();
  }, 60 * 1000);

  return () => clearInterval(interval);
}, [fetchLastSyncTime]);

  // Actualizar el contador de tiempo cada segundo
  useEffect(() => {
    if (!lastSyncTime) return;

    const fiveMinutes = 5 * 60 * 1000;
    const { utcTimestamp } = getCostaRicaNowInfo();
    const remaining = fiveMinutes - (utcTimestamp - lastSyncTime);

    if (remaining <= 0) return;

    const interval = setInterval(() => {
      forceCooldownUpdate(tick => tick + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSyncTime, forceCooldownUpdate]);

  const canSync = () => {
    if (!lastSyncTime) return true;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos
    const { utcTimestamp } = getCostaRicaNowInfo();
    const diff = utcTimestamp - lastSyncTime;
    const allowed = diff > fiveMinutes;
    console.log('[SyncButton] canSync?', allowed, 'diff(ms):', diff, 'lastSync:', formatLastSyncForDisplay(lastSyncTime));
    return allowed;
  };

  const getTimeUntilNextSync = () => {
    if (!lastSyncTime) return null;
    const fiveMinutes = 5 * 60 * 1000;
    const { utcTimestamp } = getCostaRicaNowInfo();
    const timeLeft = fiveMinutes - (utcTimestamp - lastSyncTime);
    if (timeLeft <= 0) return null;
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    console.log('[SyncButton] Tiempo restante para habilitar:', formatted, 'ms restantes:', timeLeft);
    return formatted;
  };

  const syncRegistries = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      
      console.log('Iniciando sincronización de pedidos y rutas...');
      
      // Sincronizar pedidos y rutas
      const syncPedidosResponse = await apiRequest(API_URLS.SYNC_PEDIDOS, {
        method: 'POST',
      });

      if (!syncPedidosResponse.ok) {
        throw new Error(`Error en la sincronización de pedidos: ${syncPedidosResponse.status}`);
      }

      const syncPedidosResult = await syncPedidosResponse.json();
      console.log('Sincronización de pedidos exitosa:', syncPedidosResult);
      
      setSyncMessage('Sincronización exitosa. Los datos se han actualizado.');
      const { utcTimestamp } = getCostaRicaNowInfo();
      const now = utcTimestamp;
      const previousSupabaseTimestamp = lastSyncTime;
      console.log('[SyncButton] Registrando sincronización local (preventivo) a las', formatLastSyncForDisplay(now));
      setLastSyncTime(now);

      const waitForSupabaseUpdate = async () => {
        const timeoutMs = 60 * 1000;
        const pollInterval = 2000;
        const start = Date.now();
        let latest: number | null = null;

        while (Date.now() - start < timeoutMs) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          latest = await getLatestSyncTimestamp();
          if (latest && (!previousSupabaseTimestamp || latest > previousSupabaseTimestamp + 1000)) {
            console.log('[SyncButton] Nueva hora detectada en Supabase:', formatLastSyncForDisplay(latest));
            return latest;
          }
        }

        console.warn('[SyncButton] No se detectó actualización en Supabase dentro del tiempo esperado');
        return latest;
      };

      const updatedTimestamp = await waitForSupabaseUpdate();
      if (updatedTimestamp) {
        setLastSyncTime(updatedTimestamp);
      } else {
        // Si no se detecta un cambio, intentar refrescar manualmente
        await fetchLastSyncTime();
      }
      
      // Recargar los datos después de la sincronización
      await loadData();
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setSyncMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error en la sincronización:', error);
      setSyncMessage('Error en la sincronización. Por favor, inténtalo de nuevo.');
      
      // Limpiar el mensaje de error después de 5 segundos
      setTimeout(() => {
        setSyncMessage(null);
      }, 5000);
    } finally {
      setSyncing(false);
    }
  };

  const loadData = async () => {
    let encounteredError = false;
    try {
      setLoading(true);
      resetLoaderSteps();
      setIsLoaderVisible(true);

      console.log('Cargando datos del día de hoy para admin...');
      setLoaderStepStatus('fetch-today', 'loading');
      const { getCostaRicaDateISO } = await import('@/lib/supabase-pedidos');
      const today = getCostaRicaDateISO();
      const pedidosDelDia = await getPedidosDelDia(today);
      console.log('Pedidos del día cargados:', pedidosDelDia.length);
      setLoaderStepStatus('fetch-today', 'completed');

      const fetchAllPedidosWithProgress = async () => {
        let allPedidos: PedidoTest[] = [];
        let from = 0;
        const pageLimit = 1000;
        let hasMore = true;
        let page = 1;

        while (hasMore) {
          setLoaderStepStatus('fetch-all', 'loading', `Obteniendo página ${page}...`);

          const { data, error } = await supabasePedidos
            .from('pedidos')
            .select('*')
            .order('fecha_creacion', { ascending: false })
            .range(from, from + pageLimit - 1);

          if (error) {
            throw error;
          }

          if (data && data.length > 0) {
            allPedidos = [...allPedidos, ...data];
            setLoaderStepStatus(
              'fetch-all',
              'loading',
              `Página ${page} obtenida · Total acumulado: ${allPedidos.length.toLocaleString('es-CR')}`,
            );
            from += pageLimit;
            page += 1;
            hasMore = data.length === pageLimit;
          } else {
            hasMore = false;
          }
        }

        setLoaderStepStatus(
          'fetch-all',
          'completed',
          `Historial cargado (${allPedidos.length.toLocaleString('es-CR')} registros)`,
        );
        return allPedidos;
      };

      const pedidosData = await fetchAllPedidosWithProgress();
      console.log('Total pedidos cargados:', pedidosData.length);

      setLoaderStepStatus('transform-orders', 'loading');
      const pedidosParaMostrar = pedidosDelDia.length > 0 ? pedidosDelDia : pedidosData;
      const hayPedidosHoy = pedidosDelDia.length > 0;
      setIsShowingTodayOrders(hayPedidosHoy);
      console.log(
        'Pedidos para mostrar:',
        pedidosParaMostrar.length,
        hayPedidosHoy ? '(del día de hoy)' : '(más recientes)',
      );

      const orders: Order[] = pedidosParaMostrar.map((pedido: PedidoTest) => {
        const valorTotal =
          typeof pedido.valor_total === 'number'
            ? pedido.valor_total
            : Number.parseFloat(String(pedido.valor_total ?? '0')) || 0;
        return {
        id: pedido.id_pedido,
        customerName: pedido.cliente_nombre || `Cliente ${pedido.id_pedido}`,
        customerPhone: pedido.cliente_telefono || 'No disponible',
        customerAddress: pedido.direccion || pedido.distrito,
        customerProvince: pedido.provincia || 'San José',
        customerCanton: pedido.canton || 'Central',
        customerDistrict: pedido.distrito,
        customerLocationLink: pedido.link_ubicacion || undefined,
        items: [],
        totalAmount: valorTotal,
        status:
          pedido.estado_pedido === 'entregado'
            ? 'entregado'
            : pedido.estado_pedido === 'devolucion'
            ? 'devolucion'
            : pedido.estado_pedido === 'reagendado'
            ? 'reagendado'
            : pedido.mensajero_concretado
            ? 'entregado'
            : pedido.mensajero_asignado
            ? 'en_ruta'
            : 'pendiente',
        paymentMethod: (pedido.metodo_pago?.toLowerCase() as any) || 'efectivo',
        origin: 'csv' as const,
        assignedMessenger: pedido.mensajero_asignado
          ? {
              id: `msg-${pedido.mensajero_asignado}`,
              name: pedido.mensajero_asignado,
              email: `${pedido.mensajero_asignado.toLowerCase()}@magicstars.com`,
              role: 'mensajero' as const,
              phone: '+506 0000-0000',
              company: {
                id: 'company-1',
                name: 'Magic Stars',
                taxId: '123456789',
                address: 'San José, Costa Rica',
                phone: '+506 0000-0000',
                email: 'info@magicstars.com',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : undefined,
        deliveryNotes: pedido.nota_asesor || undefined,
        notes: pedido.notas || undefined,
        createdAt: pedido.fecha_creacion,
        updatedAt: pedido.fecha_creacion,
      };
      });
      setLoaderStepStatus('transform-orders', 'completed');

      setRecentOrders(orders);
      setOrdersPage(1);
      setPaginatedOrders(orders.slice(0, ORDERS_PER_PAGE));

      setLoaderStepStatus('compute-stats', 'loading');
      const totalOrders = pedidosData.length;
      const deliveredOrders = pedidosData.filter(p => p.mensajero_concretado).length;
      const pendingOrders = pedidosData.filter(p => !p.mensajero_asignado).length;
      const returnedOrders = pedidosData.filter(p => p.estado_pedido?.toLowerCase() === 'devolucion').length;
      const rescheduledOrders = pedidosData.filter(p => p.estado_pedido?.toLowerCase() === 'reagendado').length;
      const totalCash = pedidosData.reduce(
        (sum, p) =>
          sum +
          (typeof p.valor_total === 'number'
            ? p.valor_total
            : Number.parseFloat(String(p.valor_total ?? '0')) || 0),
        0,
      );
      const totalSinpe = 0; // No hay campo para Sinpe en la tabla actual
      const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
      const returnRate = totalOrders > 0 ? Math.round((returnedOrders / totalOrders) * 100) : 0;
      const rescheduleRate = totalOrders > 0 ? Math.round((rescheduledOrders / totalOrders) * 100) : 0;

      const realStats: Stats = {
        totalOrders,
        deliveredOrders,
        pendingOrders,
        returnedOrders,
        rescheduledOrders,
        totalCash,
        totalSinpe,
        deliveryRate,
        returnRate,
        rescheduleRate,
      };

      setStats(realStats);
      setLoaderStepStatus('compute-stats', 'completed');

      setLoaderStepStatus('finalize', 'loading');
      const derivedUsers = deriveUsersAndMetricsFromPedidos(pedidosData);
      const combinedUsers = [
        ...derivedUsers.messengers.map(entry => entry.user),
        ...derivedUsers.advisors.map(entry => entry.user),
      ];
      setUsers(combinedUsers);
      setMessengerMetricsMap(
        Object.fromEntries(derivedUsers.messengers.map(entry => [entry.user.id, entry.metrics])),
      );
      setAdvisorMetricsMap(
        Object.fromEntries(derivedUsers.advisors.map(entry => [entry.user.id, entry.metrics])),
      );
      setLoaderStepStatus('finalize', 'completed');
    } catch (error) {
      encounteredError = true;
      console.error('Error loading data:', error);
      setLoaderHasError(true);
      const failingStep = activeLoaderStepRef.current ?? 'fetch-all';
      setLoaderStepStatus(
        failingStep,
        'error',
        'Ocurrió un problema al cargar los datos. Por favor, inténtalo nuevamente.',
      );
    } finally {
      setLoading(false);
      if (!encounteredError) {
        setTimeout(() => {
          setIsLoaderVisible(false);
        }, 300);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const messengers = users.filter(u => u.role === 'mensajero' || u.role === 'mensajero-lider');
  const advisors = users.filter(u => u.role === 'asesor');
  const overviewMetrics = stats
    ? [
        {
          key: 'visibleOrders',
          title: 'Pedidos visibles',
          value: recentOrders.length,
          icon: Package,
          palette: 'blue' as StatsPaletteKey,
        },
        {
          key: 'totalOrders',
          title: 'Total pedidos',
          value: stats.totalOrders,
          icon: BarChart3,
          palette: 'slate' as StatsPaletteKey,
        },
        {
          key: 'pendingOrders',
          title: 'Pendientes',
          value: stats.pendingOrders,
          icon: Clock,
          palette: 'amber' as StatsPaletteKey,
        },
        {
          key: 'deliveredOrders',
          title: 'Entregados',
          value: stats.deliveredOrders,
          icon: CheckCircle,
          palette: 'emerald' as StatsPaletteKey,
        },
        {
          key: 'activeMessengers',
          title: 'Mensajeros activos',
          value: messengers.length,
          icon: Truck,
          palette: 'violet' as StatsPaletteKey,
        },
        {
          key: 'activeAdvisors',
          title: 'Asesores / tiendas',
          value: advisors.length,
          icon: Users,
          palette: 'slate' as StatsPaletteKey,
        },
        {
          key: 'rescheduledOrders',
          title: 'Reagendados',
          value: stats.rescheduledOrders,
          icon: RefreshCw,
          palette: 'indigo' as StatsPaletteKey,
        },
        {
          key: 'returnedOrders',
          title: 'Devueltos',
          value: stats.returnedOrders,
          icon: RotateCcw,
          palette: 'rose' as StatsPaletteKey,
        },
        {
          key: 'deliveryRate',
          title: 'Tasa entrega',
          value: `${stats.deliveryRate}%`,
          icon: TrendingUp,
          palette: 'teal' as StatsPaletteKey,
        },
        {
          key: 'revenue',
          title: 'Ingresos estimados',
          value: formatCurrency(stats.totalCash),
          icon: DollarSign,
          palette: 'emerald' as StatsPaletteKey,
        },
      ]
    : [];
  const metricsByKey = Object.fromEntries(overviewMetrics.map(metric => [metric.key, metric])) as Record<
    string,
    (typeof overviewMetrics)[number]
  >;
const recentOrdersLabel = isShowingTodayOrders ? 'Pedidos de Hoy' : 'Pedidos Recientes';
  const recentOrdersSummary = recentOrders.reduce(
    (acc, order) => {
      acc.total += 1;
      acc.totalAmount += order.totalAmount ?? 0;
      switch (order.status) {
        case 'entregado':
          acc.delivered += 1;
          break;
        case 'en_ruta':
          acc.inRoute += 1;
          break;
        case 'pendiente':
          acc.pending += 1;
          break;
        case 'devolucion':
          acc.returned += 1;
          break;
        case 'reagendado':
          acc.rescheduled += 1;
          break;
        default:
          break;
      }
      return acc;
    },
    { total: 0, delivered: 0, inRoute: 0, pending: 0, returned: 0, rescheduled: 0, totalAmount: 0 },
  );
  const recentOrdersHighlights = [
    {
      key: 'delivered',
      label: 'Entregados',
      value: recentOrdersSummary.delivered.toLocaleString('es-CR'),
      accent: 'text-emerald-700',
      bg: 'bg-emerald-50/80 border-emerald-100',
    },
    {
      key: 'inRoute',
      label: 'En ruta',
      value: recentOrdersSummary.inRoute.toLocaleString('es-CR'),
      accent: 'text-indigo-700',
      bg: 'bg-indigo-50/80 border-indigo-100',
    },
    {
      key: 'pending',
      label: 'Pendientes',
      value: recentOrdersSummary.pending.toLocaleString('es-CR'),
      accent: 'text-amber-700',
      bg: 'bg-amber-50/80 border-amber-100',
    },
    {
      key: 'returned',
      label: 'Devueltos',
      value: recentOrdersSummary.returned.toLocaleString('es-CR'),
      accent: 'text-rose-700',
      bg: 'bg-rose-50/80 border-rose-100',
    },
    {
      key: 'rescheduled',
      label: 'Reagendados',
      value: recentOrdersSummary.rescheduled.toLocaleString('es-CR'),
      accent: 'text-slate-700',
      bg: 'bg-slate-50/80 border-slate-200',
    },
    {
      key: 'totalAmount',
      label: 'Valor total',
      value: formatCurrency(recentOrdersSummary.totalAmount),
      accent: 'text-blue-700',
      bg: 'bg-blue-50/80 border-blue-100',
    },
  ];
  const highlightMetrics = [
    { metric: metricsByKey.totalOrders, span: 'lg:col-span-3' },
    { metric: metricsByKey.pendingOrders, span: 'lg:col-span-3' },
    { metric: metricsByKey.deliveredOrders, span: 'lg:col-span-3' },
    { metric: metricsByKey.revenue, span: 'lg:col-span-3' },
  ].filter(item => item.metric);
  const secondaryMetrics = [
    { metric: metricsByKey.visibleOrders, span: 'lg:col-span-3 xl:col-span-2' },
    { metric: metricsByKey.returnedOrders, span: 'lg:col-span-3 xl:col-span-2' },
    { metric: metricsByKey.rescheduledOrders, span: 'lg:col-span-3 xl:col-span-2' },
  ].filter(item => item.metric);
  const operationalChips = [
    {
      key: 'oper-messengers',
      label: 'Mensajeros',
      value: messengers.length.toLocaleString('es-CR'),
      icon: UserCheck,
      accent: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      key: 'oper-advisors',
      label: 'Asesores',
      value: advisors.length.toLocaleString('es-CR'),
      icon: Users,
      accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      key: 'oper-orders-today',
      label: 'Pedidos hoy',
      value: recentOrdersSummary.total.toLocaleString('es-CR'),
      icon: Package,
      accent: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    },
    {
      key: 'oper-value-today',
      label: 'Valor hoy',
      value: formatCurrency(recentOrdersSummary.totalAmount),
      icon: DollarSign,
      accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="space-y-8">
      <ProgressLoader
        isVisible={isLoaderVisible}
        title="Preparando dashboard"
        steps={loaderSteps}
        currentStep={loaderCurrentStep}
        overallProgress={loaderProgress}
        showCloseButton={loaderHasError}
        onClose={() => setIsLoaderVisible(false)}
      />
      {/* Cabecera estilo módulo */}
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                Panel Administrativo
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Dashboard Administrador
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                  Resumen diario de pedidos, mensajeros y sincronizaciones.
                </p>
              </div>
            </div>

            {stats && (
              <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  <span>Última sync: {formatLastSyncForDisplay(lastSyncTime)}</span>
                </div>
                {!canSync() && lastSyncTime && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Disponible en {getTimeUntilNextSync()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {stats && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <Card className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm">
                  <CardContent className="flex flex-col gap-4 p-4">
                    <div className="grid grid-flow-dense gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                      {highlightMetrics.map(({ metric, span }) => {
                        const paletteClasses = statsPaletteStyles[metric.palette];
                        return (
                          <StatsCard
                            key={`highlight-${metric.key}`}
                            title={metric.title}
                            value={metric.value}
                            icon={metric.icon}
                            className={cn(
                              'min-h-[120px] rounded-3xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-lg',
                              paletteClasses.card,
                              span,
                            )}
                            titleClassName={cn(
                              'text-xs font-semibold uppercase tracking-[0.25em] text-slate-500',
                              paletteClasses.title,
                            )}
                            valueClassName={cn('text-3xl font-semibold tracking-tight text-slate-900', paletteClasses.value)}
                            iconWrapperClassName={cn('p-2', paletteClasses.icon)}
                            accentDotClassName={paletteClasses.accent}
                            compact
                          />
                        );
                      })}
                    </div>
                    <div className="grid grid-flow-dense gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                      {secondaryMetrics.map(({ metric, span }) => {
                        const paletteClasses = statsPaletteStyles[metric.palette];
                        return (
                          <StatsCard
                            key={`secondary-${metric.key}`}
                            title={metric.title}
                            value={metric.value}
                            icon={metric.icon}
                            className={cn(
                              'min-h-[88px] rounded-2xl border bg-white/80 p-3 shadow-sm transition-shadow hover:shadow-md',
                              paletteClasses.card,
                              span,
                            )}
                            titleClassName={cn(
                              'text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500',
                              paletteClasses.title,
                            )}
                            valueClassName={cn('text-lg font-semibold text-slate-900', paletteClasses.value)}
                            iconWrapperClassName={cn('p-1.5', paletteClasses.icon)}
                            accentDotClassName={paletteClasses.accent}
                            compact
                          />
                        );
                      })}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
                      <StatsCard
                        key="secondary-delivery-rate"
                        title={metricsByKey.deliveryRate?.title ?? 'Tasa entrega'}
                        value={metricsByKey.deliveryRate?.value ?? `${stats.deliveryRate}%`}
                        icon={metricsByKey.deliveryRate?.icon ?? TrendingUp}
                        className={cn(
                          'min-h-[88px] rounded-2xl border bg-white/80 p-3 shadow-sm transition-shadow hover:shadow-md',
                          statsPaletteStyles[metricsByKey.deliveryRate?.palette ?? 'teal'].card,
                        )}
                        titleClassName={cn(
                          'text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500',
                          statsPaletteStyles[metricsByKey.deliveryRate?.palette ?? 'teal'].title,
                        )}
                        valueClassName={cn(
                          'text-lg font-semibold text-slate-900',
                          statsPaletteStyles[metricsByKey.deliveryRate?.palette ?? 'teal'].value,
                        )}
                        iconWrapperClassName={cn(
                          'p-1.5',
                          statsPaletteStyles[metricsByKey.deliveryRate?.palette ?? 'teal'].icon,
                        )}
                        accentDotClassName={statsPaletteStyles[metricsByKey.deliveryRate?.palette ?? 'teal'].accent}
                        compact
                      />
                      {operationalChips.map(chip => (
                        <div
                          key={chip.key}
                          className={cn(
                            'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium shadow-inner',
                            chip.accent,
                          )}
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                              {chip.label}
                            </span>
                            <p className="text-lg font-semibold text-slate-900">{chip.value}</p>
                          </div>
                          <chip.icon className="h-5 w-5 opacity-70" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-blue-50/70 shadow-sm">
                  <CardContent className="space-y-4 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Sincronización</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">Sheets ↔ Supabase</p>
                        <p className="text-xs text-slate-500">Ejecuta la sincronización antes de revisar pedidos.</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-blue-500 shadow-inner backdrop-blur">
                        <BookCopy className="h-4 w-4" />
                        <span className="text-base leading-none">⇄</span>
                        <Database className="h-4 w-4" />
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={syncing || !canSync()}
                          className={cn(
                            'group relative w-full overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 px-6 py-6 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2',
                            'disabled:cursor-not-allowed disabled:border-blue-100 disabled:bg-slate-50/80 disabled:text-slate-400 disabled:shadow-none',
                          )}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_60%)]" />
                          <div className="relative flex w-full flex-col items-center gap-1.5">
                            <span className="text-base font-semibold tracking-wide">
                              {syncing ? 'Sincronizando…' : 'Sincronizar'}
                            </span>
                            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-white/85">
                              <span>Última {formatLastSyncForDisplay(lastSyncTime)}</span>
                              {!canSync() && lastSyncTime && (
                                <span className="rounded-full bg-white/30 px-2 py-[2px] text-[10px] font-semibold text-white">
                                  Espera {getTimeUntilNextSync()}
                                </span>
                              )}
                            </div>
                          </div>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar sincronización</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm">
                              <p className="text-slate-600">
                                ¿Deseas ejecutar la sincronización de registros y pedidos? Actualizará los datos visibles.
                              </p>
                              <p className="font-medium text-amber-600">
                                ⚠️ Evita múltiples sincronizaciones en menos de 5 minutos.
                              </p>
                              {!canSync() && (
                                <p className="font-medium text-red-600">
                                  Debes esperar {getTimeUntilNextSync()} antes de sincronizar nuevamente.
                                </p>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={syncRegistries}
                            disabled={!canSync()}
                            className="bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-900"
                          >
                            Confirmar sincronización
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/70 shadow-sm">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Operación</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">Gestión de pedidos</p>
                        <p className="text-xs text-slate-500">Administra asignaciones y estados en tiempo real.</p>
                      </div>
                      <div className="rounded-xl border border-white/80 bg-white/70 p-3 text-indigo-500 shadow-inner backdrop-blur">
                        <Package className="h-5 w-5" />
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="w-full rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-500/90 via-blue-500/90 to-indigo-500/90 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2"
                    >
                      <Link href="/dashboard/admin/pedidos" className="flex items-center justify-center gap-2">
                        <span>Ir al panel</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-purple-50/70 shadow-sm">
                  <CardContent className="space-y-4 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">Usuarios</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">Gestión de usuarios</p>
                        <p className="text-xs text-slate-500">Administra roles, accesos y estados de las cuentas.</p>
                      </div>
                      <div className="rounded-xl border border-white/80 bg-white/70 p-3 text-purple-500 shadow-inner backdrop-blur">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="w-full rounded-xl border border-purple-200 bg-gradient-to-r from-purple-500/90 via-fuchsia-500/90 to-purple-500/90 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-purple-400/70 focus-visible:ring-offset-2"
                    >
                      <Link href="/dashboard/admin/usuarios" className="flex items-center justify-center gap-2">
                        <span>Ir a usuarios</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/70 shadow-sm">
                  <CardContent className="space-y-4 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Finanzas</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">Liquidaciones diarias</p>
                    <p className="text-xs text-slate-500">Revisa montos, pagos y devoluciones consolidadas.</p>
                  </div>
                  <div className="rounded-xl border border-white/80 bg-white/70 p-3 text-emerald-500 shadow-inner backdrop-blur">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                      className="w-full rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-500/90 via-teal-500/90 to-emerald-500/90 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2"
                >
                  <Link href="/dashboard/admin/liquidation" className="flex items-center justify-center gap-2">
                    <span>Ir a liquidaciones</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mensajes de sincronización */}
      {syncMessage && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border px-5 py-4 shadow-sm',
            syncMessage.includes('exitoso')
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700',
          )}
        >
          {syncMessage.includes('exitoso') ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <RotateCcw className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{syncMessage}</span>
        </div>
      )}

      {/* Sistema de Pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            {isShowingTodayOrders ? 'Pedidos de Hoy' : 'Pedidos Recientes'}
          </TabsTrigger>
          <TabsTrigger value="messengers" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Mensajeros ({messengers.length})
          </TabsTrigger>
          <TabsTrigger value="advisors" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Asesores ({advisors.length})
          </TabsTrigger>
        </TabsList>

        {/* Pestaña de Pedidos de Hoy */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {recentOrdersLabel}
                    </CardTitle>
                    {!isShowingTodayOrders && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        Sin pedidos hoy
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Mostrando {recentOrdersSummary.total.toLocaleString('es-CR')} pedidos{' '}
                    {isShowingTodayOrders ? 'registrados hoy.' : 'más recientes disponibles.'}
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row">
                  <Button
                    asChild
                    size="sm"
                    className="rounded-lg border border-blue-200 bg-blue-500/90 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                  >
                    <Link href="/dashboard/admin/liquidation">Ir a liquidaciones</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-lg px-4">
                    <Link href="/dashboard/admin/pedidos">Ver todos</Link>
                  </Button>
                </div>
              </div>
              {recentOrders.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {recentOrdersHighlights.map(({ key, label, value, accent, bg }) => (
                    <div
                      key={key}
                      className={cn(
                        'rounded-xl border px-3 py-2 transition-colors duration-200',
                        bg,
                      )}
                    >
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                        {label}
                      </p>
                      <p className={cn('text-lg font-semibold', accent)}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">ID Pedido</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Cliente</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Estado</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Mensajero</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Valor</th>
                      <th className="text-left p-3 font-medium text-sm text-muted-foreground">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm">{order.id}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-sm">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerAddress}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {order.assignedMessenger ? (
                              <>
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                                  {order.assignedMessenger.name.charAt(0)}
                                </div>
                                <span className="text-sm">{order.assignedMessenger.name}</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sin asignar</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-sm">{formatCurrency(order.totalAmount)}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('es-CR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {paginatedOrders.length === 0 && (
                      <tr className="border-b">
                        <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                          No se encontraron pedidos para la fecha actual.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {recentOrders.length > ORDERS_PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Página {ordersPage} de {Math.ceil(recentOrders.length / ORDERS_PER_PAGE)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ordersPage === 1}
                      onClick={() => {
                        const next = ordersPage - 1;
                        setOrdersPage(next);
                        setPaginatedOrders(
                          recentOrders.slice((next - 1) * ORDERS_PER_PAGE, next * ORDERS_PER_PAGE),
                        );
                      }}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ordersPage >= Math.ceil(recentOrders.length / ORDERS_PER_PAGE)}
                      onClick={() => {
                        const next = ordersPage + 1;
                        setOrdersPage(next);
                        setPaginatedOrders(
                          recentOrders.slice((next - 1) * ORDERS_PER_PAGE, next * ORDERS_PER_PAGE),
                        );
                      }}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Mensajeros */}
        <TabsContent value="messengers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Mensajeros Activos ({messengers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {messengers.map(messenger => {
                  const metrics = messengerMetricsMap[messenger.id];
                  const createdLabel = messenger.createdAt
                    ? new Date(messenger.createdAt).toLocaleDateString('es-CR')
                    : 'Sin registro';
                  return (
                    <div
                      key={messenger.id}
                      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                          {messenger.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{messenger.name}</h3>
                          <p className="text-[11px] uppercase tracking-wide text-blue-500">Mensajero</p>
                        </div>
                        <Badge variant={messenger.isActive ? 'default' : 'secondary'} className="ml-auto text-[10px]">
                          {messenger.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                          <p className="font-medium text-blue-600/80">Asignados</p>
                          <p className="text-lg font-semibold text-blue-900">
                            {metrics?.totalOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                          <p className="font-medium text-emerald-600/80">Entregados</p>
                          <p className="text-lg font-semibold text-emerald-900">
                            {metrics?.deliveredOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
                          <p className="font-medium text-amber-600/80">Pendientes</p>
                          <p className="text-lg font-semibold text-amber-900">
                            {metrics?.pendingOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-rose-100 bg-rose-50/70 p-3">
                          <p className="font-medium text-rose-600/80">Devueltos</p>
                          <p className="text-lg font-semibold text-rose-900">
                            {metrics?.returnedOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3">
                          <p className="font-medium text-indigo-600/80">Reagendados</p>
                          <p className="text-lg font-semibold text-indigo-900">
                            {metrics?.rescheduledOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                          <p className="font-medium text-slate-600/80">Valor gestionado</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(metrics?.totalAmount ?? 0)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                        <span>Activo desde</span>
                        <span className="font-medium text-slate-700">{createdLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Asesores */}
        <TabsContent value="advisors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Asesores Activos ({advisors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {advisors.map(advisor => {
                  const metrics = advisorMetricsMap[advisor.id];
                  const createdLabel = advisor.createdAt
                    ? new Date(advisor.createdAt).toLocaleDateString('es-CR')
                    : 'Sin registro';
                  return (
                    <div
                      key={advisor.id}
                      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                          {advisor.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{advisor.name}</h3>
                          <p className="text-[11px] uppercase tracking-wide text-emerald-600">Asesor / Tienda</p>
                        </div>
                        <Badge variant={advisor.isActive ? 'default' : 'secondary'} className="ml-auto text-[10px]">
                          {advisor.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                          <p className="font-medium text-slate-600/80">Pedidos</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {metrics?.totalOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 p-3">
                          <p className="font-medium text-emerald-600/80">Entregados</p>
                          <p className="text-lg font-semibold text-emerald-900">
                            {metrics?.deliveredOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-3">
                          <p className="font-medium text-amber-600/80">Pendientes</p>
                          <p className="text-lg font-semibold text-amber-900">
                            {metrics?.pendingOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-rose-100 bg-rose-50/80 p-3">
                          <p className="font-medium text-rose-600/80">Devueltos</p>
                          <p className="text-lg font-semibold text-rose-900">
                            {metrics?.returnedOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/80 p-3">
                          <p className="font-medium text-indigo-600/80">Reagendados</p>
                          <p className="text-lg font-semibold text-indigo-900">
                            {metrics?.rescheduledOrders ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                          <p className="font-medium text-emerald-600/80">Valor total</p>
                          <p className="text-sm font-semibold text-emerald-900">
                            {formatCurrency(metrics?.totalAmount ?? 0)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                        <span>Activo desde</span>
                        <span className="font-medium text-slate-700">{createdLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}