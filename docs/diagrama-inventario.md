# Diagrama de Sistema de Inventario - MagicStars Frontend

## 1. Arquitectura del Sistema de Inventario

```mermaid
graph TB
    subgraph "Frontend - Gestión de Inventario"
        A[Página de Inventario] --> B[Filtros y Búsqueda]
        A --> C[Lista de Productos]
        A --> D[Acciones de Inventario]
        
        B --> E[Filtrar por Empresa]
        B --> F[Filtrar por Categoría]
        B --> G[Buscar por SKU/Nombre]
        B --> H[Filtrar por Stock]
        
        C --> I[Vista de Tarjetas]
        C --> J[Vista de Tabla]
        C --> K[Paginación]
        
        D --> L[Crear Producto]
        D --> M[Editar Producto]
        D --> N[Ajustar Stock]
        D --> O[Ver Historial]
    end
    
    subgraph "Mock API - Inventario"
        P[getInventoryItems] --> Q[Filtrar por Rol]
        R[createInventoryItem] --> S[Validar Datos]
        T[updateInventoryItem] --> U[Actualizar Stock]
        V[adjustInventory] --> W[Crear Transacción]
        X[getInventoryHistory] --> Y[Filtrar por Fechas]
    end
    
    subgraph "Tipos de Datos"
        Z[InventoryItem] --> AA[Producto Base]
        BB[InventoryTransaction] --> CC[Movimiento de Stock]
        DD[InventoryAdjustment] --> EE[Ajuste Manual]
        FF[InventoryAlert] --> GG[Alertas de Stock]
    end
    
    A --> P
    D --> R
    D --> T
    D --> V
    D --> X
```

## 2. Flujo de Gestión de Productos por Rol

```mermaid
flowchart TD
    A[Usuario accede a Inventario] --> B{¿Qué rol?}
    
    B -->|Admin| C[Vista Global de Inventario]
    B -->|Asesor| D[Vista de Empresa]
    
    C --> E[Ver Todos los Productos]
    C --> F[Gestionar Todas las Empresas]
    C --> G[Estadísticas Globales]
    
    D --> H[Ver Productos de su Empresa]
    D --> I[Gestionar Solo su Empresa]
    D --> J[Estadísticas de su Empresa]
    
    E --> K[Operaciones de Inventario]
    H --> K
    
    K --> L[Crear Producto]
    K --> M[Editar Producto]
    K --> N[Ajustar Stock]
    K --> O[Ver Historial]
    K --> P[Eliminar Producto]
    
    L --> Q[Formulario de Creación]
    M --> R[Formulario de Edición]
    N --> S[Formulario de Ajuste]
    O --> T[Historial de Transacciones]
    P --> U[Confirmación de Eliminación]
```

## 3. Flujo de Creación de Producto

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant A as API
    participant D as Base de Datos
    
    U->>F: Hace clic en "Crear Producto"
    F->>F: Muestra formulario de creación
    U->>F: Llena datos del producto
    F->>F: Valida datos del formulario
    
    F->>A: createInventoryItem(datos)
    A->>A: Validar datos requeridos
    A->>A: Generar ID único
    A->>A: Establecer valores por defecto
    A->>D: Guardar producto
    D-->>A: Producto creado
    A-->>F: Producto creado exitosamente
    F->>F: Mostrar mensaje de éxito
    F->>F: Actualizar lista de productos
    F->>U: Mostrar producto en la lista
```

## 4. Flujo de Ajuste de Inventario

```mermaid
flowchart TD
    A[Usuario selecciona "Ajustar Stock"] --> B[Mostrar Modal de Ajuste]
    B --> C[Seleccionar Tipo de Ajuste]
    
    C --> D[Ajuste por Entrada]
    C --> E[Ajuste por Salida]
    C --> F[Ajuste por Corrección]
    C --> G[Ajuste por Pérdida]
    
    D --> H[Ingresar Cantidad Positiva]
    E --> I[Ingresar Cantidad Negativa]
    F --> J[Ingresar Cantidad Corregida]
    G --> K[Ingresar Cantidad Perdida]
    
    H --> L[Validar Cantidad]
    I --> L
    J --> L
    K --> L
    
    L --> M{¿Cantidad válida?}
    M -->|No| N[Mostrar Error]
    M -->|Sí| O[Ingresar Motivo]
    
    N --> C
    O --> P[Ingresar Notas Adicionales]
    P --> Q[Confirmar Ajuste]
    
    Q --> R[Crear Transacción]
    R --> S[Actualizar Stock del Producto]
    S --> T[Registrar en Historial]
    T --> U[Mostrar Confirmación]
    U --> V[Actualizar Vista]
