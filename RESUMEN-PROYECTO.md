# 📚 Resumen Completo del Proyecto MagicStars Frontend

## 🎯 Descripción General

**MagicStars Frontend** es una aplicación web integral de gestión logística diseñada específicamente para el mercado costarricense. El sistema automatiza y optimiza la gestión de pedidos, inventario, rutas de entrega y liquidaciones, con un enfoque especial en la distribución equitativa de pedidos por mensajero.

### Propósito Principal
- Gestión completa del ciclo de vida de pedidos (creación, confirmación, asignación, entrega)
- Control de inventario en tiempo real con alertas automáticas
- Asignación inteligente de rutas y mensajeros
- Sistema de liquidaciones y pagos
- Gestión de logística externa (Red Logística, Correos de Costa Rica)

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 13.5.1 (App Router)
- **Lenguaje:** TypeScript 5.2.2
- **Estilos:** Tailwind CSS 3.3.3
- **Componentes UI:** Shadcn/ui (Radix UI)
- **Iconos:** Lucide React
- **Gráficos:** Recharts
- **Formularios:** React Hook Form + Zod
- **Notificaciones:** Sonner (Toast)

### Backend y Base de Datos
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth + sistema personalizado
- **APIs Externas:** Railway (servidores backend)
- **Almacenamiento:** Supabase Storage (para imágenes/comprobantes)

### Herramientas de Desarrollo
- **Linting:** ESLint
- **Build Tool:** Next.js SWC
- **Gestión de Estado:** React Context API
- **Routing:** Next.js App Router

---

## 📁 Estructura del Proyecto

```
magicstars-frontend/
├── app/                          # Páginas de Next.js (App Router)
│   ├── auth/                     # Autenticación
│   │   ├── login/                # Página de login
│   │   ├── register/             # Registro de usuarios
│   │   ├── forgot-password/      # Recuperación de contraseña
│   │   └── reset-password/        # Reset de contraseña
│   │
│   ├── dashboard/                # Dashboards por rol
│   │   ├── admin/                # Panel de administrador
│   │   │   ├── pedidos/          # Gestión de pedidos
│   │   │   ├── inventory/        # Control de inventario
│   │   │   ├── routes/           # Gestión de rutas
│   │   │   ├── liquidation/      # Liquidaciones
│   │   │   ├── usuarios/         # Gestión de usuarios
│   │   │   ├── stats/            # Estadísticas
│   │   │   └── red-logistic/     # Logística externa
│   │   │
│   │   ├── asesor/               # Panel de asesor
│   │   │   ├── pedidos-sin-confirmar/  # Pedidos pendientes
│   │   │   ├── inventory/        # Inventario de la empresa
│   │   │   ├── red-logistic/     # Logística externa
│   │   │   └── stats/            # Estadísticas de empresa
│   │   │
│   │   ├── mensajero/            # Panel de mensajero
│   │   │   ├── mi-ruta-hoy/      # Ruta del día
│   │   │   ├── route-history/    # Historial de rutas
│   │   │   └── profile/          # Perfil del mensajero
│   │   │
│   │   ├── mensajero-lider/      # Panel de líder de mensajeros
│   │   │
│   │   └── tienda/               # Panel de tienda
│   │       ├── orders/             # Pedidos de la tienda
│   │       └── liquidacion/     # Liquidación de la tienda
│   │
│   ├── api/                      # API Routes de Next.js
│   │   └── sync/                 # Sincronización con backend
│   │
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página de inicio
│
├── components/                   # Componentes reutilizables
│   ├── auth/                     # Componentes de autenticación
│   ├── dashboard/                # Componentes del dashboard
│   │   ├── pedidos-table.tsx     # Tabla de pedidos
│   │   ├── pedidos-filters.tsx   # Filtros de pedidos
│   │   ├── pedidos-stats.tsx     # Estadísticas de pedidos
│   │   ├── productos-selector.tsx # Selector de productos
│   │   └── ...
│   ├── layout/                   # Componentes de layout
│   │   └── sidebar.tsx           # Barra lateral de navegación
│   └── ui/                       # Componentes base (Shadcn/ui)
│
├── contexts/                     # Contextos de React
│   └── auth-context.tsx          # Contexto de autenticación
│
├── hooks/                        # Hooks personalizados
│   ├── use-pedidos.ts            # Hook para pedidos
│   ├── use-tienda-pedidos.ts     # Hook para pedidos de tienda
│   └── use-hydration.ts          # Hook de hidratación
│
├── lib/                          # Utilidades y tipos
│   ├── types.ts                  # Definiciones de tipos TypeScript
│   ├── config.ts                 # Configuración de APIs
│   ├── utils.ts                  # Funciones utilitarias
│   ├── supabase-pedidos.ts       # Funciones de Supabase para pedidos
│   ├── supabase-inventario.ts    # Funciones de Supabase para inventario
│   ├── supabase-usuarios.ts     # Funciones de Supabase para usuarios
│   └── zonas.ts                  # Mapeo de zonas geográficas
│
├── utils/                        # Utilidades adicionales
│   └── supabase/                 # Clientes de Supabase
│       ├── client.ts             # Cliente del lado del cliente
│       ├── server.ts             # Cliente del lado del servidor
│       └── middleware.ts         # Middleware de Supabase
│
├── data/                         # Datos estáticos
│   └── zonas.json                # Mapeo de zonas de Costa Rica
│
├── docs/                         # Documentación
│   ├── README.md                 # Documentación principal
│   ├── diagramas-arquitectura.md # Diagramas de arquitectura
│   └── ...
│
└── middleware.ts                 # Middleware de Next.js
```

