'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockApi } from '@/lib/mock-api';
import { Company, Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Package, Save, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateProduct() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    image: '',
    description: '',
    companyId: '',
    initialStock: '',
    minimumStock: '',
    maximumStock: '',
    location: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesRes = await mockApi.getCompanies();
      setCompanies(companiesRes);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar datos
      if (!formData.name || !formData.sku || !formData.companyId) {
        throw new Error('Los campos nombre, SKU y empresa son obligatorios');
      }

      if (parseFloat(formData.price) <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      // Crear el producto
      const newProduct: Product = {
        id: `product-${Date.now()}`,
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price) * 100, // Convertir a centavos
        image: formData.image || undefined,
        companyId: formData.companyId,
        company: companies.find(c => c.id === formData.companyId),
      };

      // Crear el item de inventario
      const inventoryItem = await mockApi.createInventoryItem({
        productId: newProduct.id,
        product: newProduct,
        companyId: formData.companyId,
        company: companies.find(c => c.id === formData.companyId),
        currentStock: parseInt(formData.initialStock) || 0,
        minimumStock: parseInt(formData.minimumStock) || 0,
        maximumStock: parseInt(formData.maximumStock) || 100,
        location: formData.location,
      });

      // Crear transacción inicial si hay stock
      if (parseInt(formData.initialStock) > 0) {
        await mockApi.createInventoryTransaction({
          inventoryItemId: inventoryItem.id,
          actionType: 'inicial',
          quantity: parseInt(formData.initialStock),
          reason: 'Stock inicial del producto',
          userId: '1', // Admin user
          user: { id: '1', name: 'Admin', email: 'admin@magicstars.com', role: 'admin' as any },
          notes: 'Creación de producto con stock inicial',
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/admin/inventory');
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <h2 className="text-2xl font-bold text-green-800 mb-2">¡Producto Creado!</h2>
            <p className="text-green-700">
              El producto <strong>{formData.name}</strong> ha sido creado exitosamente.
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
          <h1 className="text-3xl font-bold">Crear Nuevo Producto</h1>
          <p className="text-muted-foreground">
            Agrega un nuevo producto al inventario
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
          {/* Información del Producto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Información del Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Crema Facial Premium"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                  placeholder="Ej: CF-001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Ej: Cuidado Facial"
                />
              </div>

              <div>
                <Label htmlFor="price">Precio (₡) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="25000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image">URL de Imagen</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción del producto..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Inventario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Configuración de Inventario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyId">Empresa *</Label>
                <Select value={formData.companyId} onValueChange={(value) => handleInputChange('companyId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="initialStock">Stock Inicial</Label>
                <Input
                  id="initialStock"
                  type="number"
                  min="0"
                  value={formData.initialStock}
                  onChange={(e) => handleInputChange('initialStock', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="minimumStock">Stock Mínimo</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) => handleInputChange('minimumStock', e.target.value)}
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="maximumStock">Stock Máximo</Label>
                <Input
                  id="maximumStock"
                  type="number"
                  min="0"
                  value={formData.maximumStock}
                  onChange={(e) => handleInputChange('maximumStock', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ej: Almacén A - Estante 1"
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
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Producto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
