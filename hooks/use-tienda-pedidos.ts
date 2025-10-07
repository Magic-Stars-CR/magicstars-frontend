import { useState, useEffect, useCallback, useMemo } from 'react';
import { PedidoTest } from '@/lib/types';
import { 
  getPedidos, 
  getAllPedidos, 
  updatePedido,
  crearPedidoTienda,
  confirmarPedidoTienda,
  desconfirmarPedidoTienda,
  eliminarPedidoTienda,
  getLiquidacionTienda
} from '@/lib/supabase-pedidos';

export interface TiendaPedidosFilters {
  searchTerm: string;
  statusFilter: string;
  distritoFilter: string;
  mensajeroFilter: string;
  tiendaFilter: string;
  dateFilter: string;
  specificDate: string;
  dateRange: { start: string; end: string };
  metodoPagoFilter: string;
  showFutureOrders: boolean;
}

export interface TiendaPedidosStats {
  total: number;
  asignados: number;
  entregados: number;
  sinAsignar: number;
  devoluciones: number;
  reagendados: number;
  valorTotal: number;
  efectivo: number;
  sinpe: number;
  tarjeta: number;
  dosPagos: number;
}

export interface TiendaPedidosPagination {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalPedidos: number;
}

const initialFilters: TiendaPedidosFilters = {
  searchTerm: '',
  statusFilter: 'all',
  distritoFilter: 'all',
  mensajeroFilter: 'all',
  tiendaFilter: 'all',
  dateFilter: 'all',
  specificDate: '',
  dateRange: { start: '', end: '' },
  metodoPagoFilter: 'all',
  showFutureOrders: false,
};

