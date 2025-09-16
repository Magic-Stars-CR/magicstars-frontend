import { createClient } from '@/utils/supabase/client';
import { PedidoTest } from './types';

// Cliente de Supabase para pedidos (usando la configuración oficial)
export const supabasePedidos = createClient();

// Función para obtener todos los pedidos
export const getPedidos = async (limit?: number): Promise<PedidoTest[]> => {
  try {
    console.log('🔍 Iniciando consulta a Supabase...');
    
    let query = supabasePedidos
      .from('pedidos_test')
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
      .from('pedidos_test')
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
      .from('pedidos_test')
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

// Función para obtener pedidos por mensajero asignado
export const getPedidosByMensajero = async (mensajeroName: string): Promise<PedidoTest[]> => {
  try {
    const { data, error } = await supabasePedidos
      .from('pedidos_test')
      .select('*')
      .eq('mensajero_asignado', mensajeroName);
      // Removido el order por created_at ya que no existe en la tabla

    if (error) {
      console.error('Error al obtener pedidos por mensajero:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en getPedidosByMensajero:', error);
    throw error;
  }
};

// Función para actualizar un pedido
export const updatePedido = async (id: string, updates: Partial<PedidoTest>): Promise<boolean> => {
  try {
    const { error } = await supabasePedidos
      .from('pedidos_test')
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
