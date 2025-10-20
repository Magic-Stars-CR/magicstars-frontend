/**
 * Configuración centralizada para APIs y endpoints
 * 
 * Este archivo centraliza todas las URLs de APIs externas para facilitar
 * el mantenimiento y las migraciones futuras.
 */

// URLs base de los servidores Railway
export const RAILWAY_CONFIG = {
  // Servidor principal (85ff) - Servidor objetivo para migración
  PRIMARY: 'https://primary-production-85ff.up.railway.app',
  
  // Servidor secundario (2b25b) - En proceso de migración
  LEGACY: 'https://primary-production-2b25b.up.railway.app',
} as const;

// Endpoints específicos organizados por funcionalidad
export const API_ENDPOINTS = {
  // Gestión de Gastos
  EXPENSES: {
    ADD_GASTO_MENSAJERO: '/webhook/add-gasto-mensajero',
  },
  
  // Gestión de Pedidos
  ORDERS: {
    UPDATE_PEDIDO: '/webhook/actualizar-pedido',
  },
  
  // Liquidaciones
  LIQUIDATIONS: {
    ADD_LIQUIDACION: '/webhook/add-liquidacion',
    ALERTA_LIQUIDACIONES_VENCIDAS: '/webhook/alerta-liquidaciones-vencidas',
  },
  
  // Sincronización
  SYNC: {
    SYNC_TODAY_REGISTRIES: '/webhook/Sync-Today-Registries',
  },
} as const;

// Configuración de servidor activo
// Se determina dinámicamente según el estado de migración
export const ACTIVE_SERVER = RAILWAY_CONFIG.PRIMARY;

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string, server: keyof typeof RAILWAY_CONFIG = 'PRIMARY'): string => {
  return `${RAILWAY_CONFIG[server]}${endpoint}`;
};

// URLs pre-construidas para uso común
export const API_URLS = {
  // Gastos
  ADD_GASTO_MENSAJERO: buildApiUrl(API_ENDPOINTS.EXPENSES.ADD_GASTO_MENSAJERO),
  
  // Pedidos
  UPDATE_PEDIDO: buildApiUrl(API_ENDPOINTS.ORDERS.UPDATE_PEDIDO),
  
  // Liquidaciones
  ADD_LIQUIDACION: buildApiUrl(API_ENDPOINTS.LIQUIDATIONS.ADD_LIQUIDACION),
  ALERTA_LIQUIDACIONES_VENCIDAS: buildApiUrl(API_ENDPOINTS.LIQUIDATIONS.ALERTA_LIQUIDACIONES_VENCIDAS),
  
  // Sincronización
  SYNC_TODAY_REGISTRIES: buildApiUrl(API_ENDPOINTS.SYNC.SYNC_TODAY_REGISTRIES),
} as const;

// URLs del servidor legacy (para migración gradual)
export const LEGACY_API_URLS = {
  ADD_GASTO_MENSAJERO: buildApiUrl(API_ENDPOINTS.EXPENSES.ADD_GASTO_MENSAJERO, 'LEGACY'),
  UPDATE_PEDIDO: buildApiUrl(API_ENDPOINTS.ORDERS.UPDATE_PEDIDO, 'LEGACY'),
  SYNC_TODAY_REGISTRIES: buildApiUrl(API_ENDPOINTS.SYNC.SYNC_TODAY_REGISTRIES, 'LEGACY'),
} as const;

// Configuración de headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const;

// Función helper para hacer requests con configuración consistente
export const apiRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const defaultOptions: RequestInit = {
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  };

  return fetch(url, { ...defaultOptions, ...options });
};
