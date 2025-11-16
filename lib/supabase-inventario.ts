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

export interface InventarioFilters {
  tienda?: string;
  search?: string;
  limit?: number;
}

const mapRowToProducto = (row: Record<string, any>, index: number): ProductoInventario => ({
  idx: typeof row.idx === 'number' ? row.idx : index,
  producto: row.producto || '',
  cantidad: Number(row.cantidad) || 0,
  tienda: row.tienda || '',
});

const buildLike = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return `%${trimmed.replace(/%/g, '')}%`;
};

export const obtenerInventario = async (
  filtros: InventarioFilters = {}
): Promise<ProductoInventario[]> => {
  try {
    let query = supabaseInventario
      .from('Inventario')
      .select('*');

    if (filtros.tienda) {
      const tiendaLike = buildLike(filtros.tienda);
      if (tiendaLike) {
        query = query.ilike('tienda', tiendaLike);
      }
    }

    if (filtros.search) {
      const searchLike = buildLike(filtros.search);
      if (searchLike) {
        query = query.ilike('producto', searchLike);
      }
    }

    query = query.order('producto', { ascending: true });

    if (filtros.limit && filtros.limit > 0) {
      query = query.limit(filtros.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error al consultar tabla Inventario:', error);
      return [];
    }

    const productos = (data ?? []).map((item, index) => mapRowToProducto(item, index));

    console.log(
      '📦 Inventario obtenido desde Supabase',
      JSON.stringify(
        {
          filtros: { ...filtros, search: filtros.search ? '<texto>' : undefined },
          total: productos.length,
        },
        null,
        2
      )
    );

    return productos;
  } catch (error) {
    console.error('❌ Error en obtenerInventario:', error);
    return [];
  }
};

export const obtenerInventarioPorTienda = async (tienda: string): Promise<ProductoInventario[]> => {
  return obtenerInventario({ tienda });
};

// Función para obtener TODOS los productos de ALL STARS (cargar una sola vez)
export const obtenerTodosProductosALLSTARS = async (): Promise<ProductoInventario[]> => {
  return obtenerInventarioPorTienda('ALL STARS');
};

