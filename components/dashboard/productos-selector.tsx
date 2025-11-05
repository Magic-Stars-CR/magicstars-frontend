'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus } from 'lucide-react';
import { ProductoInventario } from '@/lib/supabase-inventario';
import { cn } from '@/lib/utils';

interface ProductoSeleccionado {
  nombre: string;
  stock: number;
  cantidad: number;
}

interface ProductosSelectorProps {
  productos: ProductoSeleccionado[];
  onProductosChange: (productos: ProductoSeleccionado[]) => void;
  className?: string;
  productosDisponibles?: ProductoInventario[]; // Productos precargados
}

export function ProductosSelector({
  productos,
  onProductosChange,
  className,
  productosDisponibles = [],
}: ProductosSelectorProps) {
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<ProductoInventario[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [productoSeleccionadoIndex, setProductoSeleccionadoIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);

  // Buscar productos localmente cuando cambia el término de búsqueda
  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    // Búsqueda local en los productos precargados (almacenados en memoria)
    const terminoLower = busqueda.trim().toLowerCase();
    const resultados = productosDisponibles
      .filter((producto) => 
        producto.producto.toLowerCase().includes(terminoLower)
      )
      .slice(0, 8); // Limitar a 8 resultados
    
    console.log(`🔍 Buscando "${busqueda}": ${productosDisponibles.length} productos disponibles, ${resultados.length} resultados`);
    
    setSugerencias(resultados);
    setMostrarSugerencias(resultados.length > 0);
    setProductoSeleccionadoIndex(-1);
  }, [busqueda, productosDisponibles]);

  // Cerrar sugerencias cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const agregarProducto = (producto: ProductoInventario) => {
    // Verificar si el producto ya está en la lista
    const productoExistente = productos.find((p) => p.nombre === producto.producto);
    if (productoExistente) {
      // Si ya existe, incrementar la cantidad
      const nuevosProductos = productos.map((p) =>
        p.nombre === producto.producto
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      );
      onProductosChange(nuevosProductos);
      setBusqueda('');
      setMostrarSugerencias(false);
      inputRef.current?.focus();
      return;
    }

    const nuevoProducto: ProductoSeleccionado = {
      nombre: producto.producto,
      stock: producto.cantidad,
      cantidad: 1,
    };

    onProductosChange([...productos, nuevoProducto]);
    setBusqueda('');
    setMostrarSugerencias(false);
    inputRef.current?.focus();
  };

  const eliminarProducto = (index: number) => {
    const nuevosProductos = productos.filter((_, i) => i !== index);
    onProductosChange(nuevosProductos);
  };

  const incrementarCantidad = (index: number) => {
    const nuevosProductos = productos.map((p, i) =>
      i === index ? { ...p, cantidad: p.cantidad + 1 } : p
    );
    onProductosChange(nuevosProductos);
  };

  const decrementarCantidad = (index: number) => {
    const nuevosProductos = productos
      .map((p, i) => (i === index ? { ...p, cantidad: Math.max(1, p.cantidad - 1) } : p))
      .filter((p, i) => !(i === index && p.cantidad <= 0));
    onProductosChange(nuevosProductos);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && sugerencias.length > 0 && productoSeleccionadoIndex >= 0) {
      e.preventDefault();
      agregarProducto(sugerencias[productoSeleccionadoIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setProductoSeleccionadoIndex((prev) =>
        prev < sugerencias.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setProductoSeleccionadoIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setMostrarSugerencias(false);
      inputRef.current?.blur();
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800 border-red-300';
    if (stock < 10) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Input de búsqueda con autocompletado */}
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setMostrarSugerencias(true);
            }}
            onFocus={() => {
              if (sugerencias.length > 0) {
                setMostrarSugerencias(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar producto..."
            className="pr-8 h-7 text-[11px] py-1 px-2 bg-white"
          />
        </div>

        {/* Lista de sugerencias */}
        {mostrarSugerencias && sugerencias.length > 0 && (
          <div
            ref={sugerenciasRef}
            className="absolute z-50 w-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-auto"
          >
            {sugerencias.map((producto, index) => (
              <button
                key={`${producto.producto}-${index}`}
                type="button"
                onClick={() => agregarProducto(producto)}
                className={cn(
                  'w-full text-left px-2 py-1.5 hover:bg-gray-100 transition-colors flex items-center justify-between text-[11px]',
                  productoSeleccionadoIndex === index && 'bg-gray-100'
                )}
              >
                <span className="flex-1 truncate">{producto.producto}</span>
                <Badge
                  variant="outline"
                  className={cn('ml-1.5 text-[9px] px-1.5 py-0', getStockColor(producto.cantidad))}
                >
                  {producto.cantidad}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Mensaje cuando no hay sugerencias pero hay búsqueda */}
        {mostrarSugerencias &&
          sugerencias.length === 0 &&
          busqueda.trim().length >= 2 && (
            <div className="absolute z-50 w-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg p-2 text-center text-gray-500 text-[10px]">
              No se encontraron productos
            </div>
          )}
      </div>

      {/* Lista de productos seleccionados */}
      {productos.length > 0 && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {productos.map((producto, index) => (
              <Badge
                key={`${producto.nombre}-${index}`}
                variant="outline"
                className={cn(
                  'px-1.5 py-0.5 flex items-center gap-1 text-[10px]',
                  getStockColor(producto.stock)
                )}
              >
                <span className="font-medium truncate max-w-[150px]">{producto.nombre}</span>
                
                {/* Controles de cantidad */}
                <div className="flex items-center gap-0.5 border-l border-gray-300 pl-1 ml-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => decrementarCantidad(index)}
                    className="h-4 w-4 p-0 hover:bg-opacity-80"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </Button>
                  <span className="text-[10px] font-semibold w-4 text-center">{producto.cantidad}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => incrementarCantidad(index)}
                    className="h-4 w-4 p-0 hover:bg-opacity-80"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </Button>
                </div>
                
                <span className="text-[9px] border-l border-gray-300 pl-1 ml-0.5">
                  ({producto.stock})
                </span>
                
                <button
                  type="button"
                  onClick={() => eliminarProducto(index)}
                  className="ml-0.5 hover:bg-opacity-80 rounded-full p-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Texto de ayuda */}
      {productos.length === 0 && (
        <p className="text-[9px] text-gray-500">
          Escribe para buscar productos de ALL STARS y añadirlos uno por uno
        </p>
      )}
    </div>
  );
}

