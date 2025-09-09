# Diagramas de Arquitectura y Uso - MagicStars Frontend

## 1. Arquitectura General del Sistema

```mermaid
graph TB
    subgraph "Frontend - Next.js"
        A[Página de Login] --> B[AuthContext]
        B --> C{Usuario Autenticado?}
        C -->|No| A
        C -->|Sí| D[Router por Rol]
        
        D --> E[Dashboard Admin]
        D --> F[Dashboard Asesor]
        D --> G[Dashboard Mensajero]
        
        E --> H[Gestión Completa]
        F --> I[Gestión por Empresa]
        G --> J[Gestión Personal]
    end
    
    subgraph "Mock API Layer"
        K[Mock API] --> L[Usuarios]
        K --> M[Pedidos]
        K --> N[Inventario]
        K --> O[Logística Externa]
        K --> P[Gestión de Rutas]
        K --> Q[Liquidaciones]
    end
    
    subgraph "Tipos de Datos"
        R[UserRole] --> S[admin, asesor, mensajero]
        T[OrderStatus] --> U[pendiente, confirmado, en_ruta, entregado, devolucion, reagendado]
        V[PaymentMethod] --> W[efectivo, sinpe]
        X[DeliveryMethod] --> Y[mensajeria_propia, red_logistic, correos_costa_rica]
    end
    
    H --> K
    I --> K
    J --> K
```

## 2. Flujo de Autenticación y Roles

```mermaid
flowchart TD
    A[Usuario accede a la app] --> B[Página de Login]
    B --> C[Ingresa credenciales]
    C --> D[AuthContext valida]
    D --> E{¿Credenciales válidas?}
    E -->|No| F[Muestra error]
    F --> B
    E -->|Sí| G[Obtiene rol del usuario]
    
    G --> H{¿Qué rol?}
    H -->|admin| I[Dashboard Admin]
    H -->|asesor| J[Dashboard Asesor]
    H -->|mensajero| K[Dashboard Mensajero]
    
    I --> L[Acceso completo a todas las funcionalidades]
    J --> M[Acceso limitado a su empresa]
    K --> N[Acceso solo a sus pedidos y rutas]
    
    L --> O[Puede gestionar usuarios, empresas, inventario global]
    M --> P[Puede gestionar pedidos e inventario de su empresa]
    N --> Q[Puede ver sus pedidos asignados y gestionar gastos]
```

## 3. Estructura de Roles y Permisos

```mermaid
graph LR
    subgraph "ADMINISTRADOR"
        A1[Dashboard General]
        A2[Gestión de Pedidos]
        A3[Gestión de Inventario Global]
        A4[Logística Externa]
        A5[Gestión de Rutas]
        A6[Liquidaciones]
        A7[Gestión de Usuarios]
        A8[Gestión de Empresas]
        A9[Estadísticas Globales]
    end
    
    subgraph "ASESOR"
        B1[Dashboard Empresarial]
        B2[Gestión de Pedidos de su Empresa]
        B3[Inventario de su Empresa]
        B4[Logística Externa de su Empresa]
        B5[Estadísticas de su Empresa]
    end
    
    subgraph "MENSAJERO"
        C1[Dashboard Personal]
        C2[Mis Pedidos Asignados]
        C3[Historial de Rutas]
        C4[Gestión de Gastos]
        C5[Perfil Personal]
    end
```

## 4. Flujo de Gestión de Pedidos

```mermaid
flowchart TD
    A[Nuevo Pedido] --> B{¿Cómo se crea?}
    B -->|Manual| C[Formulario de Pedido]
    B -->|CSV| D[Subida de Archivo CSV]
    B -->|Shopify| E[Integración Externa]
    
    C --> F[Validación de Datos]
    D --> G[Procesamiento CSV]
    E --> H[Sincronización Automática]
    
    F --> I[Estado: Pendiente]
    G --> J[Validación de Productos]
    H --> K[Estado: Confirmado]
    
    J --> L{¿Productos encontrados?}
    L -->|Sí| M[Estado: Confirmado]
    L -->|No| N[Tabla de Mapeo de Productos]
    N --> O[Usuario mapea productos]
    O --> M
    
    M --> P[Asignación a Mensajero]
    P --> Q[Estado: En Ruta]
    Q --> R[Entrega]
    R --> S{¿Entrega exitosa?}
    S -->|Sí| T[Estado: Entregado]
    S -->|No| U[Estado: Devuelto/Reagendado]
    
    T --> V[Actualización de Inventario]
    U --> W[Reasignación o Reprogramación]
```

