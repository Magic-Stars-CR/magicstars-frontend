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

// Función para obtener pedidos por mensajero concretado
export const getPedidosByMensajero = async (mensajeroName: string): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Buscando pedidos para mensajero concretado:', mensajeroName);
    
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .eq('mensajero_concretado', mensajeroName);

    console.log('📊 Resultado de la consulta por mensajero concretado:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Cantidad de pedidos encontrados:', data?.length || 0);

    if (error) {
      console.error('❌ Error al obtener pedidos por mensajero concretado:', error);
      throw error;
    }

    // Si no hay pedidos concretados específicamente, devolver todos los pedidos para testing
    if (!data || data.length === 0) {
      console.log('⚠️ No hay pedidos concretados específicamente por', mensajeroName);
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

// Función para obtener pedidos del día actual por mensajero concretado
export const getPedidosDelDiaByMensajero = async (mensajeroName: string): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Buscando pedidos del día para mensajero concretado:', mensajeroName);
    
    // Obtener la fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Fecha actual:', today);
    
    const { data, error } = await supabasePedidos
      .from('pedidos')
      .select('*')
      .eq('mensajero_concretado', mensajeroName)
      .eq('fecha_creacion', today);

    console.log('📊 Resultado de la consulta por mensajero concretado del día:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Cantidad de pedidos del día encontrados:', data?.length || 0);

    if (error) {
      console.error('❌ Error al obtener pedidos del día por mensajero concretado:', error);
      throw error;
    }

    // Si no hay pedidos del día, devolver array vacío
    if (!data || data.length === 0) {
      console.log('⚠️ No hay pedidos del día concretados por', mensajeroName);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getPedidosDelDiaByMensajero:', error);
    // En caso de error, devolver array vacío en lugar de lanzar excepción
    return [];
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