---

## 👥 Roles de Usuario y Funcionalidades

### 1. 👑 Administrador (`admin`)
**Acceso completo al sistema**

#### Funcionalidades:
- **Dashboard Global**
  - Vista general de todas las operaciones
  - Estadísticas consolidadas de todas las empresas
  - Métricas de rendimiento del sistema

- **Gestión de Pedidos** (`/dashboard/admin/pedidos`)
  - Ver todos los pedidos del sistema
  - Filtrar por estado, fecha, tienda, mensajero
  - Crear, editar y eliminar pedidos
  - Confirmar pedidos
  - Asignar mensajeros manualmente
  - Actualizar estados de pedidos
  - Subir pedidos masivos por CSV

- **Control de Inventario** (`/dashboard/admin/inventory`)
  - Ver inventario de todas las empresas
  - Crear productos
  - Ajustar stock manualmente
  - Ver historial de transacciones
  - Alertas de stock bajo
  - Gestión de ubicaciones

- **Gestión de Rutas** (`/dashboard/admin/routes`)
  - Asignar pedidos a mensajeros
  - Generar rutas automáticamente
  - Ver rutas del día
  - Reasignar pedidos entre mensajeros
  - Gestión de zonas geográficas

- **Liquidaciones** (`/dashboard/admin/liquidation`)
  - Ver liquidaciones de todos los mensajeros
  - Aprobar liquidaciones
  - Revisar gastos de mensajeros
  - Calcular montos a entregar
  - Historial de liquidaciones

- **Gestión de Usuarios** (`/dashboard/admin/usuarios`)
  - Crear, editar y eliminar usuarios
  - Asignar roles
  - Activar/desactivar usuarios
  - Gestionar empresas

- **Estadísticas** (`/dashboard/admin/stats`)
  - Estadísticas globales
  - Estadísticas por empresa
  - Estadísticas por mensajero
  - Reportes personalizados

- **Logística Externa** (`/dashboard/admin/red-logistic`)
  - Gestionar envíos externos
  - Tracking de paquetes
  - Integración con Correos de Costa Rica

---

### 2. 🏢 Asesor (`asesor`)
**Acceso limitado a su empresa**

#### Funcionalidades:
- **Dashboard Empresarial** (`/dashboard/asesor`)
  - Vista de pedidos de su empresa
  - Estadísticas de la empresa
  - Resumen de operaciones

- **Pedidos Sin Confirmar** (`/dashboard/asesor/pedidos-sin-confirmar`)
  - Ver pedidos pendientes de confirmación
  - Confirmar pedidos
  - Rechazar pedidos con motivo
  - Editar información de pedidos

- **Control de Inventario** (`/dashboard/asesor/inventory`)
  - Ver inventario de su empresa
  - Ajustar stock
  - Ver historial de movimientos
  - Alertas de stock bajo

- **Logística Externa** (`/dashboard/asesor/red-logistic`)
  - Crear envíos externos
  - Ver estado de envíos
  - Gestionar tracking

- **Estadísticas** (`/dashboard/asesor/stats`)
  - Estadísticas de su empresa
  - Reportes de ventas
  - Análisis de entregas

---

### 3. 🚚 Mensajero (`mensajero`)
**Acceso a sus rutas y pedidos asignados**

