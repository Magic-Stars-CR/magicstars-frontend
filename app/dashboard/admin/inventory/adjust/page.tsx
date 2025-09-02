'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockApi } from '@/lib/mock-api';
import { InventoryItem, Company } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Save, AlertCircle, Plus, Minus } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdjustInventory() {
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    inventoryItemId: '',
    adjustmentType: 'manual',
    quantityDifference: '',
    reason: '',
    notes: '',
  });

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, companiesRes] = await Promise.all([
        mockApi.getInventoryItems(),
        mockApi.getCompanies(),
      ]);
      setInventoryItems(itemsRes);
      setCompanies(companiesRes);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar datos
      if (!formData.inventoryItemId || !formData.quantityDifference || !formData.reason) {
        throw new Error('Los campos producto, cantidad y motivo son obligatorios');
      }

      const quantityDiff = parseInt(formData.quantityDifference);
      if (quantityDiff === 0) {
        throw new Error('La cantidad debe ser diferente de 0');
      }

      if (selectedItem && selectedItem.currentStock + quantityDiff < 0) {
        throw new Error('No se puede tener stock negativo');
      }

      // Obtener el usuario admin del mock
      const adminUser = await mockApi.getUsers().then(users => users.find(u => u.role === 'admin'));
      
      if (!adminUser) {
        throw new Error('Usuario administrador no encontrado');
      }

      // Crear el ajuste
      await mockApi.createInventoryAdjustment({
        inventoryItemId: formData.inventoryItemId,
        adjustmentType: formData.adjustmentType as any,
        quantityDifference: quantityDiff,
        reason: formData.reason,
        userId: adminUser.id,
        user: adminUser,
        notes: formData.notes,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/admin/inventory');
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al ajustar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'inventoryItemId') {
      const item = inventoryItems.find(i => i.id === value);
      setSelectedItem(item || null);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: 'out_of_stock', label: 'Agotado', color: 'destructive' };
    if (item.currentStock <= item.minimumStock) return { status: 'low_stock', label: 'Stock Bajo', color: 'destructive' };
    if (item.currentStock > item.maximumStock) return { status: 'overstock', label: 'Sobre Stock', color: 'secondary' };
    return { status: 'in_stock', label: 'En Stock', color: 'default' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/inventory">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inventario
            </Link>
          </Button>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">¡Ajuste Realizado!</h2>
            <p className="text-green-700">
              El inventario ha sido ajustado exitosamente.
            </p>
            <p className="text-sm text-green-600 mt-2">
              Redirigiendo al inventario...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin/inventory">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inventario
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Ajustar Inventario</h1>
          <p className="text-muted-foreground">
            Realiza ajustes manuales al inventario
          </p>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Selección del Producto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Seleccionar Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="inventoryItemId">Producto *</Label>
                <Select value={formData.inventoryItemId} onValueChange={(value) => handleInputChange('inventoryItemId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.product.name} - {item.company.name} (Stock: {item.currentStock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedItem && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">{selectedItem.product.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">SKU:</p>
                      <p className="font-medium">{selectedItem.product.sku}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Empresa:</p>
                      <p className="font-medium">{selectedItem.company.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock Actual:</p>
                      <p className="font-bold text-lg">{selectedItem.currentStock}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estado:</p>
                      <Badge variant={getStockStatus(selectedItem).color as any}>
                        {getStockStatus(selectedItem).label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock Mínimo:</p>
                      <p className="font-medium">{selectedItem.minimumStock}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock Máximo:</p>
                      <p className="font-medium">{selectedItem.maximumStock}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ubicación:</p>
                      <p className="font-medium">{selectedItem.location || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor Total:</p>
                      <p className="font-medium">{formatCurrency(selectedItem.currentStock * selectedItem.product.price)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración del Ajuste */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Configuración del Ajuste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adjustmentType">Tipo de Ajuste</Label>
                <Select value={formData.adjustmentType} onValueChange={(value) => handleInputChange('adjustmentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Ajuste Manual</SelectItem>
                    <SelectItem value="cycle_count">Conteo Cíclico</SelectItem>
                    <SelectItem value="damage">Producto Dañado</SelectItem>
                    <SelectItem value="loss">Pérdida</SelectItem>
                    <SelectItem value="found">Producto Encontrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantityDifference">Cantidad *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = parseInt(formData.quantityDifference) || 0;
                      handleInputChange('quantityDifference', (current - 1).toString());
                    }}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    id="quantityDifference"
                    type="number"
                    value={formData.quantityDifference}
                    onChange={(e) => handleInputChange('quantityDifference', e.target.value)}
                    placeholder="0"
                    className="text-center"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = parseInt(formData.quantityDifference) || 0;
                      handleInputChange('quantityDifference', (current + 1).toString());
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Positivo para aumentar, negativo para disminuir
                </p>
                {selectedItem && formData.quantityDifference && (
                  <p className="text-sm font-medium mt-2">
                    Nuevo stock: {selectedItem.currentStock + parseInt(formData.quantityDifference)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="reason">Motivo del Ajuste *</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="Ej: Productos encontrados en inventario físico"
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Información adicional sobre el ajuste..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/admin/inventory">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading || !selectedItem}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ajustando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Realizar Ajuste
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
