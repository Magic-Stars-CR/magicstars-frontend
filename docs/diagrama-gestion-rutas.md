# Diagrama de Gestión de Rutas - Sistema de 30 Pedidos por Mensajero

## 1. Flujo Principal de Gestión de Rutas

```mermaid
flowchart TD
    A[Admin accede a Gestión de Rutas] --> B[Selecciona Fecha]
    B --> C[Obtener Pedidos del Día]
    C --> D[Filtrar por Empresa si es necesario]
    
    D --> E[Agrupar Pedidos por Cantones]
    E --> F[Mapear Cantones a Rutas Reales]
    F --> G[Obtener Mensajeros Disponibles]
    
    G --> H[Crear Grupos de 30 Pedidos]
    H --> I[Asignar Mensajeros Rotativamente]
    I --> J[Verificar Distribución]
    
    J --> K{¿Todos los grupos tienen 30 pedidos?}
    K -->|Sí| L[Crear Asignaciones]
    K -->|No| M[Ajustar Distribución]
    M --> H
    
    L --> N[Mostrar Resumen de Asignaciones]
    N --> O[Admin Revisa y Aprueba]
    O --> P[Crear Rutas Finales]
    P --> Q[Notificar a Mensajeros]
```

## 2. Mapeo de Cantones a Rutas Reales

```mermaid
graph TD
    subgraph "Rutas de Costa Rica"
        A[AL1 - Alajuela] --> A1[₡2,500 por mensajero]
        B[CT1 - Cartago] --> B1[₡2,500 por mensajero]
        C[H1 - Heredia] --> C1[₡2,500 por mensajero]
        D[SJ1 - San José Centro] --> D1[₡2,000 por mensajero]
        E[SJ2 - San José Norte] --> E1[₡2,000 por mensajero]
        F[SJ3 - San José Sur] --> F1[₡2,000 por mensajero]
        G[SJ4 - San José Este] --> G1[₡2,000 por mensajero]
        H[SJ5 - San José Oeste] --> H1[₡2,000 por mensajero]
    end
    
    subgraph "Cantones Mapeados"
        I[ALAJUELA] --> A
        J[CARTAGO] --> B
        K[HEREDIA] --> C
        L[SAN JOSE] --> D
        M[SANTA ANA] --> H
        N[ESCAZU] --> H
        O[CURRIDABAT] --> E
        P[TIBAS] --> G
        Q[DESAMPARADOS] --> F
        R[ALAJUELITA] --> F
        S[ASERRI] --> F
        T[GOICOECHEA] --> E
        U[MONTES DE OCA] --> E
        V[MORA] --> H
        W[MORAVIA] --> E
        X[VAZQUEZ DE CORONADO] --> E
    end
```

## 3. Distribución de Mensajeros por Ruta

```mermaid
graph TD
    subgraph "Asignación de Mensajeros"
        A[AL1] --> A1[Juan Pérez]
        A --> A2[Luis González]
        
        B[CT1] --> B1[Carlos Rodríguez]
        B --> B2[Sofía Herrera]
        
        C[H1] --> C1[Miguel Torres]
        
        D[SJ1] --> D1[Juan Pérez]
        D --> D2[Laura Vargas]
        
        E[SJ2] --> E1[Luis González]
        E --> E2[Carlos Rodríguez]
        
        F[SJ3] --> F1[Sofía Herrera]
        F --> F2[Miguel Torres]
        
        G[SJ4] --> G1[Laura Vargas]
        
        H[SJ5] --> H1[Juan Pérez]
        H --> H2[Luis González]
    end
```

## 4. Proceso de Creación de Grupos de 30 Pedidos

```mermaid
flowchart TD
    A[Pedidos del Día] --> B[Contar Total de Pedidos]
    B --> C[Calcular Grupos Necesarios]
    C --> D[Total Pedidos ÷ 30 = Grupos]
    
    D --> E[Crear Array de Grupos]
    E --> F[Para cada grupo de 30 pedidos]
    
    F --> G[Tomar 30 pedidos consecutivos]
    G --> H[Identificar Ruta Principal del Grupo]
    H --> I[Asignar Mensajero de la Ruta]
    I --> J[Crear Grupo con Datos Completos]
    
    J --> K{¿Hay más pedidos?}
    K -->|Sí| F
    K -->|No| L[Verificar Distribución]
    
    L --> M{¿Todos los grupos tienen 30 pedidos?}
    M -->|Sí| N[Asignaciones Completas]
    M -->|No| O[Último grupo puede tener menos de 30]
    
    N --> P[Crear Asignaciones Finales]
    O --> P
    P --> Q[Mostrar Resumen]
```

## 5. Interfaz de Usuario - Pestañas de Gestión