#### Funcionalidades:
- **Mi Ruta de Hoy** (`/dashboard/mensajero/mi-ruta-hoy`)
  - Ver pedidos asignados del día
  - Actualizar estado de pedidos
  - Marcar como entregado/devolución
  - Ver detalles de cada pedido
  - Navegación con Google Maps

- **Mis Pedidos** (`/dashboard/mensajero`)
  - Ver todos sus pedidos
  - Filtrar por estado y fecha
  - Historial de entregas

- **Historial de Rutas** (`/dashboard/mensajero/route-history`)
  - Ver rutas anteriores
  - Ver gastos registrados
  - Estadísticas personales

- **Mi Perfil** (`/dashboard/mensajero/profile`)
  - Ver información personal
  - Actualizar datos de contacto
  - Cambiar contraseña

- **Escaneo** (enlace externo)
  - Acceso a sistema de escaneo de inventario
  - URL: `https://inventario-magic-stars.vercel.app/?mensajero={nombre}`

---

### 4. 👔 Mensajero Líder (`mensajero-lider`)
**Mensajero con permisos adicionales**

#### Funcionalidades:
- Todas las funcionalidades de mensajero
- **Gestión de Rutas** (`/dashboard/mensajero-lider`)
  - Ver rutas de otros mensajeros
  - Asignar pedidos
  - Reasignar pedidos

---

### 5. 🏪 Tienda (`tienda`)
**Acceso a pedidos y liquidación de su tienda**

#### Funcionalidades:
- **Dashboard** (`/dashboard/tienda`)
  - Vista general de pedidos de la tienda
  - Estadísticas de la tienda
  - Pedidos recientes

- **Gestión de Pedidos** (`/dashboard/tienda/orders`)
  - Ver todos los pedidos de la tienda
  - Crear nuevos pedidos
  - Editar pedidos existentes
  - Confirmar pedidos
  - Actualizar estados
  - Filtrar por estado y fecha
  - Buscar pedidos

- **Liquidación** (`/dashboard/tienda/liquidacion`)
  - Ver liquidaciones de la tienda
  - Calcular montos a recibir
  - Ver desglose de pagos
  - Historial de liquidaciones

---

## 🔑 Funcionalidades Principales del Sistema

### 1. Sistema de Pedidos

#### Estados de Pedidos:
- `pendiente`: Pedido creado, esperando confirmación
- `confirmado`: Pedido confirmado por asesor/tienda
- `en_ruta`: Pedido asignado a mensajero y en camino
- `entregado`: Pedido entregado exitosamente
- `devolucion`: Pedido devuelto
- `reagendado`: Pedido reagendado para otra fecha

#### Métodos de Pago:
- `efectivo`: Pago en efectivo
- `sinpe`: Pago por SINPE móvil
- `tarjeta`: Pago con tarjeta
- `2pagos`: Pago en dos partes (efectivo + SINPE)

#### Origen de Pedidos:
- `shopify`: Sincronizado desde Shopify
- `manual`: Creado manualmente
- `csv`: Importado desde CSV

#### Funcionalidades:
- **Creación de Pedidos:**
  - Manual desde formulario
  - Importación masiva por CSV
  - Sincronización desde Shopify (futuro)

- **Confirmación de Pedidos:**
  - Los asesores/tiendas confirman pedidos
  - Campo `confirmado` en base de datos
  - Motivo de confirmación/rechazo

- **Asignación de Mensajeros:**
  - Automática por zona geográfica
  - Manual por administrador
  - Reasignación entre mensajeros

- **Actualización de Estados:**
  - Mensajeros actualizan estados en tiempo real
  - Notificaciones automáticas
  - Historial de cambios

---

### 2. Sistema de Inventario

#### Tipos de Movimientos:
- `entrada`: Añadir inventario
- `salida`: Descontar inventario
- `ajuste`: Ajuste manual
- `pedido_montado`: Descuento automático por pedido en ruta
- `pedido_devuelto`: Devolución automática
- `pedido_entregado`: Confirmación de entrega
- `red_logistic_enviado`: Descuento por envío externo
- `red_logistic_entregado`: Confirmación de entrega externa
- `red_logistic_devuelto`: Devolución externa
- `inicial`: Inventario inicial
- `perdida`: Pérdida o daño
- `transferencia`: Transferencia entre ubicaciones

#### Funcionalidades:
- **Control de Stock:**
  - Stock actual, mínimo y máximo
  - Stock reservado para pedidos
  - Stock disponible (actual - reservado)

- **Alertas Automáticas:**
  - Stock bajo
  - Stock agotado
  - Sobrestock
  - Productos próximos a vencer

