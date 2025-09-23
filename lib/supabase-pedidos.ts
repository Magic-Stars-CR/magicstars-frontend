import { createClient } from '@/utils/supabase/client';
import { PedidoTest } from './types';

// Cliente de Supabase para pedidos (usando la configuración oficial)
export const supabasePedidos = createClient();

// Función para obtener todos los pedidos
export const getPedidos = async (limit?: number): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Iniciando consulta a Supabase...');
    
    // Si no se especifica límite, usar paginación para obtener todos los registros
    if (!limit) {
      let allPedidos: PedidoTest[] = [];
      let from = 0;
      const pageLimit = 1000; // Límite por página
      let hasMore = true;

      while (hasMore) {
        console.log(`📄 Obteniendo página ${Math.floor(from / pageLimit) + 1} (registros ${from} a ${from + pageLimit - 1})...`);
        
        const { data, error } = await supabasePedidos
          .from('pedidos')
          .select('*')
          .order('id_pedido', { ascending: false })
          .range(from, from + pageLimit - 1);

        if (error) {
          console.error('❌ Error al obtener pedidos:', error);
          return allPedidos; // Devolver lo que tengamos hasta ahora
        }

        if (data && data.length > 0) {
          allPedidos = [...allPedidos, ...data];
          from += pageLimit;
          hasMore = data.length === pageLimit; // Si obtenemos menos registros que el límite, no hay más páginas
          console.log(`📦 Página obtenida: ${data.length} registros. Total acumulado: ${allPedidos.length}`);
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Total de pedidos obtenidos: ${allPedidos.length}`);
      return allPedidos;
    } else {
      // Si se especifica límite, usar la consulta simple
      const { data, error } = await supabasePedidos
        .from('pedidos')
        .select('*')
        .order('id_pedido', { ascending: false })
        .limit(limit);

      console.log('📊 Resultado de la consulta:');
      console.log('Data:', data);
      console.log('Error:', error);
      console.log('Cantidad de registros:', data?.length || 0);

      if (error) {
        console.error('❌ Error al obtener pedidos:', error);
        throw new Error(`Error de Supabase: ${error.message}`);
      }

      return data || [];
    }
  } catch (error) {
    console.error('❌ Error en getPedidos:', error);
    throw error;
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
const getCostaRicaDateISO = () => {
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
    console.log('🔍 Buscando pedidos del día para mensajero:', mensajeroName);
    
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
        .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
        .eq('fecha_creacion', targetDate)
        .range(from, from + limit - 1)
        .order('id_pedido', { ascending: true });

      if (error) {
        console.error('❌ Error al obtener pedidos del día por mensajero:', error);
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

    console.log(`✅ Pedidos encontrados para mensajero ${mensajeroName}:`, allPedidos.length);
    return allPedidos;
  } catch (error) {
    console.error('❌ Error en getPedidosDelDiaByMensajero:', error);
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
    const { error } = await supabasePedidos
      .from('pedidos')
      .update(updates)
      .eq('id_pedido', id);

    if (error) {
      console.error('Error al actualizar pedido:', error);
      return false;
    }

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
