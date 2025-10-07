import { createClient } from '@/utils/supabase/client';
import { PedidoTest } from './types';

// Cliente de Supabase para pedidos (usando la configuración oficial)
export const supabasePedidos = createClient();

// Función para obtener pedidos con paginación
export const getPedidos = async (page: number = 1, pageSize: number = 50): Promise<{ data: PedidoTest[], total: number, page: number, pageSize: number, totalPages: number }> => {
  try {
    console.log(`🔍 Obteniendo página ${page} con ${pageSize} registros por página...`);
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Obtener el conteo total primero
    const { count, error: countError } = await supabasePedidos
      .from('pedidos')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error al obtener conteo:', countError);
      throw new Error(`Error de conteo: ${countError.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Obtener los datos de la página actual
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .order('fecha_creacion', { ascending: false }) // Ordenar por fecha más reciente primero
      .range(from, to);

    if (error) {
      console.error('❌ Error al obtener pedidos:', error);
      throw new Error(`Error de Supabase: ${error.message}`);
    }

    console.log(`✅ Página ${page}/${totalPages} obtenida: ${data?.length || 0} registros de ${total} total`);

    return {
      data: data || [],
      total,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('❌ Error en getPedidos:', error);
    throw error;
  }
};

// Función para obtener todos los pedidos (para filtros y estadísticas)
export const getAllPedidos = async (): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Obteniendo todos los pedidos para filtros...');
    
    let allPedidos: PedidoTest[] = [];
    let from = 0;
    const pageLimit = 1000;
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 Obteniendo página ${Math.floor(from / pageLimit) + 1}...`);
      
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .order('fecha_creacion', { ascending: false })
        .range(from, from + pageLimit - 1);

      if (error) {
        console.error('❌ Error al obtener pedidos:', error);
        return allPedidos;
      }

      if (data && data.length > 0) {
        allPedidos = [...allPedidos, ...data];
        from += pageLimit;
        hasMore = data.length === pageLimit;
        console.log(`📦 Página obtenida: ${data.length} registros. Total acumulado: ${allPedidos.length}`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Total de pedidos obtenidos: ${allPedidos.length}`);
    return allPedidos;
  } catch (error) {
    console.error('❌ Error en getAllPedidos:', error);
    return [];
  }
};

// Función para obtener pedidos por distrito
export const getPedidosByDistrito = async (distrito: string): Promise<PedidoTest[]> => {
  try {
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .eq('distrito', distrito);

    if (error) {
      console.error('Error al obtener pedidos por distrito:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en getPedidosByDistrito:', error);
    throw error;
  }
};

// Función para obtener pedidos por ID
export const getPedidoById = async (id: string): Promise<PedidoTest | null> => {
  try {
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .eq('id_pedido', id)
      .single();

    if (error) {
      console.error('Error al obtener pedido por ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getPedidoById:', error);
    return null;
  }
};

// Función para obtener pedidos por mensajero (tanto asignado como concretado)
export const getPedidosByMensajero = async (mensajeroName: string): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Buscando pedidos para mensajero:', mensajeroName);
    console.log('🔍 Tipo de dato del nombre:', typeof mensajeroName);
    console.log('🔍 Longitud del nombre:', mensajeroName?.length);
    console.log('🔍 Búsqueda en campos: mensajero_asignado y mensajero_concretado');
    
    // Buscar pedidos donde el mensajero esté asignado O concretado (insensible a mayúsculas)
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`);

    console.log('📊 Resultado de la consulta por mensajero:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Cantidad de pedidos encontrados:', data?.length || 0);

    if (error) {
      console.error('❌ Error al obtener pedidos por mensajero:', error);
      throw error;
    }

    // Si no hay pedidos específicos, devolver todos los pedidos para testing
    if (!data || data.length === 0) {
      console.log('⚠️ No hay pedidos asignados o concretados por', mensajeroName);
      console.log('🔄 Obteniendo todos los pedidos para testing...');
      
      const { data: allData, error: allError } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .limit(10); // Limitar a 10 pedidos para testing
      
      if (allError) {
        console.error('❌ Error al obtener todos los pedidos:', allError);
        return [];
      }
      
      console.log('📦 Pedidos obtenidos para testing:', allData?.length || 0);
      return allData || [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getPedidosByMensajero:', error);
    // En caso de error, devolver array vacío en lugar de lanzar excepción
    return [];
  }
};

// Función para normalizar datos de pedidos a mayúsculas
const normalizePedidoData = (pedido: any): PedidoTest => {
  // Normalizar estados específicos
  const estadoNormalizado = pedido.estado_pedido ? 
    (pedido.estado_pedido.toUpperCase().trim() === 'REAGENDO' ? 'REAGENDADO' : 
     pedido.estado_pedido.toUpperCase().trim() === 'ENTREGADO' ? 'ENTREGADO' :
     pedido.estado_pedido.toUpperCase().trim() === 'DEVOLUCION' ? 'DEVOLUCION' :
     pedido.estado_pedido.toUpperCase().trim() === 'PENDIENTE' ? 'PENDIENTE' :
     pedido.estado_pedido.toUpperCase().trim()) : 'PENDIENTE';

  // Normalizar métodos de pago específicos
  const metodoNormalizado = pedido.metodo_pago ? 
    (pedido.metodo_pago.toUpperCase().trim() === 'EFECTIVO' ? 'EFECTIVO' :
     pedido.metodo_pago.toUpperCase().trim() === 'SINPE' ? 'SINPE' :
     pedido.metodo_pago.toUpperCase().trim() === 'TARJETA' ? 'TARJETA' :
     pedido.metodo_pago.toUpperCase().trim() === '2PAGOS' ? '2PAGOS' :
     pedido.metodo_pago.toUpperCase().trim()) : 'SIN_METODO';

  return {
    ...pedido,
    estado_pedido: estadoNormalizado,
    metodo_pago: metodoNormalizado,
    mensajero_asignado: pedido.mensajero_asignado ? pedido.mensajero_asignado.toUpperCase().trim() : null,
    mensajero_concretado: pedido.mensajero_concretado ? pedido.mensajero_concretado.toUpperCase().trim() : null,
    tienda: pedido.tienda ? pedido.tienda.toUpperCase().trim() : 'SIN_TIENDA',
    provincia: pedido.provincia ? pedido.provincia.toUpperCase().trim() : 'SIN_PROVINCIA',
    canton: pedido.canton ? pedido.canton.toUpperCase().trim() : 'SIN_CANTON',
    distrito: pedido.distrito ? pedido.distrito.toUpperCase().trim() : 'SIN_DISTRITO',
    cliente_nombre: pedido.cliente_nombre ? pedido.cliente_nombre.toUpperCase().trim() : 'SIN_NOMBRE',
    valor_total: pedido.valor_total ? Number(pedido.valor_total) : 0
  };
};

// Función helper para obtener la fecha actual en zona horaria de Costa Rica
const getCostaRicaDate = () => {
  const now = new Date();
  console.log('🔍 Fecha del sistema (Supabase):', now);
  console.log('🔍 Año del sistema (Supabase):', now.getFullYear());
  console.log('🔍 Zona horaria del sistema (Supabase):', Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Costa Rica está en GMT-6 (UTC-6)
  const costaRicaOffset = -6 * 60; // -6 horas en minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const costaRicaTime = new Date(utc + (costaRicaOffset * 60000));
  
  console.log('📅 Fecha para Costa Rica GMT-6 (Supabase):', costaRicaTime);
  console.log('📅 Año para Costa Rica (Supabase):', costaRicaTime.getFullYear());
  console.log('📅 Zona horaria aplicada (Supabase): GMT-6 (Costa Rica)');
  
  return costaRicaTime;
};

// Función helper para obtener la fecha ISO en zona horaria de Costa Rica
export const getCostaRicaDateISO = () => {
  const costaRicaDate = getCostaRicaDate();
  const year = costaRicaDate.getFullYear();
  const month = String(costaRicaDate.getMonth() + 1).padStart(2, '0');
  const day = String(costaRicaDate.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;
  
  console.log('📅 Fecha ISO para Costa Rica (Supabase):', isoDate);
  return isoDate;
};

// Función para obtener pedidos del día por tienda
export const getPedidosDelDiaByTienda = async (tienda: string, fecha?: string): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Buscando pedidos del día para tienda:', tienda);
    
    // Usar la fecha proporcionada o la fecha actual en zona horaria de Costa Rica
    const targetDate = fecha || getCostaRicaDateISO();
    console.log('📅 Fecha objetivo:', targetDate);
    console.log('📅 Fecha actual UTC:', new Date().toISOString());
    console.log('📅 Fecha actual Costa Rica:', getCostaRicaDate().toISOString());
    console.log('📅 Fecha ISO Costa Rica:', getCostaRicaDateISO());
    
    // Obtener todos los pedidos usando paginación para evitar el límite de 1000
    let allPedidos: PedidoTest[] = [];
    let from = 0;
    const limit = 1000; // Límite por página
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 Obteniendo página ${Math.floor(from / limit) + 1} (registros ${from} a ${from + limit - 1})...`);
      
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .eq('tienda', tienda)
        .eq('fecha_creacion', targetDate)
        .range(from, from + limit - 1)
        .order('id_pedido', { ascending: true });

      if (error) {
        console.error('❌ Error al obtener pedidos por tienda:', error);
        return allPedidos; // Devolver lo que tengamos hasta ahora
      }

      if (data && data.length > 0) {
        allPedidos = [...allPedidos, ...data];
        from += limit;
        hasMore = data.length === limit; // Si obtenemos menos registros que el límite, no hay más páginas
        console.log(`📦 Página obtenida: ${data.length} registros. Total acumulado: ${allPedidos.length}`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Pedidos encontrados para ${tienda}:`, allPedidos.length);
    return allPedidos;
  } catch (error) {
    console.error('❌ Error en getPedidosDelDiaByTienda:', error);
    return [];
  }
};

// Función para obtener pedidos del día actual por mensajero (tanto asignado como concretado)
export const getPedidosDelDiaByMensajero = async (mensajeroName: string, fecha?: string): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 getPedidosDelDiaByMensajero INICIADA');
    console.log('👤 Mensajero:', mensajeroName);
    console.log('📅 Fecha recibida:', fecha);
    
    // Usar la fecha proporcionada o la fecha actual en zona horaria de Costa Rica
    const targetDate = fecha || getCostaRicaDateISO();
    console.log('📅 Fecha objetivo final:', targetDate);
    
    // Obtener todos los pedidos usando paginación para evitar el límite de 1000
    let allPedidos: PedidoTest[] = [];
    let from = 0;
    const limit = 1000; // Límite por página
    let hasMore = true;

    while (hasMore) {
      console.log(`🔄 Consultando página ${Math.floor(from / limit) + 1} para ${mensajeroName}...`);
      console.log(`📅 Fecha objetivo: ${targetDate}`);
      
      // DEBUGGING SIMPLIFICADO: Verificar si hay pedidos para este mensajero
      if (from === 0) {
        console.log('🔍 Verificando pedidos para', mensajeroName, 'en fecha', targetDate);
        
        // Probar consulta simple con eq
        const { data: testData, error: testError } = await supabasePedidos
          .from('pedidos')
          .select('id_pedido, fecha_creacion, mensajero_asignado, mensajero_concretado')
          .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
          .eq('fecha_creacion', targetDate)
          .limit(5);
        
        console.log('🔍 Resultado con eq:', testData?.length || 0);
        if (testData && testData.length > 0) {
          console.log('🔍 Muestra de pedidos encontrados:', testData.map(p => ({
            id: p.id_pedido,
            fecha: p.fecha_creacion,
            asignado: p.mensajero_asignado,
            concretado: p.mensajero_concretado
          })));
        }
      }
      
      // CORRECCIÓN: Usar solo fecha, no hora, ya que los datos solo tienen fecha
      console.log('🔍 Usando solo fecha (sin hora):', targetDate);
      
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
        .eq('fecha_creacion', targetDate)
        .range(from, from + limit - 1)
        .order('id_pedido', { ascending: true });

      if (error) {
        console.error('❌ Error al obtener pedidos del día por mensajero:', error);
        console.error('❌ Query parameters:', {
          mensajero: mensajeroName,
          fecha: targetDate,
          from,
          limit
        });
        return allPedidos; // Devolver lo que tengamos hasta ahora
      }
      
      console.log(`📊 Datos obtenidos en página ${Math.floor(from / limit) + 1}:`, data?.length || 0);
      if (data && data.length > 0) {
        console.log(`📋 Muestra de pedidos:`, data.slice(0, 2).map(p => ({
          id: p.id_pedido,
          fecha: p.fecha_creacion,
          estado: p.estado_pedido,
          asignado: p.mensajero_asignado,
          concretado: p.mensajero_concretado
        })));
      }

      if (data && data.length > 0) {
        allPedidos = [...allPedidos, ...data];
        from += limit;
        hasMore = data.length === limit; // Si obtenemos menos registros que el límite, no hay más páginas
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ CONSULTA COMPLETADA`);
    console.log(`📊 Pedidos encontrados para ${mensajeroName} el ${targetDate}:`, allPedidos.length);
    if (allPedidos.length > 0) {
      console.log(`📋 Muestra:`, allPedidos.slice(0, 3).map(p => p.id_pedido));
    }

    return allPedidos;
  } catch (error) {
    console.error('❌ Error en getPedidosDelDiaByMensajero:', error);
    console.error('❌ Mensajero:', mensajeroName);
    console.error('❌ Fecha:', fecha);
    // En caso de error, devolver array vacío en lugar de lanzar excepción
    return [];
  }
};

// Función para probar búsqueda específica por "Anibal"
export const testBusquedaAnibal = async (): Promise<void> => {
  try {
    console.log('🧪 PRUEBA: Buscando específicamente por "Anibal"...');
    
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('id_pedido, mensajero_asignado, mensajero_concretado, fecha_creacion, cliente_nombre')
      .or('mensajero_asignado.ilike.Anibal,mensajero_concretado.ilike.Anibal')
      .limit(10);

    if (error) {
      console.error('❌ Error en búsqueda de Anibal:', error);
    } else {
      console.log('✅ Pedidos de Anibal encontrados:', data?.length || 0);
      console.log('📦 Datos:', data);
    }
  } catch (error) {
    console.error('❌ Error en testBusquedaAnibal:', error);
  }
};

// Función para buscar pedidos específicos por ID
export const buscarPedidosEspecificos = async (): Promise<void> => {
  try {
    console.log('🔍 BUSCANDO PEDIDOS ESPECÍFICOS: VT5851 y WS3057...');
    
    // Buscar VT5851
    const { data: vt5851, error: error1 } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .eq('id_pedido', 'VT5851');

    console.log('🔍 Resultado VT5851:');
    console.log('Data:', vt5851);
    console.log('Error:', error1);
    console.log('Encontrado:', vt5851?.length || 0);

    // Buscar WS3057
    const { data: ws3057, error: error2 } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .eq('id_pedido', 'WS3057');

    console.log('🔍 Resultado WS3057:');
    console.log('Data:', ws3057);
    console.log('Error:', error2);
    console.log('Encontrado:', ws3057?.length || 0);

    // Buscar por fecha 2025-09-17
    console.log('🔍 BUSCANDO TODOS LOS PEDIDOS DEL 2025-09-17...');
    const { data: pedidosFecha, error: error3 } = await supabasePedidos
      .from('pedidos')
      .select('id_pedido, mensajero_asignado, mensajero_concretado, fecha_creacion, cliente_nombre')
      .eq('fecha_creacion', '2025-09-17')
      .limit(20);

    console.log('🔍 Resultado pedidos 2025-09-17:');
    console.log('Data:', pedidosFecha);
    console.log('Error:', error3);
    console.log('Encontrados:', pedidosFecha?.length || 0);

  } catch (error) {
    console.error('❌ Error en buscarPedidosEspecificos:', error);
  }
};

// Función para debuggear nombres de mensajeros en la base de datos
export const debugMensajeros = async (): Promise<void> => {
  try {
    console.log('🔍 DEBUG: Obteniendo nombres únicos de mensajeros...');
    
    // Obtener nombres únicos de mensajero_asignado
    const { data: asignados, error: errorAsignados } = await supabasePedidos
      .from('pedidos')
      .select('mensajero_asignado')
      .not('mensajero_asignado', 'is', null);
    
    // Obtener nombres únicos de mensajero_concretado
    const { data: concretados, error: errorConcretados } = await supabasePedidos
      .from('pedidos')
      .select('mensajero_concretado')
      .not('mensajero_concretado', 'is', null);

    if (errorAsignados) {
      console.error('❌ Error al obtener mensajeros asignados:', errorAsignados);
    } else {
      const nombresAsignados = Array.from(new Set(asignados?.map(p => p.mensajero_asignado) || []));
      console.log('📋 Mensajeros asignados únicos:', nombresAsignados);
    }

    if (errorConcretados) {
      console.error('❌ Error al obtener mensajeros concretados:', errorConcretados);
    } else {
      const nombresConcretados = Array.from(new Set(concretados?.map(p => p.mensajero_concretado) || []));
      console.log('📋 Mensajeros concretados únicos:', nombresConcretados);
    }

    // Buscar específicamente pedidos con "Anibal" para debug
    console.log('🔍 DEBUG: Buscando pedidos específicos con "Anibal"...');
    const { data: pedidosAnibal, error: errorAnibal } = await supabasePedidos
      .from('pedidos')
      .select('id_pedido, mensajero_asignado, mensajero_concretado, fecha_creacion')
      .or('mensajero_asignado.ilike.Anibal,mensajero_concretado.ilike.Anibal')
      .limit(5);

    if (errorAnibal) {
      console.error('❌ Error al buscar pedidos de Anibal:', errorAnibal);
    } else {
      console.log('📦 Pedidos encontrados con "Anibal":', pedidosAnibal);
    }
  } catch (error) {
    console.error('❌ Error en debugMensajeros:', error);
  }
};

// Función para obtener el conteo total de registros
export const getTotalPedidosCount = async (): Promise<number> => {
  try {
    console.log('🔢 Obteniendo conteo total de pedidos...');
    
    const { count, error } = await supabasePedidos
      .from('pedidos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error al obtener conteo de pedidos:', error);
      return 0;
    }

    console.log(`📊 Total de pedidos en la base de datos: ${count || 0}`);
    return count || 0;
  } catch (error) {
    console.error('❌ Error en getTotalPedidosCount:', error);
    return 0;
  }
};

// Función para obtener el conteo de pedidos por tienda y fecha
export const getPedidosCountByTienda = async (tienda: string, fecha?: string): Promise<number> => {
  try {
    console.log('🔢 Obteniendo conteo de pedidos para tienda:', tienda);
    
    const targetDate = fecha || getCostaRicaDateISO();
    console.log('📅 Fecha objetivo:', targetDate);
    
    const { count, error } = await supabasePedidos
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('tienda', tienda)
      .eq('fecha_creacion', targetDate);

    if (error) {
      console.error('❌ Error al obtener conteo por tienda:', error);
      return 0;
    }

    console.log(`📊 Total de pedidos para ${tienda} en ${targetDate}: ${count || 0}`);
    return count || 0;
  } catch (error) {
    console.error('❌ Error en getPedidosCountByTienda:', error);
    return 0;
  }
};

// Función para actualizar un pedido
export const updatePedido = async (id: string, updates: Partial<PedidoTest>): Promise<boolean> => {
  try {
    console.log(`🔄 Actualizando pedido ${id} con datos:`, updates);

    const { error } = await supabasePedidos
      .from('pedidos')
      .update(updates)
      .eq('id_pedido', id);

    if (error) {
      console.error('Error al actualizar pedido:', error);
      return false;
    }

    console.log(`✅ Pedido ${id} actualizado exitosamente por: ${(updates as any).usuario || 'Usuario desconocido'}`);
    return true;
  } catch (error) {
    console.error('Error en updatePedido:', error);
    return false;
  }
};

// Función para obtener pedidos por rango de fechas
export const getPedidosByDateRange = async (tienda: string, fechaInicio: Date, fechaFin: Date): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Buscando pedidos por rango de fechas para tienda:', tienda);
    
    const fechaInicioISO = fechaInicio.toISOString().split('T')[0];
    const fechaFinISO = fechaFin.toISOString().split('T')[0];
    
    console.log('📅 Rango de fechas:', fechaInicioISO, 'a', fechaFinISO);
    
    // Obtener todos los pedidos usando paginación
    let allPedidos: PedidoTest[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 Obteniendo página ${Math.floor(from / limit) + 1} (registros ${from} a ${from + limit - 1})...`);
      
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .eq('tienda', tienda)
        .gte('fecha_creacion', fechaInicioISO)
        .lte('fecha_creacion', fechaFinISO)
        .range(from, from + limit - 1)
        .order('id_pedido', { ascending: true });

      if (error) {
        console.error('❌ Error al obtener pedidos por rango:', error);
        return allPedidos;
      }

      if (data && data.length > 0) {
        allPedidos = [...allPedidos, ...data];
        from += limit;
        hasMore = data.length === limit;
        console.log(`📦 Página obtenida: ${data.length} registros. Total acumulado: ${allPedidos.length}`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Pedidos encontrados en rango para ${tienda}:`, allPedidos.length);
    return allPedidos;
  } catch (error) {
    console.error('❌ Error en getPedidosByDateRange:', error);
    return [];
  }
};

// Función para obtener pedidos por mes
export const getPedidosByMonth = async (tienda: string, mes: string): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Buscando pedidos por mes para tienda:', tienda, 'mes:', mes);
    
    // mes viene en formato YYYY-MM
    const [year, month] = mes.split('-');
    const fechaInicio = new Date(parseInt(year), parseInt(month) - 1, 1);
    const fechaFin = new Date(parseInt(year), parseInt(month), 0);
    
    return await getPedidosByDateRange(tienda, fechaInicio, fechaFin);
  } catch (error) {
    console.error('❌ Error en getPedidosByMonth:', error);
    return [];
  }
};

// Función para obtener todos los pedidos de una tienda
export const getAllPedidosByTienda = async (tienda: string): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Buscando todos los pedidos para tienda:', tienda);
    
    // Obtener todos los pedidos usando paginación
    let allPedidos: PedidoTest[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 Obteniendo página ${Math.floor(from / limit) + 1} (registros ${from} a ${from + limit - 1})...`);
      
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .eq('tienda', tienda)
        .range(from, from + limit - 1)
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('❌ Error al obtener todos los pedidos:', error);
        return allPedidos;
      }

      if (data && data.length > 0) {
        allPedidos = [...allPedidos, ...data];
        from += limit;
        hasMore = data.length === limit;
        console.log(`📦 Página obtenida: ${data.length} registros. Total acumulado: ${allPedidos.length}`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Todos los pedidos encontrados para ${tienda}:`, allPedidos.length);
    return allPedidos;
  } catch (error) {
    console.error('❌ Error en getAllPedidosByTienda:', error);
    return [];
  }
};

// Función para obtener mensajeros únicos de Supabase
export const getMensajerosUnicos = async (): Promise<string[]> => {
  try {
    console.log('🔍 Obteniendo mensajeros únicos de Supabase...');
    
    // Primero verificar si hay datos en la tabla
    const { data: totalPedidos, error: errorTotal } = await supabasePedidos
      .from('pedidos')
      .select('id_pedido, mensajero_asignado, mensajero_concretado, fecha_creacion')
      .limit(5);
    
    console.log('📊 Muestra de pedidos en la tabla:', totalPedidos);
    console.log('📊 Total de pedidos en muestra:', totalPedidos?.length || 0);
    
    // Obtener nombres únicos de mensajero_asignado
    const { data: asignados, error: errorAsignados } = await supabasePedidos
      .from('pedidos')
      .select('mensajero_asignado')
      .not('mensajero_asignado', 'is', null);
    
    // Obtener nombres únicos de mensajero_concretado
    const { data: concretados, error: errorConcretados } = await supabasePedidos
      .from('pedidos')
      .select('mensajero_concretado')
      .not('mensajero_concretado', 'is', null);

    if (errorAsignados) {
      console.error('❌ Error al obtener mensajeros asignados:', errorAsignados);
    }
    
    if (errorConcretados) {
      console.error('❌ Error al obtener mensajeros concretados:', errorConcretados);
    }

    // Combinar y obtener nombres únicos
    const nombresAsignados = asignados?.map(p => p.mensajero_asignado).filter(Boolean) || [];
    const nombresConcretados = concretados?.map(p => p.mensajero_concretado).filter(Boolean) || [];
    
    console.log('📋 Nombres asignados encontrados:', nombresAsignados);
    console.log('📋 Nombres concretados encontrados:', nombresConcretados);
    
    const todosLosNombres = [...nombresAsignados, ...nombresConcretados];
    const nombresUnicos = Array.from(new Set(todosLosNombres));
    
    console.log('📋 Mensajeros únicos encontrados:', nombresUnicos);
    console.log('📋 Total de mensajeros únicos:', nombresUnicos.length);
    return nombresUnicos;
  } catch (error) {
    console.error('❌ Error en getMensajerosUnicos:', error);
    return [];
  }
};

// Función para obtener pedidos del día por mensajero específico
export const getPedidosDelDiaByMensajeroEspecifico = async (mensajeroName: string, fecha: string): Promise<PedidoTest[]> => {
  try {
    // Validar que la fecha no esté vacía
    if (!fecha || fecha.trim() === '') {
      console.error('❌ Error: fecha vacía en getPedidosDelDiaByMensajeroEspecifico');
      return [];
    }
    
    console.log(`🔍 Obteniendo pedidos para mensajero: ${mensajeroName}, fecha: ${fecha}`);
    
    // Obtener todos los pedidos usando paginación con fecha simple (sin hora)
    let allPedidos: PedidoTest[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
        .eq('fecha_creacion', fecha) // Usar eq en lugar de gte/lt
        .range(from, from + limit - 1)
        .order('id_pedido', { ascending: true });

      if (error) {
        console.error('❌ Error al obtener pedidos del día:', error);
        return allPedidos;
      }

      if (data && data.length > 0) {
        allPedidos = [...allPedidos, ...data];
        from += limit;
        hasMore = data.length === limit;
      } else {
        hasMore = false;
      }
    }

    return allPedidos;
  } catch (error) {
    console.error('❌ Error en getPedidosDelDiaByMensajeroEspecifico:', error);
    return [];
  }
};

// Función para obtener pedidos del día actual
export const getPedidosDelDia = async (fecha: string = getCostaRicaDateISO()) => {
  try {
    console.log('🔍 getPedidosDelDia - Buscando pedidos para fecha:', fecha);
    
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .eq('fecha_creacion', fecha) // Usar eq en lugar de gte/lt ya que los datos solo tienen fecha
      .order('fecha_creacion', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching pedidos del día:', error);
      return [];
    }

    console.log('✅ Pedidos del día encontrados:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getPedidosDelDia:', error);
    return [];
  }
};

// Función para obtener liquidaciones reales por fecha
export const getLiquidacionesReales = async (fecha: string): Promise<{
  mensajero: string;
  pedidos: PedidoTest[];
  totalCollected: number;
  sinpePayments: number;
  cashPayments: number;
  tarjetaPayments: number;
  totalSpent: number;
  initialAmount: number;
  finalAmount: number;
  gastos: {
    id: string;
    monto: number;
    tipo_gasto: string;
    comprobante_link: string;
    fecha: string;
  }[];
}[]> => {
  try {
    // Validar que la fecha no esté vacía
    if (!fecha || fecha.trim() === '') {
      console.error('❌ Error: fecha vacía en getLiquidacionesReales');
      return [];
    }
    
    console.log(`🔍 Obteniendo liquidaciones para fecha: ${fecha}`);
    
    // Obtener mensajeros únicos
    const mensajeros = await getMensajerosUnicos();
    console.log(`📋 Mensajeros totales en el sistema: ${mensajeros.length}`);
    
    // Obtener gastos para todos los mensajeros
    const gastosData = await getGastosMensajeros(fecha);
    console.log(`💰 Gastos obtenidos: ${gastosData.length} mensajeros con gastos`);
    
    const liquidaciones = [];
    
    // Procesar mensajeros y filtrar solo los que tienen pedidos
    for (const mensajero of mensajeros) {
      // Obtener pedidos del día para este mensajero
      const pedidosRaw = await getPedidosDelDiaByMensajeroEspecifico(mensajero, fecha);
      
      // Normalizar todos los pedidos a mayúsculas
      const pedidos = pedidosRaw.map(normalizePedidoData);
      
      // FILTRO: Saltar mensajeros sin pedidos en la fecha seleccionada
      if (pedidos.length === 0) {
        console.log(`⚠️ Mensajero ${mensajero} no tiene pedidos en la fecha ${fecha} - OMITIDO`);
        continue;
      }
      
      console.log(`✅ Procesando mensajero ${mensajero} con ${pedidos.length} pedidos`);
      
      // Buscar gastos del mensajero
      const gastosDelMensajero = gastosData.find(g => g.mensajero === mensajero);
      const gastos = gastosDelMensajero?.gastos || [];
      
      // Calcular totales - usando valores normalizados
      const totalCollected = pedidos.reduce((sum, pedido) => {
        if (pedido.estado_pedido === 'ENTREGADO') {
          return sum + pedido.valor_total;
        }
        return sum;
      }, 0);

      const sinpePayments = pedidos.reduce((sum, pedido) => {
        if (pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'SINPE') {
          return sum + pedido.valor_total;
        }
        return sum;
      }, 0);

      const cashPayments = pedidos.reduce((sum, pedido) => {
        if (pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'EFECTIVO') {
          return sum + pedido.valor_total;
        }
        return sum;
      }, 0);

      const tarjetaPayments = pedidos.reduce((sum, pedido) => {
        if (pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'TARJETA') {
          return sum + pedido.valor_total;
        }
        return sum;
      }, 0);

      const totalSpent = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
      const initialAmount = 0; // Monto inicial por defecto (se define en el modal)
      // El mensajero solo debe entregar el efectivo recaudado, no el total de todos los pagos
      const finalAmount = initialAmount + cashPayments - totalSpent;

      liquidaciones.push({
        mensajero,
        pedidos,
        totalCollected,
        sinpePayments,
        cashPayments,
        tarjetaPayments,
        totalSpent,
        initialAmount,
        finalAmount,
        gastos
      });
    }
    
    console.log(`✅ Liquidaciones generadas: ${liquidaciones.length} mensajeros con pedidos en la fecha ${fecha}`);
    return liquidaciones;
  } catch (error) {
    console.error('❌ Error en getLiquidacionesReales:', error);
    return [];
  }
};

// Función para verificar si una liquidación ya está liquidada
export const checkLiquidationStatus = async (mensajero: string, fecha: string): Promise<boolean> => {
  try {
    if (!fecha || fecha.trim() === '') {
      console.error('❌ Error: fecha vacía en checkLiquidationStatus');
      return false;
    }
    
    console.log(`🔍 Verificando estado de liquidación para ${mensajero} en fecha ${fecha}`);
    
    const { data, error } = await supabasePedidos
      .from('liquidaciones')
      .select('ya_liquidado')
      .eq('mensajero', mensajero)
      .eq('fecha', fecha)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró registro, no está liquidado
        console.log(`ℹ️ No se encontró liquidación para ${mensajero} en ${fecha}`);
        return false;
      }
      console.error('❌ Error verificando liquidación:', error);
      return false;
    }

    const isLiquidated = data?.ya_liquidado === true;
    console.log(`✅ Estado de liquidación para ${mensajero}: ${isLiquidated ? 'LIQUIDADO' : 'PENDIENTE'}`);
    return isLiquidated;
  } catch (error) {
    console.error('❌ Error en checkLiquidationStatus:', error);
    return false;
  }
};

// Función para debuggear consultas de mensajeros específicos
export const debugMensajeroQueries = async (mensajeroName: string) => {
  try {
    console.log(`🔍 DEBUGGING: Consultas para mensajero ${mensajeroName}`);
    
    // 1. Verificar si el mensajero existe en la tabla
    const { data: mensajeroExists, error: errorExists } = await supabasePedidos
      .from('pedidos')
      .select('mensajero_asignado, mensajero_concretado')
      .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
      .limit(5);
    
    console.log(`📋 Mensajero ${mensajeroName} existe:`, mensajeroExists?.length || 0);
    console.log(`📋 Muestra de asignaciones:`, mensajeroExists);
    console.log(`❌ Error en verificación:`, errorExists);
    
    // 2. Verificar fechas disponibles para este mensajero
    const { data: fechasMensajero, error: errorFechas } = await supabasePedidos
      .from('pedidos')
      .select('fecha_creacion')
      .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
      .not('fecha_creacion', 'is', null)
      .order('fecha_creacion', { ascending: false })
      .limit(10);
    
    console.log(`📅 Fechas disponibles para ${mensajeroName}:`, fechasMensajero?.length || 0);
    console.log(`📅 Muestra de fechas:`, fechasMensajero);
    console.log(`❌ Error en fechas:`, errorFechas);
    
    // 3. Probar con fecha actual
    const fechaActual = getCostaRicaDateISO();
    console.log(`📅 Probando con fecha actual: ${fechaActual}`);
    
    const { data: pedidosHoy, error: errorHoy } = await supabasePedidos
      .from('pedidos')
      .select('id_pedido, fecha_creacion, mensajero_asignado, mensajero_concretado, estado_pedido')
      .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
      .gte('fecha_creacion', `${fechaActual}T00:00:00`)
      .lt('fecha_creacion', `${fechaActual}T23:59:59`)
      .limit(5);
    
    console.log(`📦 Pedidos para hoy (${fechaActual}):`, pedidosHoy?.length || 0);
    console.log(`📦 Muestra de pedidos de hoy:`, pedidosHoy);
    console.log(`❌ Error en pedidos de hoy:`, errorHoy);
    
    // 4. Probar con diferentes variaciones del nombre
    const variaciones = [
      mensajeroName,
      mensajeroName.toLowerCase(),
      mensajeroName.toUpperCase(),
      mensajeroName.trim(),
      `%${mensajeroName}%`
    ];
    
    for (const variacion of variaciones) {
      console.log(`🔍 Probando variación: "${variacion}"`);
      
      const { data: pedidosVariacion, error: errorVariacion } = await supabasePedidos
        .from('pedidos')
        .select('id_pedido, mensajero_asignado, mensajero_concretado')
        .or(`mensajero_asignado.ilike.${variacion},mensajero_concretado.ilike.${variacion}`)
        .limit(3);
      
      console.log(`📦 Resultados para "${variacion}":`, pedidosVariacion?.length || 0);
      if (pedidosVariacion && pedidosVariacion.length > 0) {
        console.log(`📋 Muestra:`, pedidosVariacion);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en debugMensajeroQueries:', error);
  }
};

// Función para probar múltiples fechas y encontrar datos
export const debugFechasConDatos = async () => {
  try {
    console.log('🔍 DEBUGGING: Buscando fechas con datos...');
    
    // Obtener todas las fechas únicas en la tabla
    const { data: fechasUnicas, error: errorFechas } = await supabasePedidos
      .from('pedidos')
      .select('fecha_creacion')
      .not('fecha_creacion', 'is', null)
      .order('fecha_creacion', { ascending: false })
      .limit(20);
    
    if (errorFechas) {
      console.error('❌ Error al obtener fechas:', errorFechas);
      return;
    }
    
    console.log('📅 Fechas encontradas en la tabla:', fechasUnicas);
    
    // Extraer fechas únicas (solo la parte de fecha, sin hora)
    const fechas = Array.from(new Set(fechasUnicas?.map(p => p.fecha_creacion?.split('T')[0]) || []));
    console.log('📅 Fechas únicas:', fechas);
    
    // Probar las primeras 5 fechas
    for (const fecha of fechas.slice(0, 5)) {
      console.log(`\n🔍 Probando fecha: ${fecha}`);
      
      const { data: pedidosFecha, error: errorPedidos } = await supabasePedidos
        .from('pedidos')
        .select('id_pedido, fecha_creacion, mensajero_asignado, mensajero_concretado, estado_pedido, valor_total')
        .gte('fecha_creacion', `${fecha}T00:00:00`)
        .lt('fecha_creacion', `${fecha}T23:59:59`)
        .limit(5);
      
      if (errorPedidos) {
        console.error(`❌ Error para fecha ${fecha}:`, errorPedidos);
      } else {
        console.log(`📦 Pedidos para ${fecha}:`, pedidosFecha?.length || 0);
        if (pedidosFecha && pedidosFecha.length > 0) {
          console.log(`📋 Muestra de pedidos:`, pedidosFecha.map(p => ({
            id: p.id_pedido,
            fecha: p.fecha_creacion,
            estado: p.estado_pedido,
            valor: p.valor_total,
            asignado: p.mensajero_asignado,
            concretado: p.mensajero_concretado
          })));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error en debugFechasConDatos:', error);
  }
};

// Función de debugging para verificar datos de la tabla
export const debugTablaPedidos = async (fecha: string) => {
  try {
    console.log(`🔍 DEBUGGING: Verificando datos de la tabla para fecha ${fecha}`);
    
    // Verificar total de pedidos en la tabla
    const { data: totalPedidos, error: errorTotal } = await supabasePedidos
      .from('pedidos')
      .select('id_pedido, mensajero_asignado, mensajero_concretado, fecha_creacion, estado_pedido, valor_total, metodo_pago')
      .limit(10);
    
    console.log('📊 Total de pedidos en la tabla (muestra):', totalPedidos?.length || 0);
    console.log('📊 Muestra de pedidos:', totalPedidos);
    
    // Verificar pedidos para la fecha específica
    const { data: pedidosFecha, error: errorFecha } = await supabasePedidos
      .from('pedidos')
      .select('id_pedido, mensajero_asignado, mensajero_concretado, fecha_creacion, estado_pedido, valor_total, metodo_pago')
      .eq('fecha_creacion', fecha)
      .limit(10);
    
    console.log(`📊 Pedidos para fecha ${fecha}:`, pedidosFecha?.length || 0);
    console.log('📊 Pedidos de la fecha:', pedidosFecha);
    
    // Verificar mensajeros únicos en la fecha
    const { data: mensajerosFecha, error: errorMensajeros } = await supabasePedidos
      .from('pedidos')
      .select('mensajero_asignado, mensajero_concretado')
      .eq('fecha_creacion', fecha)
      .not('mensajero_asignado', 'is', null);
    
    console.log(`📊 Mensajeros en fecha ${fecha}:`, mensajerosFecha?.length || 0);
    console.log('📊 Mensajeros de la fecha:', mensajerosFecha);
    
    return {
      totalPedidos: totalPedidos?.length || 0,
      pedidosFecha: pedidosFecha?.length || 0,
      mensajerosFecha: mensajerosFecha?.length || 0,
      muestra: totalPedidos,
      pedidosFechaMuestra: pedidosFecha,
      mensajerosFechaMuestra: mensajerosFecha
    };
  } catch (error) {
    console.error('❌ Error en debugTablaPedidos:', error);
    return null;
  }
};

// Función para obtener gastos de mensajeros por fecha
export const getGastosMensajeros = async (fecha: string): Promise<{
  mensajero: string;
  gastos: {
    id: string;
    monto: number;
    tipo_gasto: string;
    comprobante_link: string;
    fecha: string;
  }[];
  totalGastos: number;
}[]> => {
  try {
    console.log(`🔍 Obteniendo gastos para fecha: ${fecha}`);
    
    // Obtener todos los gastos del día
    const { data: gastos, error } = await supabasePedidos
      .from('gastos_mensajeros')
      .select('*')
      .gte('fecha', `${fecha}T00:00:00`)
      .lt('fecha', `${fecha}T23:59:59`)
      .order('fecha', { ascending: true });

    if (error) {
      console.error('❌ Error al obtener gastos:', error);
      return [];
    }

    console.log(`✅ Gastos encontrados: ${gastos?.length || 0}`);

    // Agrupar por mensajero
    const gastosPorMensajero: { [key: string]: any[] } = {};
    
    gastos?.forEach(gasto => {
      if (!gastosPorMensajero[gasto.mensajero]) {
        gastosPorMensajero[gasto.mensajero] = [];
      }
      gastosPorMensajero[gasto.mensajero].push(gasto);
    });

    // Convertir a formato requerido
    const resultado = Object.entries(gastosPorMensajero).map(([mensajero, gastosMensajero]) => {
      const totalGastos = gastosMensajero.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
      
      return {
        mensajero,
        gastos: gastosMensajero.map((gasto, index) => ({
          id: gasto.id || `${mensajero}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          monto: parseFloat(gasto.monto),
          tipo_gasto: gasto.tipo_gasto,
          comprobante_link: gasto.comprobante_link,
          fecha: gasto.fecha
        })),
        totalGastos
      };
    });

    console.log(`✅ Gastos procesados para ${resultado.length} mensajeros`);
    return resultado;
  } catch (error) {
    console.error('❌ Error en getGastosMensajeros:', error);
    return [];
  }
};