- **Historial de Transacciones:**
  - Registro completo de movimientos
  - Usuario que realizó la acción
  - Motivo y referencia

- **Gestión por Empresa:**
  - Inventario separado por empresa
  - Control de acceso por rol

---

### 3. Sistema de Rutas

#### Zonas Geográficas (Costa Rica):
- **8 Rutas Principales:**
  - AL1 (Alajuela)
  - CT1 (Cartago)
  - H1 (Heredia)
  - SJ1, SJ2, SJ3, SJ4, SJ5 (San José)

- **16 Cantones Mapeados:**
  - Cobertura completa del Gran Área Metropolitana (GAM)

#### Pagos por Ruta:
- **₡2,500:** Alajuela, Cartago, Heredia
- **₡2,000:** San José

#### Funcionalidades:
- **Asignación Automática:**
  - Distribución equitativa de pedidos
  - Asignación por zona geográfica
  - Optimización de rutas

- **Gestión de Rutas:**
  - Ver rutas del día
  - Asignar pedidos manualmente
  - Reasignar pedidos entre mensajeros
  - Ver historial de rutas

- **Tracking en Tiempo Real:**
  - Estado de cada pedido en la ruta
  - Actualización automática
  - Notificaciones de cambios

---

### 4. Sistema de Liquidaciones

#### Estados de Liquidación:
- `pendiente`: Ruta finalizada, esperando liquidación
- `finalizada`: Ruta finalizada por mensajero
- `liquidada`: Liquidación aprobada por administrador

#### Componentes de Liquidación:
- **Total Recaudado:**
  - Efectivo
  - SINPE
  - Tarjeta

- **Gastos del Mensajero:**
  - Combustible
  - Alimentación
  - Peaje
  - Mantenimiento
  - Otros

- **Cálculo Final:**
  - Total recaudado - Gastos = Monto a entregar

#### Funcionalidades:
- **Registro de Gastos:**
  - Mensajeros registran gastos con imágenes
  - Categorización de gastos
  - Validación de comprobantes

- **Aprobación de Liquidaciones:**
  - Administrador revisa y aprueba
  - Cálculo automático de montos
  - Notas y observaciones

- **Liquidación por Tienda:**
  - Cálculo de liquidación por tienda
  - Desglose de pedidos por tienda
  - Montos finales por tienda

---

### 5. Sistema de Autenticación

#### Implementación:
- **Supabase Auth** + sistema personalizado
- Autenticación por email/nombre y contraseña
- Sesiones almacenadas en localStorage
- Verificación de sesión al cargar la aplicación

#### Flujos:
- **Login:**
  - Email o nombre de usuario
  - Contraseña
  - Validación contra base de datos

- **Sesión Persistente:**
  - Token almacenado en localStorage
  - Verificación automática al iniciar
  - Redirección si no hay sesión

- **Logout:**
  - Limpieza de localStorage
  - Redirección a login

---

### 6. Integración con APIs Externas

#### Servidores Railway:
- **Servidor Principal:** `https://primary-production-85ff.up.railway.app`
- **Servidor Legacy:** `https://primary-production-2b25b.up.railway.app`

#### Endpoints Principales:

**Gastos:**
- `POST /webhook/add-gasto-mensajero` - Agregar gasto de mensajero

**Pedidos:**
- `POST /webhook/actualizar-pedido` - Actualizar pedido
- `POST /webhook/add-edit-confirm-pedido-asesor` - Crear/editar/confirmar pedido

**Liquidaciones:**
- `POST /webhook/add-liquidacion` - Agregar liquidación
- `POST /webhook/alerta-liquidaciones-vencidas` - Alertas de liquidaciones

**Sincronización:**
- `POST /webhook/Sync-Today-Registries` - Sincronizar registros del día
- `POST /webhook/sincronizar-pedidos` - Sincronizar pedidos

**Rutas:**
- `POST /webhook/generar_rutas` - Generar rutas
- `POST /webhook/Asignar-Pedido-Individual` - Asignar pedido individual
- `POST /webhook/reasignar-pedidos-de-un-mensajero-a-otro` - Reasignar pedidos

---

## 🗄️ Base de Datos (Supabase)

### Tablas Principales:

#### `usuarios`
- Información de usuarios del sistema
- Roles, empresas, estado activo/inactivo

#### `pedidos`
- Todos los pedidos del sistema
- Estados, asignaciones, información de cliente
- Métodos de pago, comprobantes