## 5. Sistema de Gestión de Rutas

```mermaid
flowchart TD
    A[Selección de Fecha] --> B[Obtener Pedidos del Día]
    B --> C[Agrupar por Cantones]
    C --> D[Mapear a Rutas Reales]
    D --> E[Asignar Mensajeros por Ruta]
    
    E --> F[Crear Grupos de 30 Pedidos]
    F --> G[Distribución Rotativa de Mensajeros]
    G --> H[Generar Asignaciones]
    
    H --> I[Verificar Completitud]
    I --> J{¿Todos tienen 30 pedidos?}
    J -->|Sí| K[Asignaciones Completas]
    J -->|No| L[Identificar Pedidos No Asignados]
    
    K --> M[Crear Ruta]
    L --> N[Reasignar o Reportar]
    
    M --> O[Notificar a Mensajeros]
    O --> P[Seguimiento en Tiempo Real]
    P --> Q[Liquidación al Final del Día]
```

## 6. Sistema de Inventario

```mermaid
flowchart TD
    A[Gestión de Inventario] --> B{¿Qué rol?}
    B -->|Admin| C[Inventario Global]
    B -->|Asesor| D[Inventario de Empresa]
    
    C --> E[Ver Todos los Productos]
    D --> F[Ver Productos de su Empresa]
    
    E --> G[Operaciones de Inventario]
    F --> G
    
    G --> H[Crear Producto]
    G --> I[Actualizar Stock]
    G --> J[Ajustar Inventario]
    G --> K[Ver Historial]
    
    H --> L[Validación de Datos]
    I --> M[Verificación de Disponibilidad]
    J --> N[Registro de Motivo]
    K --> O[Filtros por Fecha/Usuario]
    
    L --> P[Producto Creado]
    M --> Q[Stock Actualizado]
    N --> R[Ajuste Registrado]
    O --> S[Historial Mostrado]
    
    P --> T[Notificación de Cambio]
    Q --> T
    R --> T
    S --> U[Análisis de Tendencias]
```

## 7. Sistema de Logística Externa

```mermaid
flowchart TD
    A[Pedido con Logística Externa] --> B[Crear Orden de Envío]
    B --> C[Asignar Número de Tracking]
    C --> D[Estado: Pendiente Envío]
    
    D --> E[Enviar a Centro de Distribución]
    E --> F[Estado: Enviado]
    F --> G[En Tránsito]
    G --> H[Estado: En Tránsito]
    
    H --> I[Entrega en Destino]
    I --> J{¿Entrega exitosa?}
    J -->|Sí| K[Estado: Entregado]
    J -->|No| L[Estado: Devuelto]
    
    K --> M[Actualizar Inventario]
    L --> N[Procesar Devolución]
    
    M --> O[Notificar Cliente]
    N --> P[Reintegrar a Inventario]
    
    O --> Q[Confirmación de Entrega]
    P --> R[Producto Disponible Nuevamente]
```

## 8. Flujo de Liquidación de Rutas

```mermaid
flowchart TD
    A[Final del Día] --> B[Mensajero Inicia Liquidación]
    B --> C[Seleccionar Ruta del Día]
    C --> D[Ver Pedidos Asignados]
    
    D --> E[Registrar Entregas]
    E --> F[Registrar Devoluciones]
    F --> G[Registrar Reagendamientos]
    
    G --> H[Calcular Totales]
    H --> I[Efectivo Recibido]
    H --> J[SINPE Recibido]
    H --> K[Pagos con Tarjeta]
    
    I --> L[Sumar Gastos de Ruta]
    J --> L
    K --> L
    
    L --> M[Registrar Gastos con Imágenes]
    M --> N[Combustible]
    M --> O[Alimentación]
    M --> P[Peajes]
    M --> Q[Mantenimiento]
    M --> R[Otros]
    
    N --> S[Calcular Liquidación Final]
    O --> S
    P --> S
    Q --> S
    R --> S
    
    S --> T[Enviar para Aprobación]
    T --> U[Admin Revisa]
    U --> V{¿Aprobado?}
    V -->|Sí| W[Liquidación Aprobada]
    V -->|No| X[Devolver para Corrección]
    
    W --> Y[Pago Procesado]
    X --> B
```

## 9. Estructura de Datos Principal