```

## 5. Sistema de Alertas de Stock

```mermaid
graph TD
    subgraph "Monitoreo de Stock"
        A[Verificar Stock Actual] --> B{¿Stock < Mínimo?}
        B -->|Sí| C[Generar Alerta de Stock Bajo]
        B -->|No| D{¿Stock > Máximo?}
        
        C --> E[Mostrar Badge Rojo]
        C --> F[Notificar a Asesor/Admin]
        C --> G[Agregar a Lista de Alertas]
        
        D -->|Sí| H[Generar Alerta de Sobrestock]
        D -->|No| I[Stock Normal]
        
        H --> J[Mostrar Badge Amarillo]
        H --> K[Notificar a Asesor/Admin]
        H --> L[Agregar a Lista de Alertas]
        
        I --> M[Mostrar Badge Verde]
        I --> N[Sin Notificaciones]
    end
    
    subgraph "Tipos de Alertas"
        O[Stock Bajo] --> P[Urgente - Reabastecer]
        Q[Stock Crítico] --> R[Crítico - Reabastecer Inmediatamente]
        S[Sobrestock] --> T[Advertencia - Revisar Demanda]
        U[Stock Cero] --> V[Crítico - Producto Agotado]
    end
```

## 6. Flujo de Historial de Transacciones

```mermaid
flowchart TD
    A[Usuario selecciona "Ver Historial"] --> B[Mostrar Filtros de Historial]
    B --> C[Seleccionar Producto]
    B --> D[Seleccionar Fecha Inicio]
    B --> E[Seleccionar Fecha Fin]
    B --> F[Seleccionar Tipo de Transacción]
    
    C --> G[Obtener Historial del Producto]
    D --> G
    E --> G
    F --> G
    
    G --> H[Filtrar Transacciones]
    H --> I[Ordenar por Fecha]
    I --> J[Mostrar en Tabla]
    
    J --> K[Mostrar Detalles de Transacción]
    K --> L[Usuario que realizó la acción]
    K --> M[Fecha y hora]
    K --> N[Cantidad antes]
    K --> O[Cantidad después]
    K --> P[Motivo del cambio]
    K --> Q[Notas adicionales]
    
    J --> R[Exportar Historial]
    R --> S[Generar CSV/PDF]
    S --> T[Descargar Archivo]
```

## 7. Integración con Sistema de Pedidos

```mermaid
sequenceDiagram
    participant P as Pedido
    participant I as Inventario
    participant T as Transacción
    participant A as Alerta
    
    P->>I: Pedido confirmado
    I->>I: Verificar stock disponible
    I->>T: Crear transacción de salida
    T->>I: Actualizar stock del producto
    I->>A: Verificar si stock < mínimo
    A->>A: Generar alerta si es necesario
    
    Note over P,A: Proceso automático al confirmar pedido
    
    P->>I: Pedido entregado
    I->>T: Crear transacción de entrega
    T->>I: Actualizar stock final
    
    P->>I: Pedido devuelto
    I->>T: Crear transacción de entrada
    T->>I: Restaurar stock del producto
    I->>A: Verificar alertas actualizadas
```

## 8. Dashboard de Estadísticas de Inventario

```mermaid
graph TD
    subgraph "Métricas de Inventario"
        A[Total de Productos] --> A1[Por Empresa]
        A --> A2[Por Categoría]
        A --> A3[Por Estado de Stock]
        
        B[Valor Total del Inventario] --> B1[Por Empresa]
        B --> B2[Por Categoría]
        B --> B3[Tendencia Mensual]
        
        C[Productos con Stock Bajo] --> C1[Urgentes: 5]
        C --> C2[Críticos: 2]
        C --> C3[Por Revisar: 8]
        
        D[Movimientos del Día] --> D1[Entradas: 25]
        D --> D2[Salidas: 18]
        D --> D3[Ajustes: 3]
        
        E[Top Productos] --> E1[Más Vendidos]
        E --> E2[Más Movidos]
        E --> E3[Más Ajustados]
    end
    
    subgraph "Gráficos y Visualizaciones"
        F[Gráfico de Barras] --> F1[Stock por Categoría]
        G[Gráfico de Líneas] --> G1[Tendencia de Stock]
        H[Gráfico de Pastel] --> H1[Distribución por Empresa]
        I[Tabla de Alertas] --> I1[Productos que requieren atención]
    end
