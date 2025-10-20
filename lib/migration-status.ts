/**
 * Estado de migración de endpoints Railway
 * 
 * Este archivo controla qué endpoints han sido migrados al servidor principal (85ff)
 * y cuáles aún usan el servidor legacy (2b25b).
 */

export const MIGRATION_STATUS = {
  // ✅ Migrados al servidor principal (85ff)
  MIGRATED: [
    'add-liquidacion',
    'alerta-liquidaciones-vencidas',
    'actualizar-pedido-admin',
    'add-gasto-mensajero',
    'actualizar-pedido-mensajero',
    'Sync-Today-Registries',
  ],
  
  // 🔄 En proceso de migración
  IN_PROGRESS: [
    // Todos migrados
  ],
  
  // ⏳ Pendientes de migración
  PENDING: [
    // Todos migrados
  ],
} as const;

// Función para verificar si un endpoint está migrado
export const isEndpointMigrated = (endpoint: string): boolean => {
  return MIGRATION_STATUS.MIGRATED.includes(endpoint as any);
};

// Función para obtener la URL correcta según el estado de migración
export const getEndpointUrl = (endpoint: string): string => {
  const { buildApiUrl, API_ENDPOINTS } = require('./config');
  
  // Mapeo de endpoints a sus rutas
  const endpointMap: Record<string, string> = {
    'add-gasto-mensajero': API_ENDPOINTS.EXPENSES.ADD_GASTO_MENSAJERO,
    'actualizar-pedido': API_ENDPOINTS.ORDERS.UPDATE_PEDIDO,
    'add-liquidacion': API_ENDPOINTS.LIQUIDATIONS.ADD_LIQUIDACION,
    'alerta-liquidaciones-vencidas': API_ENDPOINTS.LIQUIDATIONS.ALERTA_LIQUIDACIONES_VENCIDAS,
    'Sync-Today-Registries': API_ENDPOINTS.SYNC.SYNC_TODAY_REGISTRIES,
  };
  
  const endpointPath = endpointMap[endpoint];
  if (!endpointPath) {
    throw new Error(`Endpoint no encontrado: ${endpoint}`);
  }
  
  // Usar servidor principal si está migrado, sino legacy
  const server = isEndpointMigrated(endpoint) ? 'PRIMARY' : 'LEGACY';
  return buildApiUrl(endpointPath, server);
};

// Log de migración para debugging
export const logMigrationStatus = (): void => {
  console.log('🔄 Estado de migración de endpoints Railway:');
  console.log('✅ Migrados:', MIGRATION_STATUS.MIGRATED);
  console.log('🔄 En progreso:', MIGRATION_STATUS.IN_PROGRESS);
  console.log('⏳ Pendientes:', MIGRATION_STATUS.PENDING);
};