```mermaid
erDiagram
    USER ||--o{ ORDER : creates
    USER ||--o{ INVENTORY_TRANSACTION : performs
    USER ||--o{ ROUTE_ASSIGNMENT : assigned_to
    USER ||--o{ ROUTE_EXPENSE : creates
    
    COMPANY ||--o{ USER : employs
    COMPANY ||--o{ ORDER : receives
    
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ INVENTORY_TRANSACTION : generates
    
    INVENTORY_ITEM ||--o{ INVENTORY_TRANSACTION : involved_in
    INVENTORY_ITEM ||--o{ ORDER_ITEM : referenced_by
    
    ROUTE_ASSIGNMENT ||--o{ ORDER : includes
    ROUTE_ASSIGNMENT ||--o{ ROUTE_EXPENSE : has
    
    DAILY_ROUTE ||--o{ ROUTE_EXPENSE : contains
    
    USER {
        string id PK
        string email
        string name
        string role
        string phone
        string avatar
        datetime createdAt
        boolean isActive
        string companyId FK
    }
    
    COMPANY {
        string id PK
        string name
        string taxId
        string address
        string phone
        string email
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    ORDER {
        string id PK
        string customerName
        string customerPhone
        string customerAddress
        string customerCanton
        decimal totalAmount
        string status
        string paymentMethod
        string origin
        datetime createdAt
        datetime updatedAt
        string advisorId FK
        string assignedMessengerId FK
        string companyId FK
    }
    
    INVENTORY_ITEM {
        string id PK
        string name
        string sku
        string description
        string category
        decimal currentStock
        decimal minStock
        decimal maxStock
        decimal unitCost
        decimal unitPrice
        string companyId FK
        datetime createdAt
        datetime updatedAt
    }
    
    ROUTE_ASSIGNMENT {
        string id PK
        string routeDate
        string messengerId FK
        int totalOrders
        int assignedOrders
        int unassignedOrders
        string status
        datetime createdAt
        datetime updatedAt
        string companyId FK
    }
```

## 10. Flujo de Navegación por Roles

```mermaid
graph TD
    A[Login] --> B{Seleccionar Rol}
    
    B -->|Admin| C[Dashboard Admin]
    C --> D[Pedidos]
    C --> E[Inventario]
    C --> F[Logística Externa]
    C --> G[Gestión de Rutas]
    C --> H[Liquidaciones]
    C --> I[Usuarios]
    C --> J[Empresas]
    C --> K[Estadísticas]
    
    B -->|Asesor| L[Dashboard Asesor]
    L --> M[Pedidos de Empresa]
    L --> N[Inventario de Empresa]
    L --> O[Logística Externa de Empresa]
    L --> P[Estadísticas de Empresa]
    
    B -->|Mensajero| Q[Dashboard Mensajero]
    Q --> R[Mis Pedidos]
    Q --> S[Historial de Rutas]
    Q --> T[Gestión de Gastos]
    Q --> U[Mi Perfil]
    
    D --> V[Crear Pedido]
    D --> W[Ver Detalles]
    D --> X[Actualizar Estado]
    
    E --> Y[Ver Productos]
    E --> Z[Crear Producto]
    E --> AA[Ajustar Stock]
    
    G --> BB[Crear Ruta]
    G --> CC[Asignar Pedidos]
    G --> DD[Ver Estadísticas]
    
    R --> EE[Ver Pedidos Asignados]
    R --> FF[Actualizar Estado]
    R --> GG[Registrar Gastos]
```

## 11. Sistema de Notificaciones y Alertas

```mermaid
flowchart TD
    A[Evento del Sistema] --> B{¿Qué tipo de evento?}
    
    B -->|Stock Bajo| C[Alerta de Inventario]
    B -->|Pedido Creado| D[Notificación de Pedido]
    B -->|Entrega Completada| E[Confirmación de Entrega]
    B -->|Ruta Asignada| F[Notificación de Ruta]
    B -->|Liquidación Pendiente| G[Recordatorio de Liquidación]
    
    C --> H[Verificar Stock Mínimo]
    H --> I[Mostrar Alerta en Dashboard]
    I --> J[Notificar a Asesor/Admin]
    
    D --> K[Asignar a Mensajero]
    K --> L[Notificar a Mensajero]
    
    E --> M[Actualizar Inventario]
    M --> N[Notificar a Cliente]
    
    F --> O[Mostrar en Dashboard de Mensajero]
    O --> P[Enviar Recordatorio]
    
    G --> Q[Mostrar en Dashboard]
    Q --> R[Enviar Recordatorio por Email]
```

## 12. Integración con Sistemas Externos