```mermaid
graph TD
    A[Página de Gestión de Rutas] --> B[Pestaña: Pedidos]
    A --> C[Pestaña: Rutas]
    A --> D[Pestaña: Asignaciones]
    A --> E[Pestaña: Rutas Disponibles]
    A --> F[Pestaña: Estadísticas]
    
    B --> B1[Lista de Pedidos del Día]
    B --> B2[Filtros por Empresa/Fecha]
    B --> B3[Información de Cliente]
    
    C --> C1[Grupos de 30 Pedidos]
    C --> C2[Mensajero Asignado]
    C --> C3[Estado de Completitud]
    C --> C4[Progreso Visual]
    
    D --> D1[Asignaciones por Mensajero]
    D --> D2[Progreso 30/30]
    D --> D3[Estadísticas de Entrega]
    D --> D4[Botón de Cambio]
    
    E --> E1[Información de Rutas]
    E --> E2[Zonas por Ruta]
    E --> E3[Pago por Mensajero]
    E --> E4[Mensajeros Asignados]
    
    F --> F1[Estadísticas de Mensajeros]
    F --> F2[Métricas de Eficiencia]
    F --> F3[Comparativas por Ruta]
    F --> F4[Reportes de Rendimiento]
```

## 6. Flujo de Asignación Automática

```mermaid
sequenceDiagram
    participant A as Admin
    participant S as Sistema
    participant M as Mock API
    participant D as Base de Datos
    
    A->>S: Selecciona fecha de ruta
    S->>M: getOrdersForRouteCreation(fecha)
    M->>D: Consultar pedidos del día
    D-->>M: Lista de pedidos
    M-->>S: Pedidos del día
    
    S->>M: groupOrdersByZone(pedidos)
    M->>M: Agrupar en lotes de 30
    M->>M: Asignar mensajeros rotativamente
    M-->>S: Grupos de pedidos
    
    S->>M: assignOrdersToMessengers(fecha)
    M->>M: Crear asignaciones
    M->>D: Guardar asignaciones
    D-->>M: Asignaciones creadas
    M-->>S: Resultado de asignación
    
    S->>A: Mostrar resumen de asignaciones
    A->>S: Revisar y aprobar
    S->>M: createRoute(datos)
    M->>D: Crear ruta final
    D-->>M: Ruta creada
    M-->>S: Confirmación
    S->>A: Ruta creada exitosamente
```

## 7. Validación y Verificación de Asignaciones

```mermaid
flowchart TD
    A[Asignaciones Creadas] --> B[Verificar Cada Asignación]
    B --> C{¿Mensajero tiene 30 pedidos?}
    C -->|Sí| D[✅ Asignación Válida]
    C -->|No| E[⚠️ Asignación Incompleta]
    
    D --> F[Mostrar Badge Verde]
    E --> G[Mostrar Badge Rojo]
    
    F --> H[Calcular Progreso 100%]
    G --> I[Calcular Progreso X/30]
    
    H --> J[Mostrar Barra de Progreso Completa]
    I --> K[Mostrar Barra de Progreso Parcial]
    
    J --> L[Permitir Crear Ruta]
    K --> M[Requerir Ajustes]
    
    M --> N[Reasignar Pedidos]
    N --> O[Verificar Nuevamente]
    O --> C
```

## 8. Estadísticas y Métricas por Mensajero

```mermaid
graph TD
    subgraph "Métricas de Mensajero"
        A[Pedidos Asignados: 30] --> B[Pedidos Entregados: 25]
        A --> C[Pedidos Pendientes: 3]
        A --> D[Pedidos Reagendados: 2]
        A --> E[Pedidos Devueltos: 0]
        
        B --> F[Efectividad: 83.3%]
        C --> G[Pendientes: 10%]
        D --> H[Reagendados: 6.7%]
        E --> I[Devueltos: 0%]
        
        F --> J[Efectivo: ₡450,000]
        F --> K[SINPE: ₡225,000]
        F --> L[Tarjeta: ₡0]
        
        J --> M[Total Recaudado: ₡675,000]
        K --> M
        L --> M
        
        M --> N[Gastos de Ruta: ₡15,000]
        N --> O[Liquidación Neta: ₡660,000]
    end
```

## 9. Flujo de Cambio de Asignación

```mermaid
flowchart TD
    A[Admin selecciona "Cambiar Asignación"] --> B[Mostrar Modal de Cambio]
    B --> C[Seleccionar Nuevo Mensajero]
    C --> D[Verificar Disponibilidad]
    
    D --> E{¿Mensajero disponible?}
    E -->|No| F[Mostrar Error]
    E -->|Sí| G[Confirmar Cambio]
    
    G --> H[Actualizar Asignación]
    H --> I[Notificar Mensajero Anterior]
    I --> J[Notificar Nuevo Mensajero]
    J --> K[Actualizar Estadísticas]
    K --> L[Refrescar Vista]
    
    F --> M[Volver a Selección]
    M --> C
```