#### `Inventario`
- Productos y stock
- Por tienda/empresa
- Cantidades actuales

#### `liquidaciones`
- Liquidaciones de mensajeros
- Gastos, recaudaciones, estados

#### `gastos_mensajero`
- Gastos registrados por mensajeros
- Categorías, imágenes, fechas

---

## 🎨 Componentes Principales

### Componentes de Dashboard:
- **`pedidos-table.tsx`**: Tabla principal de pedidos con paginación
- **`pedidos-filters.tsx`**: Filtros avanzados de pedidos
- **`pedidos-stats.tsx`**: Estadísticas y métricas
- **`pedido-form.tsx`**: Formulario de creación/edición
- **`productos-selector.tsx`**: Selector de productos para pedidos
- **`status-update-modal.tsx`**: Modal para actualizar estado
- **`date-filters.tsx`**: Filtros de fecha
- **`stats-card.tsx`**: Tarjetas de estadísticas

### Componentes de Layout:
- **`sidebar.tsx`**: Barra lateral de navegación con menú por rol

### Componentes UI (Shadcn/ui):
- Componentes base: Button, Input, Select, Dialog, Table, etc.
- Todos los componentes de Radix UI personalizados

---

## 🔄 Flujos de Trabajo Principales

### 1. Flujo de Creación de Pedido:
1. **Tienda/Asesor** crea pedido (manual o CSV)
2. Pedido queda en estado `pendiente`
3. **Asesor/Tienda** confirma el pedido
4. Pedido cambia a `confirmado`
5. **Administrador** asigna mensajero (automático o manual)
6. Pedido cambia a `en_ruta`
7. **Mensajero** actualiza estado a `entregado` o `devolucion`
8. Sistema actualiza inventario automáticamente

### 2. Flujo de Liquidación:
1. **Mensajero** finaliza su ruta del día
2. Registra gastos con imágenes
3. Sistema calcula totales automáticamente
4. **Administrador** revisa liquidación
5. Administrador aprueba y marca como `liquidada`
6. Se calcula monto final a entregar

### 3. Flujo de Inventario:
1. **Admin/Asesor** crea producto en inventario
2. Sistema registra movimiento inicial
3. Al montar pedido a ruta, se descuenta stock
4. Si pedido se devuelve, se restaura stock
5. Alertas automáticas si stock bajo
6. Historial completo de transacciones

---

## 📊 Estadísticas y Reportes

### Métricas Disponibles:
- Total de pedidos
- Pedidos entregados
- Pedidos devueltos
- Pedidos reagendados
- Tasa de entrega
- Total recaudado (efectivo, SINPE, tarjeta)
- Gastos de mensajeros
- Efectividad de mensajeros
- Estadísticas por empresa
- Estadísticas por mensajero
- Estadísticas por período

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start

# Linting
npm run lint
```

---

## 🔐 Variables de Entorno

Necesarias en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_de_supabase
```

---

## 📝 Notas Importantes

### Características Clave:
1. **Sistema Multi-empresa:** Cada empresa tiene su propio inventario y pedidos
2. **Roles Granulares:** Diferentes permisos según el rol
3. **Filtrado Automático:** Cada rol ve solo sus datos relevantes
4. **Actualización en Tiempo Real:** Datos sincronizados con Supabase
5. **Responsive Design:** Funciona en desktop, tablet y móvil
6. **Integración Externa:** APIs de Railway para operaciones backend

### Consideraciones:
- El sistema usa Supabase como base de datos principal
- Las operaciones críticas se sincronizan con servidores Railway
- Los mensajeros tienen acceso a sistema de escaneo externo
- Las liquidaciones se calculan automáticamente
- El inventario se actualiza automáticamente con los pedidos

---

## 🎯 Próximos Pasos Recomendados

1. **Revisar la documentación en `/docs`** para diagramas detallados
2. **Explorar los componentes** en `/components` para entender la UI
3. **Revisar los tipos** en `/lib/types.ts` para entender la estructura de datos
4. **Probar el sistema** con diferentes roles para entender los flujos
5. **Revisar las APIs** en `/lib/config.ts` para entender las integraciones

---

## 📞 Información Adicional

- **Versión:** 1.0.0
- **Última Actualización:** Diciembre 2024
- **Framework:** Next.js 13.5.1
- **Base de Datos:** Supabase (PostgreSQL)

---

*Este resumen proporciona una visión completa del proyecto MagicStars Frontend. Para más detalles, consulta la documentación en `/docs` y los archivos de código fuente.*