export function useTiendaPedidos(tiendaName: string) {
  const [pedidos, setPedidos] = useState<PedidoTest[]>([]);
  const [allPedidos, setAllPedidos] = useState<PedidoTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filters, setFilters] = useState<TiendaPedidosFilters>(initialFilters);
  const [pagination, setPagination] = useState<TiendaPedidosPagination>({
    currentPage: 1,
    pageSize: 20, // Menos pedidos por página para tiendas
    totalPages: 0,
    totalPedidos: 0,
  });

  // Función auxiliar para obtener fecha simple de Costa Rica
  const getCostaRicaDateSimple = useCallback((date: Date | string | null | undefined) => {
    if (!date || date === null || date === undefined) {
      return null;
    }
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      if (date.includes('-')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          dateObj = new Date(year, month, day);
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return null;
    }
    
    const timestamp = dateObj.getTime();
    if (timestamp === 0 || (timestamp > -86400000 && timestamp < 86400000)) {
      return null;
    }
    
    const crDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Costa_Rica' }));
    return crDate.toISOString().split('T')[0];
  }, []);

  // Verificar si hay filtros activos que requieren recarga de datos
  const hasServerSideFilters = useMemo(() => {
    const hasFilters = filters.statusFilter !== 'all' || 
           filters.distritoFilter !== 'all' || 
           filters.mensajeroFilter !== 'all' || 
           filters.tiendaFilter !== 'all' ||
           filters.dateFilter !== 'all' || 
           filters.specificDate !== '' || 
           (filters.dateRange.start !== '' && filters.dateRange.end !== '') || 
           filters.metodoPagoFilter !== 'all' ||
           filters.showFutureOrders;
    
    return hasFilters;
  }, [filters]);

  // Función de filtrado optimizada para tienda específica
  const filterPedidos = useCallback((pedidosToFilter: PedidoTest[]) => {
    const filtered = pedidosToFilter.filter(pedido => {
      if (!pedido.id_pedido) return false;

      // Filtro principal: solo pedidos de la tienda específica
      const matchesTienda = (pedido.tienda || '').toLowerCase().trim() === tiendaName.toLowerCase().trim();

      if (!matchesTienda) return false;

      // Filtro de búsqueda
      const matchesSearch = filters.searchTerm === '' || 
        (pedido.id_pedido?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase()) ||
        (pedido.cliente_nombre?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase()) ||
        (pedido.cliente_telefono?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase()) ||
        (pedido.distrito?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase()) ||
        (pedido.productos?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase()) ||
        (pedido.mensajero_asignado && pedido.mensajero_asignado.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      // Filtro de estado
      const matchesStatus = filters.statusFilter === 'all' || 
        (filters.statusFilter === 'asignado' && pedido.mensajero_asignado && !pedido.mensajero_concretado) ||
        (filters.statusFilter === 'entregado' && pedido.mensajero_concretado) ||
        (filters.statusFilter === 'sin_asignar' && !pedido.mensajero_asignado) ||
        (filters.statusFilter === 'devolucion' && pedido.estado_pedido === 'devolucion') ||
        (filters.statusFilter === 'reagendado' && pedido.estado_pedido === 'reagendado');

      // Filtros simples
      const matchesDistrito = filters.distritoFilter === 'all' || pedido.distrito === filters.distritoFilter;
      const matchesMensajero = filters.mensajeroFilter === 'all' || pedido.mensajero_asignado === filters.mensajeroFilter;
      const matchesTiendaFilter = filters.tiendaFilter === 'all' || pedido.tienda === filters.tiendaFilter;
      const matchesMetodoPago = filters.metodoPagoFilter === 'all' || 
        (pedido.metodo_pago && pedido.metodo_pago.toLowerCase() === filters.metodoPagoFilter.toLowerCase()) ||
        (filters.metodoPagoFilter === '2pagos' && pedido.metodo_pago && 
         (pedido.metodo_pago.toLowerCase() === '2pagos' || pedido.metodo_pago.toLowerCase() === '2 pagos'));

      // Filtro de fecha
      let matchesDate = true;
      const orderDateSimple = getCostaRicaDateSimple(pedido.fecha_creacion);
      
      if (!orderDateSimple) {
        if (filters.dateFilter === 'all' && !filters.showFutureOrders) {
          matchesDate = false;
        } else {
          matchesDate = false;
        }
      } else {
        const today = new Date();
        const todaySimple = getCostaRicaDateSimple(today);
        
        if (!filters.showFutureOrders && todaySimple && orderDateSimple && orderDateSimple > todaySimple) {
          matchesDate = false;
        } else if (filters.dateFilter !== 'all' && todaySimple) {
          switch (filters.dateFilter) {
            case 'today':
              matchesDate = orderDateSimple === todaySimple;
              break;
            case 'yesterday':
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdaySimple = getCostaRicaDateSimple(yesterday);
              matchesDate = orderDateSimple === yesterdaySimple;
              break;
            case 'week':
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              const weekAgoSimple = getCostaRicaDateSimple(weekAgo);
              matchesDate = orderDateSimple && weekAgoSimple ? orderDateSimple >= weekAgoSimple : false;
              break;
            case 'month':
              const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
              const monthAgoSimple = getCostaRicaDateSimple(monthAgo);
              matchesDate = orderDateSimple && monthAgoSimple ? orderDateSimple >= monthAgoSimple : false;
              break;
            case 'last_month':
              const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
              const lastMonthStartSimple = getCostaRicaDateSimple(lastMonthStart);
              const lastMonthEndSimple = getCostaRicaDateSimple(lastMonthEnd);
              matchesDate = orderDateSimple && lastMonthStartSimple && lastMonthEndSimple ? 
                           orderDateSimple >= lastMonthStartSimple && orderDateSimple <= lastMonthEndSimple : false;
              break;
            case 'year':
              const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
              const yearAgoSimple = getCostaRicaDateSimple(yearAgo);
              matchesDate = orderDateSimple && yearAgoSimple ? orderDateSimple >= yearAgoSimple : false;
              break;
            case 'specific':
              if (filters.specificDate) {
                const specificDateSimple = getCostaRicaDateSimple(filters.specificDate);
                matchesDate = orderDateSimple === specificDateSimple;
              }
              break;
            case 'range':
              if (filters.dateRange.start && filters.dateRange.end) {
                const startDateSimple = getCostaRicaDateSimple(filters.dateRange.start);
                const endDateSimple = getCostaRicaDateSimple(filters.dateRange.end);
                matchesDate = orderDateSimple && startDateSimple && endDateSimple ? 
                  orderDateSimple >= startDateSimple && orderDateSimple <= endDateSimple : false;
              }
              break;
          }
        }
      }

      const matches = matchesSearch && matchesStatus && matchesDistrito && matchesMensajero && 
                     matchesTiendaFilter && matchesDate && matchesMetodoPago;
      
      return matches;
    });
    
    // Ordenar pedidos por fecha de creación descendente (más recientes primero)
    const sorted = filtered.sort((a, b) => {
      const dateA = getCostaRicaDateSimple(a.fecha_creacion);
      const dateB = getCostaRicaDateSimple(b.fecha_creacion);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateB.localeCompare(dateA);
    });
    
    return sorted;
  }, [filters, getCostaRicaDateSimple, tiendaName]);

  // Cargar pedidos con paginación
  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔄 Cargando pedidos para tienda: ${tiendaName}`);
      
      // Siempre cargar todos los pedidos y filtrar por tienda
      const allData = await getAllPedidos();
      console.log(`📊 Total de pedidos obtenidos: ${allData.length}`);
      
      // Filtrar solo los pedidos de la tienda específica
      const tiendaPedidos = allData.filter(pedido => {
        const pedidoTienda = (pedido.tienda || '').toLowerCase().trim();
        const tiendaFiltro = tiendaName.toLowerCase().trim();
        const matches = pedidoTienda === tiendaFiltro;
        if (matches) {
          console.log(`✅ Pedido ${pedido.id_pedido} coincide con tienda ${tiendaName}`);
        }
        return matches;
      });
      
      console.log(`🏪 Pedidos de la tienda ${tiendaName}: ${tiendaPedidos.length}`);
      
      // Aplicar filtros adicionales si están activos
      const filtered = hasServerSideFilters ? filterPedidos(tiendaPedidos) : tiendaPedidos;
      console.log(`🔍 Pedidos después de filtros: ${filtered.length}`);
      
      // Aplicar paginación
      const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedData = filtered.slice(startIndex, endIndex);
      
      console.log(`📄 Página ${pagination.currentPage}: ${paginatedData.length} pedidos de ${filtered.length} total`);
      
      setPedidos(paginatedData);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(filtered.length / pagination.pageSize),
        totalPedidos: filtered.length,
      }));
    } catch (error) {
      console.error('Error loading pedidos:', error);
    } finally {
      setLoading(false);
    }
  }, [hasServerSideFilters, filterPedidos, pagination.currentPage, pagination.pageSize, tiendaName]);

  // Cargar todos los pedidos para filtros
  const loadAllPedidosForFilters = useCallback(async () => {
    try {
      setLoadingFilters(true);
      console.log(`🔄 Cargando todos los pedidos para filtros de tienda: ${tiendaName}`);
      
      const allData = await getAllPedidos();
      console.log(`📊 Total de pedidos para filtros: ${allData.length}`);
      
      // Filtrar solo los pedidos de la tienda específica
      const tiendaPedidos = allData.filter(pedido => {
        const pedidoTienda = (pedido.tienda || '').toLowerCase().trim();
        const tiendaFiltro = tiendaName.toLowerCase().trim();
        return pedidoTienda === tiendaFiltro;
      });
      
      console.log(`🏪 Pedidos de la tienda para filtros: ${tiendaPedidos.length}`);
      setAllPedidos(tiendaPedidos);
    } catch (error) {
      console.error('Error loading all pedidos for filters:', error);
    } finally {
      setLoadingFilters(false);
    }
  }, [tiendaName]);

  // Calcular estadísticas
  const stats = useMemo((): TiendaPedidosStats => {
    const dataSource = allPedidos.length > 0 ? allPedidos : pedidos;
    
    if (!hasServerSideFilters && !filters.searchTerm) {
      return {
        total: dataSource.length,
        asignados: dataSource.filter(p => p.mensajero_asignado && !p.mensajero_concretado).length,
        entregados: dataSource.filter(p => p.mensajero_concretado).length,
        sinAsignar: dataSource.filter(p => !p.mensajero_asignado).length,
        devoluciones: dataSource.filter(p => p.estado_pedido === 'devolucion').length,
        reagendados: dataSource.filter(p => p.estado_pedido === 'reagendado').length,
        valorTotal: dataSource.reduce((sum, p) => sum + p.valor_total, 0),
        efectivo: dataSource.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'efectivo').length,
        sinpe: dataSource.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'sinpe').length,
        tarjeta: dataSource.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'tarjeta').length,
        dosPagos: dataSource.filter(p => p.metodo_pago && (p.metodo_pago.toLowerCase() === '2pagos' || p.metodo_pago.toLowerCase() === '2 pagos')).length,
      };
    }

    const filtered = filterPedidos(dataSource);
    return {
      total: filtered.length,
      asignados: filtered.filter(p => p.mensajero_asignado && !p.mensajero_concretado).length,
      entregados: filtered.filter(p => p.mensajero_concretado).length,
      sinAsignar: filtered.filter(p => !p.mensajero_asignado).length,
      devoluciones: filtered.filter(p => p.estado_pedido === 'devolucion').length,
      reagendados: filtered.filter(p => p.estado_pedido === 'reagendado').length,
      valorTotal: filtered.reduce((sum, p) => sum + p.valor_total, 0),
      efectivo: filtered.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'efectivo').length,
      sinpe: filtered.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'sinpe').length,
      tarjeta: filtered.filter(p => p.metodo_pago && p.metodo_pago.toLowerCase() === 'tarjeta').length,
      dosPagos: filtered.filter(p => p.metodo_pago && (p.metodo_pago.toLowerCase() === '2pagos' || p.metodo_pago.toLowerCase() === '2 pagos')).length,
    };
  }, [allPedidos, pedidos, hasServerSideFilters, filters.searchTerm, filterPedidos]);

  // Obtener listas únicas para filtros (solo de la tienda)
  const filterOptions = useMemo(() => {
    const distritos = Array.from(new Set(allPedidos.map(p => p.distrito).filter(Boolean))).sort() as string[];
    const mensajerosAsignados = Array.from(new Set(allPedidos.map(p => p.mensajero_asignado).filter(Boolean))).sort() as string[];
    const tiendas = Array.from(new Set(allPedidos.map(p => p.tienda).filter(Boolean))).sort() as string[];
    const metodosPago = Array.from(new Set(allPedidos.map(p => p.metodo_pago).filter(Boolean))).sort() as string[];

    return {
      distritos,
      mensajeros: mensajerosAsignados,
      tiendas,
      metodosPago,
    };
  }, [allPedidos]);

  // Actualizar filtros
  const updateFilters = useCallback((newFilters: Partial<TiendaPedidosFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Actualizar paginación
  const updatePagination = useCallback((newPagination: Partial<TiendaPedidosPagination>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  // Actualizar pedido
  const updatePedidoStatus = useCallback(async (pedidoId: string, updates: Partial<PedidoTest>, usuario?: string) => {
    try {
      console.log(`🔄 Actualizando pedido ${pedidoId} por usuario: ${usuario || 'Tienda'}`);

      const success = await updatePedido(pedidoId, updates);
      if (success) {
        setPedidos(prevPedidos => 
          prevPedidos.map(pedido => 
            pedido.id_pedido === pedidoId 
              ? { ...pedido, ...updates }
              : pedido
          )
        );
        loadAllPedidosForFilters();
      }
      return success;
    } catch (error) {
      console.error('Error updating pedido:', error);
      return false;
    }
  }, [loadAllPedidosForFilters]);

  // Crear nuevo pedido
  const crearPedido = useCallback(async (pedidoData: Omit<PedidoTest, 'id_pedido' | 'fecha_creacion'>) => {
    try {
      const result = await crearPedidoTienda(pedidoData);
      if (result.success) {
        loadPedidos(); // Recargar la lista
        loadAllPedidosForFilters(); // Recargar filtros
      }
      return result;
    } catch (error) {
      console.error('Error creating pedido:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }, [loadPedidos, loadAllPedidosForFilters]);

  // Confirmar pedido
  const confirmarPedido = useCallback(async (pedidoId: string, usuario: string) => {
    try {
      const result = await confirmarPedidoTienda(pedidoId, usuario);
      if (result.success) {
        loadPedidos(); // Recargar la lista
        loadAllPedidosForFilters(); // Recargar filtros
      }
      return result;
    } catch (error) {
      console.error('Error confirming pedido:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }, [loadPedidos, loadAllPedidosForFilters]);

  // Desconfirmar pedido
  const desconfirmarPedido = useCallback(async (pedidoId: string, usuario: string, motivo?: string) => {
    try {
      const result = await desconfirmarPedidoTienda(pedidoId, usuario, motivo);
      if (result.success) {
        loadPedidos(); // Recargar la lista
        loadAllPedidosForFilters(); // Recargar filtros
      }
      return result;
    } catch (error) {
      console.error('Error desconfirming pedido:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }, [loadPedidos, loadAllPedidosForFilters]);

  // Eliminar pedido
  const eliminarPedido = useCallback(async (pedidoId: string, usuario: string, motivo?: string) => {
    try {
      const result = await eliminarPedidoTienda(pedidoId, usuario, motivo);
      if (result.success) {
        loadPedidos(); // Recargar la lista
        loadAllPedidosForFilters(); // Recargar filtros
      }
      return result;
    } catch (error) {
      console.error('Error deleting pedido:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }, [loadPedidos, loadAllPedidosForFilters]);

  // Obtener liquidación de la tienda
  const obtenerLiquidacion = useCallback(async (fecha?: string) => {
    try {
      return await getLiquidacionTienda(tiendaName, fecha);
    } catch (error) {
      console.error('Error getting liquidacion:', error);
      throw error;
    }
  }, [tiendaName]);

  // Efectos
  useEffect(() => {
    if (tiendaName) {
      loadPedidos();
    }
  }, [loadPedidos, tiendaName]);

  useEffect(() => {
    if (tiendaName) {
      loadAllPedidosForFilters();
    }
  }, [loadAllPedidosForFilters, tiendaName]);

  return {
    pedidos,
    allPedidos,
    loading,
    loadingFilters,
    filters,
    pagination,
    stats,
    filterOptions,
    hasServerSideFilters,
    updateFilters,
    clearAllFilters,
    updatePagination,
    updatePedidoStatus,
    loadPedidos,
    // Nuevas funciones de gestión de pedidos
    crearPedido,
    confirmarPedido,
    desconfirmarPedido,
    eliminarPedido,
    obtenerLiquidacion,
  };
}