// Función para obtener tiendas únicas de Supabase
export const getTiendasUnicas = async (): Promise<string[]> => {
  try {
    console.log('🔍 Obteniendo tiendas únicas...');
    
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('tienda')
      .not('tienda', 'is', null)
      .not('tienda', 'eq', '')
      .order('tienda', { ascending: true });

    if (error) {
      console.error('❌ Error al obtener tiendas:', error);
      return [];
    }

    // Extraer tiendas únicas y normalizar
    const tiendasUnicas = Array.from(new Set(
      data?.map(p => p.tienda?.toUpperCase().trim()).filter(Boolean) || []
    ));

    console.log('📋 Tiendas únicas encontradas:', tiendasUnicas);
    console.log('📋 Total de tiendas únicas:', tiendasUnicas.length);
    return tiendasUnicas;
  } catch (error) {
    console.error('❌ Error en getTiendasUnicas:', error);
    return [];
  }
};

// Función para obtener pedidos del día por tienda específica
export const getPedidosDelDiaByTiendaEspecifica = async (tiendaName: string, fecha: string): Promise<PedidoTest[]> => {
  try {
    // Validar que la fecha no esté vacía
    if (!fecha || fecha.trim() === '') {
      console.error('❌ Error: fecha vacía en getPedidosDelDiaByTiendaEspecifica');
      return [];
    }
    
    console.log(`🔍 Obteniendo pedidos para tienda: ${tiendaName}, fecha: ${fecha}`);
    
    // Obtener todos los pedidos usando paginación
    let allPedidos: PedidoTest[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .ilike('tienda', tiendaName)
        .eq('fecha_creacion', fecha)
        .range(from, from + limit - 1)
        .order('id_pedido', { ascending: true });

      if (error) {
        console.error('❌ Error al obtener pedidos del día:', error);
        return allPedidos;
      }

      if (data && data.length > 0) {
        allPedidos = [...allPedidos, ...data];
        from += limit;
        hasMore = data.length === limit;
      } else {
        hasMore = false;
      }
    }

    return allPedidos;
  } catch (error) {
    console.error('❌ Error en getPedidosDelDiaByTiendaEspecifica:', error);
    return [];
  }
};

