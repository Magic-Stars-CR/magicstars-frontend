'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PedidosPaginationProps {
  currentPage: number;
  totalPages: number;
  totalPedidos: number;
  pageSize: number;
  hasServerSideFilters: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function PedidosPagination({
  currentPage,
  totalPages,
  totalPedidos,
  pageSize,
  hasServerSideFilters,
  onPageChange,
  onPageSizeChange,
}: PedidosPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Información de paginación */}
          <div className="text-sm text-muted-foreground">
            {hasServerSideFilters ? (
              <>Mostrando página {currentPage} de {totalPages} ({totalPedidos} pedidos filtrados)</>
            ) : (
              <>Mostrando página {currentPage} de {totalPages} ({totalPedidos} pedidos totales)</>
            )}
          </div>

          {/* Selector de tamaño de página */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Registros por página:</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Controles de paginación */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100'}
                />
              </PaginationItem>
              
              {visiblePages.map((page, index) => {
                if (page === '...') {
                  return (
                    <PaginationItem key={`dots-${index}`}>
                      <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
                    </PaginationItem>
                  );
                }
                
                const pageNumber = page as number;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* Navegación rápida */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="text-xs"
          >
            <ChevronLeft className="w-3 h-3 mr-1" />
            Primera
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="text-xs"
          >
            Última
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
