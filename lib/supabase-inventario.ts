import { createClient } from '@/utils/supabase/client';

// Cliente de Supabase para inventario
export const supabaseInventario = createClient();

// Interfaz para productos del inventario
export interface ProductoInventario {
  idx?: number;
  producto: string;
  cantidad: number;
  tienda: string;
}

// Función para obtener TODOS los productos de ALL STARS (cargar una sola vez)
export const obtenerTodosProductosALLSTARS = async (): Promise<ProductoInventario[]> => {
  console.log('🚀 Iniciando obtenerTodosProductosALLSTARS...');
  
  try {
    // Primero obtener una muestra sin filtro para diagnosticar
    console.log('🔍 Obteniendo muestra de Inventario sin filtro...');
    const { data: muestra, error: muestraError } = await supabaseInventario
      .from('Inventario')
      .select('*')
      .limit(20);
    
    console.log('📊 Resultado muestra:', { data: muestra, error: muestraError, length: muestra?.length });
    
    if (muestraError) {
      console.error('❌ Error al obtener muestra:', muestraError);
    } else if (muestra && muestra.length > 0) {
      console.log('📋 Muestra de Inventario:', muestra);
      const tiendas = Array.from(new Set(muestra.map((d: any) => d.tienda).filter(Boolean)));
      console.log('📋 Tiendas encontradas:', tiendas);
    }

    // Consulta directa filtrada por ALL STARS (case-insensitive)
    console.log('🔍 Consultando productos de ALL STARS...');
    const { data, error } = await supabaseInventario
      .from('Inventario')
      .select('*')
      .ilike('tienda', 'ALL STARS')
      .order('producto', { ascending: true });

    console.log('📊 Resultado consulta ALL STARS:', { dataLength: data?.length, error });

    if (error) {
      console.error('❌ Error al consultar tabla Inventario:', error);
      return [];
    }

    const productos = (data || []).map((item: any) => ({
      producto: item.producto || '',
      cantidad: Number(item.cantidad) || 0,
      tienda: item.tienda || 'ALL STARS',
    }));

    // Log del inventario completo
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 PRODUCTOS ALLSTARS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log({
      total: productos.length,
      productos: productos.map(p => ({
        producto: p.producto,
        stock: p.cantidad,
        empresa: p.tienda
      }))
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return productos;
  } catch (error) {
    console.error('❌ Error en obtenerTodosProductosALLSTARS:', error);
    return [];
  }
};