```

## 9. Flujo de Categorización de Productos

```mermaid
flowchart TD
    A[Crear/Editar Producto] --> B[Seleccionar Categoría]
    B --> C{¿Categoría existente?}
    
    C -->|Sí| D[Usar Categoría Existente]
    C -->|No| E[Crear Nueva Categoría]
    
    D --> F[Asignar a Producto]
    E --> G[Definir Nombre de Categoría]
    G --> H[Definir Descripción]
    H --> I[Establecer Color/Icono]
    I --> J[Guardar Categoría]
    J --> F
    
    F --> K[Validar Asignación]
    K --> L{¿Asignación válida?}
    L -->|Sí| M[Producto Categorizado]
    L -->|No| N[Mostrar Error]
    
    N --> B
    M --> O[Actualizar Lista de Productos]
    O --> P[Filtrar por Categoría Disponible]
```

## 10. Sistema de Búsqueda y Filtros

```mermaid
graph TD
    subgraph "Filtros Disponibles"
        A[Búsqueda por Texto] --> A1[SKU del Producto]
        A --> A2[Nombre del Producto]
        A --> A3[Descripción]
        
        B[Filtros por Empresa] --> B1[Todas las Empresas]
        B --> B2[Empresa Específica]
        
        C[Filtros por Stock] --> C1[Stock Bajo]
        C --> C2[Stock Normal]
        C --> C3[Sobrestock]
        C --> C4[Sin Stock]
        
        D[Filtros por Categoría] --> D1[Electrónicos]
        D --> D2[Ropa]
        D --> D3[Accesorios]
        D --> D4[Otros]
        
        E[Filtros por Fecha] --> E1[Última Actualización]
        E --> E2[Fecha de Creación]
        E --> E3[Último Movimiento]
    end
    
    subgraph "Resultados de Búsqueda"
        F[Productos Encontrados] --> F1[Vista de Tarjetas]
        F --> F2[Vista de Tabla]
        F --> F3[Paginación]
        
        G[Ordenamiento] --> G1[Por Nombre A-Z]
        G --> G2[Por Stock Ascendente]
        G --> G3[Por Fecha de Actualización]
        G --> G4[Por Valor Total]
    end
```

## 11. Flujo de Eliminación de Producto

```mermaid
flowchart TD
    A[Usuario selecciona "Eliminar Producto"] --> B[Verificar Permisos]
    B --> C{¿Tiene permisos?}
    
    C -->|No| D[Mostrar Error de Permisos]
    C -->|Sí| E[Verificar Stock Actual]
    
    E --> F{¿Stock = 0?}
    F -->|No| G[Mostrar Advertencia]
    F -->|Sí| H[Verificar Transacciones Recientes]
    
    G --> I[¿Continuar eliminación?]
    I -->|No| J[Cancelar Eliminación]
    I -->|Sí| H
    
    H --> K{¿Tiene transacciones recientes?}
    K -->|Sí| L[Mostrar Advertencia de Transacciones]
    K -->|No| M[Confirmar Eliminación]
    
    L --> N[¿Eliminar de todas formas?]
    N -->|No| J
    N -->|Sí| M
    
    M --> O[Eliminar Producto]
    O --> P[Eliminar Transacciones Relacionadas]
    P --> Q[Actualizar Lista]
    Q --> R[Mostrar Confirmación]
    
    D --> S[Volver a Lista]
    J --> S
    R --> S
