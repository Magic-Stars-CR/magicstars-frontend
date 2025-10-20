# 🚀 Migración de Endpoints Railway

## 📋 Resumen

Este documento describe la migración de endpoints Railway de múltiples servidores a un servidor único (`primary-production-85ff.up.railway.app`).

## 🏗️ Arquitectura de Configuración

### Archivos de Configuración

- **`lib/config.ts`**: Configuración centralizada de URLs y endpoints
- **`lib/migration-status.ts`**: Control del estado de migración por endpoint

### Estructura

```
lib/
├── config.ts              # URLs base y endpoints
├── migration-status.ts    # Estado de migración
└── ...
```

## 🔧 Uso

### Importar Configuración

```typescript
import { API_URLS, apiRequest } from '@/lib/config';
import { getEndpointUrl, isEndpointMigrated } from '@/lib/migration-status';
```

### Hacer Requests

```typescript
// Opción 1: URLs pre-construidas (recomendado)
const response = await fetch(API_URLS.ADD_GASTO_MENSAJERO, {
  method: 'POST',
  body: JSON.stringify(data)
});

// Opción 2: Con función helper
const response = await apiRequest(API_URLS.ADD_GASTO_MENSAJERO, {
  method: 'POST',
  body: JSON.stringify(data)
});

// Opción 3: Con migración automática
const url = getEndpointUrl('add-gasto-mensajero');
const response = await fetch(url, {
  method: 'POST',
  body: JSON.stringify(data)
});
```

## 📊 Estado de Migración

### ✅ Endpoints Migrados (Servidor 85ff)
- `add-liquidacion`
- `alerta-liquidaciones-vencidas`
- `actualizar-pedido-admin`

### ⏳ Endpoints Pendientes (Servidor 2b25b)
- `add-gasto-mensajero`
- `actualizar-pedido-mensajero`
- `Sync-Today-Registries`

## 🔄 Proceso de Migración

### 1. Migrar Endpoint Individual

```typescript
// En migration-status.ts, mover de PENDING a MIGRATED
MIGRATED: [
  'add-liquidacion',
  'alerta-liquidaciones-vencidas',
  'actualizar-pedido-admin',
  'add-gasto-mensajero', // ← Nuevo
],
```

### 2. Actualizar Código

```typescript
// Antes
const response = await fetch('https://primary-production-2b25b.up.railway.app/webhook/add-gasto-mensajero', {
  // ...
});

// Después
import { API_URLS } from '@/lib/config';
const response = await fetch(API_URLS.ADD_GASTO_MENSAJERO, {
  // ...
});
```

### 3. Testing

1. Verificar que el endpoint funciona en el servidor 85ff
2. Actualizar el estado de migración
3. Probar la funcionalidad completa
4. Commit de los cambios

## 🚨 Rollback

Si algo falla, puedes hacer rollback fácilmente:

```bash
# Volver al commit anterior
git reset --hard HEAD~1

# O volver a un commit específico
git reset --hard 68f0c7f
```

## 📝 Checklist de Migración

- [ ] Crear configuración centralizada
- [ ] Migrar `add-gasto-mensajero`
- [ ] Migrar `actualizar-pedido-mensajero`
- [ ] Migrar `Sync-Today-Registries`
- [ ] Verificar todos los endpoints
- [ ] Limpiar URLs hardcodeadas
- [ ] Documentar cambios

## 🔍 Debugging

```typescript
import { logMigrationStatus } from '@/lib/migration-status';

// Ver estado actual
logMigrationStatus();

// Verificar endpoint específico
console.log('URL para add-gasto-mensajero:', getEndpointUrl('add-gasto-mensajero'));
console.log('¿Está migrado?', isEndpointMigrated('add-gasto-mensajero'));
```