## 10. Integración con Sistema de Liquidación

```mermaid
flowchart TD
    A[Ruta Creada] --> B[Mensajero Recibe Notificación]
    B --> C[Mensajero Inicia Día de Trabajo]
    C --> D[Entregar Pedidos Asignados]
    
    D --> E[Registrar Entregas Exitosas]
    D --> F[Registrar Devoluciones]
    D --> G[Registrar Reagendamientos]
    
    E --> H[Actualizar Estado de Pedidos]
    F --> H
    G --> H
    
    H --> I[Final del Día]
    I --> J[Mensajero Inicia Liquidación]
    J --> K[Registrar Gastos de Ruta]
    K --> L[Subir Comprobantes]
    L --> M[Calcular Totales]
    
    M --> N[Enviar Liquidación]
    N --> O[Admin Revisa]
    O --> P{¿Aprobado?}
    P -->|Sí| Q[Procesar Pago]
    P -->|No| R[Devolver para Corrección]
    
    Q --> S[Liquidación Completada]
    R --> J
```

## 11. Dashboard de Monitoreo en Tiempo Real

```mermaid
graph TD
    subgraph "Dashboard de Gestión de Rutas"
        A[Resumen del Día] --> A1[Total Pedidos: 180]
        A --> A2[Mensajeros Activos: 6]
        A --> A3[Asignaciones Completas: 6/6]
        A --> A4[Pedidos No Asignados: 0]
        
        B[Estado de Asignaciones] --> B1[Juan Pérez: 30/30 ✅]
        B --> B2[Luis González: 30/30 ✅]
        B --> B3[Carlos Rodríguez: 30/30 ✅]
        B --> B4[Sofía Herrera: 30/30 ✅]
        B --> B5[Miguel Torres: 30/30 ✅]
        B --> B6[Laura Vargas: 30/30 ✅]
        
        C[Métricas por Ruta] --> C1[AL1: 60 pedidos, 2 mensajeros]
        C --> C2[CT1: 60 pedidos, 2 mensajeros]
        C --> C3[H1: 30 pedidos, 1 mensajero]
        C --> C4[SJ1: 30 pedidos, 2 mensajeros]
        
        D[Eficiencia del Sistema] --> D1[Distribución Equitativa: 100%]
        D --> D2[Cobertura Geográfica: 100%]
        D --> D3[Optimización de Rutas: 95%]
    end
```

## 12. Flujo de Error y Recuperación

```mermaid
flowchart TD
    A[Error en Asignación] --> B{¿Qué tipo de error?}
    
    B -->|Mensajero No Disponible| C[Buscar Mensajero Alternativo]
    B -->|Pedidos Insuficientes| D[Notificar Admin]
    B -->|Error de Sistema| E[Log Error y Notificar]
    
    C --> F{¿Hay alternativo?}
    F -->|Sí| G[Reasignar Automáticamente]
    F -->|No| H[Crear Grupo Incompleto]
    
    D --> I[Mostrar Alerta]
    I --> J[Admin Decide Acción]
    J --> K[Agregar Más Pedidos]
    J --> L[Reducir Asignación]
    
    E --> M[Mostrar Error Técnico]
    M --> N[Intentar Recuperación]
    N --> O{¿Recuperación exitosa?}
    O -->|Sí| P[Continuar Proceso]
    O -->|No| Q[Contactar Soporte]
    
    G --> R[Actualizar Asignación]
    H --> S[Marcar como Incompleto]
    K --> T[Reintentar Asignación]
    L --> U[Confirmar Reducción]
    P --> V[Proceso Completado]
    Q --> W[Proceso Fallido]
```

---

## Resumen del Sistema de Gestión de Rutas

### **Características Principales**
- ✅ **30 pedidos por mensajero**: Distribución equitativa y predecible
- ✅ **Rutas reales de Costa Rica**: Mapeo geográfico preciso
- ✅ **Asignación automática**: Sistema inteligente de distribución
- ✅ **Monitoreo en tiempo real**: Seguimiento completo del progreso
- ✅ **Gestión de errores**: Recuperación automática y manual
- ✅ **Integración completa**: Con liquidaciones y estadísticas

### **Beneficios Operacionales**
- 🎯 **Eficiencia logística**: Optimización basada en geografía real
- 📊 **Control total**: Visibilidad completa del proceso
- ⚡ **Automatización**: Reducción de trabajo manual
- 🔄 **Escalabilidad**: Fácil adaptación a más mensajeros
- 💰 **Optimización de costos**: Distribución eficiente de recursos

*Este sistema garantiza que cada mensajero tenga exactamente 30 pedidos asignados, proporcionando una gestión logística eficiente y predecible.*