```mermaid
graph LR
    subgraph "MagicStars Frontend"
        A[Next.js App]
        B[Mock API Layer]
        C[Auth Context]
        D[State Management]
    end
    
    subgraph "Integraciones Futuras"
        E[Shopify API]
        F[Correos de Costa Rica API]
        G[Red Logística API]
        H[Payment Gateway]
        I[Email Service]
        J[SMS Service]
    end
    
    subgraph "Base de Datos"
        K[PostgreSQL]
        L[Redis Cache]
        M[File Storage]
    end
    
    A --> B
    B --> E
    B --> F
    B --> G
    B --> H
    B --> I
    B --> J
    
    B --> K
    B --> L
    B --> M
    
    E --> N[Productos y Pedidos]
    F --> O[Tracking de Envíos]
    G --> P[Gestión de Logística]
    H --> Q[Procesamiento de Pagos]
    I --> R[Notificaciones por Email]
    J --> S[Notificaciones por SMS]
```

## 13. Flujo de Desarrollo y Despliegue

```mermaid
flowchart TD
    A[Desarrollo Local] --> B[Git Commit]
    B --> C[Push to Repository]
    C --> D[CI/CD Pipeline]
    D --> E[Build Application]
    E --> F[Run Tests]
    F --> G{Tests Pass?}
    G -->|No| H[Fix Issues]
    H --> A
    G -->|Yes| I[Deploy to Staging]
    I --> J[Staging Tests]
    J --> K{Staging OK?}
    K -->|No| L[Rollback]
    L --> H
    K -->|Yes| M[Deploy to Production]
    M --> N[Production Monitoring]
    N --> O[Health Checks]
    O --> P{System Healthy?}
    P -->|No| Q[Alert Team]
    P -->|Yes| R[Deployment Complete]
```

## 14. Métricas y Monitoreo

```mermaid
graph TD
    A[Sistema en Producción] --> B[Métricas de Aplicación]
    A --> C[Métricas de Negocio]
    A --> D[Métricas de Usuario]
    
    B --> E[Performance]
    B --> F[Errores]
    B --> G[Uso de Recursos]
    
    C --> H[Pedidos por Día]
    C --> I[Entregas Exitosas]
    C --> J[Ingresos]
    C --> K[Eficiencia de Rutas]
    
    D --> L[Usuarios Activos]
    D --> M[Tiempo de Sesión]
    D --> N[Funcionalidades Más Usadas]
    D --> O[Feedback de Usuarios]
    
    E --> P[Dashboard de Monitoreo]
    F --> P
    G --> P
    H --> P
    I --> P
    J --> P
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P
    
    P --> Q[Alertas Automáticas]
    P --> R[Reportes Periódicos]
    P --> S[Análisis de Tendencias]
```

## 15. Arquitectura de Seguridad

```mermaid
graph TD
    A[Usuario] --> B[Frontend]
    B --> C[AuthContext]
    C --> D[Validación de Token]
    D --> E{Token Válido?}
    E -->|No| F[Redirect to Login]
    E -->|Sí| G[Verificar Permisos]
    G --> H{¿Tiene Permiso?}
    H -->|No| I[Acceso Denegado]
    H -->|Sí| J[Acceso Permitido]
    
    J --> K[API Layer]
    K --> L[Validación de Datos]
    L --> M[Sanitización de Inputs]
    M --> N[Rate Limiting]
    N --> O[Logging de Acciones]
    O --> P[Respuesta Segura]
    
    subgraph "Medidas de Seguridad"
        Q[HTTPS Everywhere]
        R[JWT Tokens]
        S[Role-Based Access Control]
        T[Input Validation]
        U[SQL Injection Prevention]
        V[XSS Protection]
        W[CSRF Protection]
    end
    
    B --> Q
    C --> R
    G --> S
    L --> T
    K --> U
    B --> V
    B --> W
```

---

## Resumen de Funcionalidades por Rol

### **Administrador**
- ✅ Gestión completa de usuarios y empresas
- ✅ Vista global de todos los pedidos e inventario
- ✅ Gestión de rutas y asignación de mensajeros
- ✅ Liquidaciones y reportes financieros
- ✅ Estadísticas globales del sistema

### **Asesor**
- ✅ Gestión de pedidos de su empresa
- ✅ Control de inventario de su empresa
- ✅ Logística externa para su empresa
- ✅ Estadísticas de su empresa

### **Mensajero**
- ✅ Visualización de pedidos asignados
- ✅ Gestión de gastos de ruta
- ✅ Historial de rutas y entregas
- ✅ Perfil personal y actualización de datos

---

*Estos diagramas representan la arquitectura completa y los flujos de uso de la aplicación MagicStars Frontend, mostrando cómo interactúan los diferentes componentes y roles del sistema.*