```

## 12. Integración con Sistema de Reportes

```mermaid
graph TD
    subgraph "Generación de Reportes"
        A[Reporte de Inventario] --> A1[Stock Actual por Producto]
        A --> A2[Valor Total del Inventario]
        A --> A3[Productos con Stock Bajo]
        
        B[Reporte de Movimientos] --> B1[Transacciones por Período]
        B --> B2[Entradas vs Salidas]
        B --> B3[Top Productos Movidos]
        
        C[Reporte de Alertas] --> C1[Productos que Requieren Atención]
        C --> C2[Historial de Alertas]
        C --> C3[Tendencias de Stock]
        
        D[Exportación] --> D1[Formato CSV]
        D --> D2[Formato PDF]
        D --> D3[Formato Excel]
    end
    
    subgraph "Filtros de Reporte"
        E[Filtro por Empresa] --> E1[Todas las Empresas]
        E --> E2[Empresa Específica]
        
        F[Filtro por Fecha] --> F1[Último Mes]
        F --> F2[Últimos 3 Meses]
        F --> F3[Último Año]
        F --> F4[Período Personalizado]
        
        G[Filtro por Categoría] --> G1[Todas las Categorías]
        G --> G2[Categoría Específica]
    end
```

## 13. Flujo de Sincronización con Pedidos

```mermaid
sequenceDiagram
    participant O as Orden
    participant I as Inventario
    participant T as Transacción
    participant A as Alerta
    participant N as Notificación
    
    O->>I: Pedido creado
    I->>I: Verificar disponibilidad
    I->>T: Crear transacción de reserva
    T->>I: Actualizar stock reservado
    
    O->>I: Pedido confirmado
    I->>T: Crear transacción de salida
    T->>I: Actualizar stock disponible
    I->>A: Verificar alertas de stock
    A->>N: Notificar si es necesario
    
    O->>I: Pedido entregado
    I->>T: Crear transacción de entrega
    T->>I: Confirmar salida final
    
    O->>I: Pedido devuelto
    I->>T: Crear transacción de entrada
    T->>I: Restaurar stock
    I->>A: Verificar alertas actualizadas
```

## 14. Dashboard de Monitoreo en Tiempo Real

```mermaid
graph TD
    subgraph "Dashboard de Inventario"
        A[Resumen General] --> A1[Total Productos: 1,250]
        A --> A2[Valor Total: ₡15,000,000]
        A --> A3[Productos con Stock Bajo: 15]
        A --> A4[Movimientos Hoy: 45]
        
        B[Alertas Activas] --> B1[Stock Crítico: 3 productos]
        B --> B2[Stock Bajo: 12 productos]
        B --> B3[Sobrestock: 5 productos]
        B --> B4[Sin Movimiento: 8 productos]
        
        C[Movimientos Recientes] --> C1[Última Hora: 12 movimientos]
        C --> C2[Últimas 24h: 156 movimientos]
        C --> C3[Esta Semana: 1,234 movimientos]
        
        D[Top Productos] --> D1[Más Vendidos: Producto A]
        D --> D2[Más Ajustados: Producto B]
        D --> D3[Más Movidos: Producto C]
        
        E[Distribución por Empresa] --> E1[Para Machos CR: 45%]
        E --> E2[BeautyFan: 30%]
        E --> E3[AllStars: 25%]
    end
```

---

## Resumen del Sistema de Inventario

### **Características Principales**
- ✅ **Gestión por roles**: Admin ve todo, Asesor ve solo su empresa
- ✅ **Control de stock en tiempo real**: Actualizaciones automáticas
- ✅ **Sistema de alertas**: Notificaciones de stock bajo/crítico
- ✅ **Historial completo**: Seguimiento de todas las transacciones
- ✅ **Integración con pedidos**: Sincronización automática
- ✅ **Reportes avanzados**: Análisis y exportación de datos

### **Funcionalidades por Rol**

#### **Administrador**
- 🔍 Vista global de todo el inventario
- 📊 Estadísticas de todas las empresas
- ⚙️ Gestión completa de productos
- 📈 Reportes globales

#### **Asesor**
- 🏢 Vista limitada a su empresa
- 📦 Gestión de productos de su empresa
- 📊 Estadísticas de su empresa
- 📋 Reportes de su empresa

### **Beneficios del Sistema**
- 🎯 **Control total**: Visibilidad completa del inventario
- ⚡ **Automatización**: Actualizaciones automáticas con pedidos
- 📊 **Análisis**: Estadísticas y tendencias detalladas
- 🚨 **Alertas**: Notificaciones proactivas de problemas
- 📈 **Escalabilidad**: Fácil gestión de múltiples empresas

*Este sistema de inventario proporciona un control completo y automatizado del stock, con integración total con el sistema de pedidos y gestión por roles.*