// Función para obtener liquidaciones reales por tienda
export const getLiquidacionesRealesByTienda = async (fecha: string): Promise<{
  tienda: string;
  pedidos: PedidoTest[];
  totalCollected: number;
  sinpePayments: number;
  cashPayments: number;
  tarjetaPayments: number;
  totalSpent: number;
  initialAmount: number;
  finalAmount: number;
  gastos: {
    id: string;
    monto: number;
    tipo_gasto: string;
    comprobante_link: string;
    fecha: string;
  }[];
  // Métricas adicionales por tienda
  deliveredOrders: number;
  pendingOrders: number;
  returnedOrders: number;
  rescheduledOrders: number;
  averageOrderValue: number;
  topMessenger: string;
  topDistrict: string;
}[]> => {
  try {
    // Validar que la fecha no esté vacía
    if (!fecha || fecha.trim() === '') {
      console.error('❌ Error: fecha vacía en getLiquidacionesRealesByTienda');
      return [];
    }
    
    console.log(`🔍 Obteniendo liquidaciones por tienda para fecha: ${fecha}`);
    
    // Obtener tiendas únicas que tengan pedidos en la fecha específica
    const { data: tiendasData, error: tiendasError } = await supabasePedidos
      .from('pedidos')
      .select('tienda')
      .eq('fecha_creacion', fecha)
      .not('tienda', 'is', null)
      .not('tienda', 'eq', '');
    
    if (tiendasError) {
      console.error('❌ Error al obtener tiendas para la fecha:', tiendasError);
      return [];
    }
    
    // Extraer tiendas únicas y normalizar
    const tiendas = Array.from(new Set(
      tiendasData?.map(p => p.tienda?.toUpperCase().trim()).filter(Boolean) || []
    ));
    
    console.log(`📋 Tiendas encontradas para fecha ${fecha}: ${tiendas.length}`);
    console.log(`📋 Tiendas:`, tiendas);
    
    // Obtener gastos para todas las tiendas (agrupados por mensajero)
    const gastosData = await getGastosMensajeros(fecha);
    console.log(`💰 Gastos obtenidos: ${gastosData.length} mensajeros con gastos`);
    
    const liquidaciones = [];
    
    // Procesar todas las tiendas
    for (const tienda of tiendas) {
      // Obtener pedidos del día para esta tienda
      const pedidosRaw = await getPedidosDelDiaByTiendaEspecifica(tienda, fecha);
      
      // Normalizar todos los pedidos a mayúsculas
      const pedidos = pedidosRaw.map(normalizePedidoData);
      
      // Calcular métricas por tienda
      const totalCollected = pedidos.reduce((sum, pedido) => {
        if (pedido.estado_pedido === 'ENTREGADO') {
          return sum + pedido.valor_total;
        }
        return sum;
      }, 0);

      const sinpePayments = pedidos.reduce((sum, pedido) => {
        if (pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'SINPE') {
          return sum + pedido.valor_total;
        }
        return sum;
      }, 0);

      const cashPayments = pedidos.reduce((sum, pedido) => {
        if (pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'EFECTIVO') {
          return sum + pedido.valor_total;
        }
        return sum;
      }, 0);

      const tarjetaPayments = pedidos.reduce((sum, pedido) => {
        if (pedido.estado_pedido === 'ENTREGADO' && pedido.metodo_pago === 'TARJETA') {
          return sum + pedido.valor_total;
        }
        return sum;
      }, 0);

      // Calcular métricas adicionales
      const deliveredOrders = pedidos.filter(p => p.estado_pedido === 'ENTREGADO').length;
      const pendingOrders = pedidos.filter(p => p.estado_pedido === 'PENDIENTE').length;
      const returnedOrders = pedidos.filter(p => p.estado_pedido === 'DEVOLUCION').length;
      const rescheduledOrders = pedidos.filter(p => p.estado_pedido === 'REAGENDADO').length;
      
      const totalValue = pedidos.reduce((sum, pedido) => sum + pedido.valor_total, 0);
      const averageOrderValue = pedidos.length > 0 ? totalValue / pedidos.length : 0;

      // Encontrar mensajero con más pedidos
      const mensajeroCounts: { [key: string]: number } = {};
      pedidos.forEach(pedido => {
        const mensajero = pedido.mensajero_concretado || pedido.mensajero_asignado;
        if (mensajero) {
          mensajeroCounts[mensajero] = (mensajeroCounts[mensajero] || 0) + 1;
        }
      });
      const topMessenger = Object.entries(mensajeroCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'SIN_ASIGNAR';

      // Encontrar distrito con más pedidos
      const distritoCounts: { [key: string]: number } = {};
      pedidos.forEach(pedido => {
        if (pedido.distrito) {
          distritoCounts[pedido.distrito] = (distritoCounts[pedido.distrito] || 0) + 1;
        }
      });
      const topDistrict = Object.entries(distritoCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'SIN_DISTRITO';

      // Calcular gastos totales de la tienda (suma de gastos de todos los mensajeros que trabajaron en esta tienda)
      const mensajerosDeLaTienda = Array.from(new Set(
        pedidos.map(p => p.mensajero_concretado || p.mensajero_asignado).filter(Boolean)
      ));
      
      const totalSpent = gastosData
        .filter(g => mensajerosDeLaTienda.includes(g.mensajero))
        .reduce((sum, g) => sum + g.totalGastos, 0);

      const initialAmount = 0; // Monto inicial por defecto
      const finalAmount = initialAmount + cashPayments - totalSpent;

      liquidaciones.push({
        tienda,
        pedidos,
        totalCollected,
        sinpePayments,
        cashPayments,
        tarjetaPayments,
        totalSpent,
        initialAmount,
        finalAmount,
        gastos: gastosData
          .filter(g => mensajerosDeLaTienda.includes(g.mensajero))
          .flatMap(g => g.gastos),
        deliveredOrders,
        pendingOrders,
        returnedOrders,
        rescheduledOrders,
        averageOrderValue,
        topMessenger,
        topDistrict
      });
    }
    
    console.log(`✅ Liquidaciones por tienda generadas: ${liquidaciones.length}`);
    return liquidaciones;
  } catch (error) {
    console.error('❌ Error en getLiquidacionesRealesByTienda:', error);
    return [];
  }
};

// ===== FUNCIONES ESPECÍFICAS PARA TIENDAS =====

// Función para crear un nuevo pedido desde la tienda
export const crearPedidoTienda = async (pedidoData: Omit<PedidoTest, 'id_pedido' | 'fecha_creacion'>): Promise<{ success: boolean, pedido?: PedidoTest, error?: string }> => {
  try {
    console.log('🆕 Creando nuevo pedido desde tienda:', pedidoData);

    // Generar ID único para el pedido
    const id_pedido = `TS${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const nuevoPedido = {
      ...pedidoData,
      id_pedido,
      fecha_creacion: new Date().toISOString(),
      estado_pedido: 'pendiente', // Estado inicial
      mensajero_asignado: null,
      mensajero_concretado: null,
      fecha_entrega: null,
      notas: pedidoData.notas || '',
      nota_asesor: pedidoData.nota_asesor || ''
    };

    const { data, error } = await supabasePedidos
      .from('pedidos')
      .insert([nuevoPedido])
      .select()
      .single();

    if (error) {
      console.error('❌ Error al crear pedido:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Pedido creado exitosamente:', data);
    return { success: true, pedido: data };
  } catch (error) {
    console.error('❌ Error en crearPedidoTienda:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// Función para confirmar un pedido (cambiar estado a confirmado)
export const confirmarPedidoTienda = async (pedidoId: string, usuario: string): Promise<{ success: boolean, error?: string }> => {
  try {
    console.log(`✅ Confirmando pedido ${pedidoId} por usuario: ${usuario}`);

    const { error } = await supabasePedidos
      .from('pedidos')
      .update({ 
        estado_pedido: 'confirmado',
        nota_asesor: `Confirmado por ${usuario} el ${new Date().toLocaleString('es-CR')}`
      })
      .eq('id_pedido', pedidoId);

    if (error) {
      console.error('❌ Error al confirmar pedido:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Pedido confirmado exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en confirmarPedidoTienda:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// Función para desconfirmar un pedido (cambiar estado a pendiente)
export const desconfirmarPedidoTienda = async (pedidoId: string, usuario: string, motivo?: string): Promise<{ success: boolean, error?: string }> => {
  try {
    console.log(`❌ Desconfirmando pedido ${pedidoId} por usuario: ${usuario}`);

    const nota = motivo 
      ? `Desconfirmado por ${usuario} el ${new Date().toLocaleString('es-CR')}. Motivo: ${motivo}`
      : `Desconfirmado por ${usuario} el ${new Date().toLocaleString('es-CR')}`;

    const { error } = await supabasePedidos
      .from('pedidos')
      .update({ 
        estado_pedido: 'pendiente',
        nota_asesor: nota
      })
      .eq('id_pedido', pedidoId);

    if (error) {
      console.error('❌ Error al desconfirmar pedido:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Pedido desconfirmado exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en desconfirmarPedidoTienda:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// Función para eliminar un pedido (soft delete)
export const eliminarPedidoTienda = async (pedidoId: string, usuario: string, motivo?: string): Promise<{ success: boolean, error?: string }> => {
  try {
    console.log(`🗑️ Eliminando pedido ${pedidoId} por usuario: ${usuario}`);

    const nota = motivo 
      ? `Eliminado por ${usuario} el ${new Date().toLocaleString('es-CR')}. Motivo: ${motivo}`
      : `Eliminado por ${usuario} el ${new Date().toLocaleString('es-CR')}`;

    const { error } = await supabasePedidos
      .from('pedidos')
      .update({ 
        estado_pedido: 'eliminado',
        nota_asesor: nota
      })
      .eq('id_pedido', pedidoId);

    if (error) {
      console.error('❌ Error al eliminar pedido:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Pedido eliminado exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en eliminarPedidoTienda:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// Función para obtener liquidación de la tienda
export const getLiquidacionTienda = async (tiendaName: string, fecha?: string): Promise<{
  tienda: string;
  fecha: string;
  totalPedidos: number;
  pedidosConfirmados: number;
  pedidosEntregados: number;
  pedidosPendientes: number;
  pedidosEliminados: number;
  valorTotal: number;
  valorRecaudado: number;
  valorPendiente: number;
  metodosPago: {
    efectivo: number;
    sinpe: number;
    tarjeta: number;
    dosPagos: number;
  };
  pedidos: PedidoTest[];
}> => {
  try {
    console.log(`💰 Obteniendo liquidación de tienda: ${tiendaName} para fecha: ${fecha || 'hoy'}`);

    const fechaFiltro = fecha || new Date().toISOString().split('T')[0];
    
    // Obtener todos los pedidos para la fecha específica (mismo flujo que useTiendaPedidos)
    const { data: pedidos, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .eq('fecha_creacion', fechaFiltro);

    if (error) {
      console.error('❌ Error al obtener pedidos para liquidación:', error);
      throw new Error(`Error de Supabase: ${error.message}`);
    }

    console.log(`📊 Total de pedidos obtenidos para fecha ${fechaFiltro}: ${(pedidos || []).length}`);

    // Filtrar por tienda usando la misma lógica que useTiendaPedidos
    const pedidosTienda = (pedidos || []).filter(pedido => {
      const pedidoTienda = (pedido.tienda || '').toLowerCase().trim();
      const tiendaFiltro = tiendaName.toLowerCase().trim();
      const matches = pedidoTienda === tiendaFiltro;
      if (matches) {
        console.log(`✅ Pedido ${pedido.id_pedido} coincide con tienda ${tiendaName}`);
      }
      return matches;
    });
    
    console.log(`🏪 Pedidos de la tienda ${tiendaName}: ${pedidosTienda.length}`);
    
    // Calcular estadísticas
    const totalPedidos = pedidosTienda.length;
    const pedidosConfirmados = pedidosTienda.filter(p => p.estado_pedido === 'confirmado').length;
    const pedidosEntregados = pedidosTienda.filter(p => p.estado_pedido === 'entregado').length;
    const pedidosPendientes = pedidosTienda.filter(p => p.estado_pedido === 'pendiente').length;
    const pedidosEliminados = pedidosTienda.filter(p => p.estado_pedido === 'eliminado').length;
    
    const valorTotal = pedidosTienda.reduce((sum, p) => sum + p.valor_total, 0);
    const valorRecaudado = pedidosTienda
      .filter(p => p.estado_pedido === 'entregado')
      .reduce((sum, p) => sum + p.valor_total, 0);
    const valorPendiente = pedidosTienda
      .filter(p => ['pendiente', 'confirmado'].includes(p.estado_pedido || ''))
      .reduce((sum, p) => sum + p.valor_total, 0);

    const metodosPago = {
      efectivo: pedidosTienda.filter(p => p.metodo_pago?.toLowerCase() === 'efectivo').length,
      sinpe: pedidosTienda.filter(p => p.metodo_pago?.toLowerCase() === 'sinpe').length,
      tarjeta: pedidosTienda.filter(p => p.metodo_pago?.toLowerCase() === 'tarjeta').length,
      dosPagos: pedidosTienda.filter(p => 
        p.metodo_pago?.toLowerCase() === '2pagos' || p.metodo_pago?.toLowerCase() === '2 pagos'
      ).length
    };

    const liquidacion = {
      tienda: tiendaName,
      fecha: fechaFiltro,
      totalPedidos,
      pedidosConfirmados,
      pedidosEntregados,
      pedidosPendientes,
      pedidosEliminados,
      valorTotal,
      valorRecaudado,
      valorPendiente,
      metodosPago,
      pedidos: pedidosTienda
    };

    console.log('✅ Liquidación calculada:', liquidacion);
    return liquidacion;
  } catch (error) {
    console.error('❌ Error en getLiquidacionTienda:', error);
    throw error;
  }
};
