import { createClient } from '@/utils/supabase/client';
import { PedidoTest } from './types';

// Cliente de Supabase para pedidos (usando la configuración oficial)
export const supabasePedidos = createClient();

// Función para obtener todos los pedidos
export const getPedidos = async (limit?: number): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Iniciando consulta a Supabase...');
    
    let query = supabasePedidos
      .from('pedidos')
      .select('*')
      .order('id_pedido', { ascending: false }); // Ordenar por ID descendente (más recientes primero)
    
    // Aplicar límite si se especifica
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;

    console.log('📊 Resultado de la consulta:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Cantidad de registros:', data?.length || 0);

    if (error) {
      console.error('❌ Error al obtener pedidos:', error);
      throw new Error(`Error de Supabase: ${error.message}`);
    }

    return data || [];
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

// Función para obtener pedidos del día actual por mensajero (tanto asignado como concretado)
export const getPedidosDelDiaByMensajero = async (mensajeroName: string, fecha?: string): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Buscando pedidos del día para mensajero:', mensajeroName);
    
    // Usar la fecha proporcionada o la fecha actual
    const targetDate = fecha || new Date().toISOString().split('T')[0];
    console.log('📅 Fecha objetivo:', targetDate);
    console.log('📅 Fecha actual completa:', new Date().toISOString());
    
    // Buscar pedidos del día donde el mensajero esté asignado O concretado (insensible a mayúsculas)
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
      .eq('fecha_creacion', targetDate);

    // Debug: Buscar específicamente pedidos de 2025-09-17 para Anibal
    console.log('🔍 DEBUG: Buscando pedidos de 2025-09-17 para Anibal...');
    const { data: debugData, error: debugError } = await supabasePedidos
      .from('pedidos')
      .select('id_pedido, mensajero_asignado, mensajero_concretado, fecha_creacion')
      .or(`mensajero_asignado.ilike.${mensajeroName},mensajero_concretado.ilike.${mensajeroName}`)
      .eq('fecha_creacion', '2025-09-17');
    
    console.log('🔍 DEBUG - Pedidos de 2025-09-17:', debugData);
    console.log('🔍 DEBUG - Error:', debugError);

    console.log('📊 Resultado de la consulta por mensajero del día:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Cantidad de pedidos del día encontrados:', data?.length || 0);

    if (error) {
      console.error('❌ Error al obtener pedidos del día por mensajero:', error);
      throw error;
    }

    // Si no hay pedidos del día, devolver array vacío
    if (!data || data.length === 0) {
      console.log('⚠️ No hay pedidos del día asignados o concretados por', mensajeroName);
      return [];
    }

    return data || [];
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
