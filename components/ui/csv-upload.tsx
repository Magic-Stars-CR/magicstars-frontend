'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert';
import { Upload, Download, FileText, CheckCircle, XCircle, Eye, Loader2, AlertCircle, Link, Search, Package } from 'lucide-react';
import { mockApi } from '@/lib/mock-api';
import { useAuth } from '@/contexts/auth-context';
import { Order, Product } from '@/lib/types';
import { mockProducts } from '@/lib/mock-api';

interface CSVUploadResult {
  success: number;
  errors: string[];
}

interface UnmappedProduct {
  id: string;
  name: string;
  quantity: number;
  orderIndex: number;
  itemIndex: number;
  mappedProductId?: string;
  mappedProduct?: Product;
}

interface ProductMapping {
  [key: string]: string; // unmappedProductId -> mappedProductId
}

export function CSVUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<CSVUploadResult | null>(null);
  const [previewOrders, setPreviewOrders] = useState<Order[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [unmappedProducts, setUnmappedProducts] = useState<UnmappedProduct[]>([]);
  const [productMappings, setProductMappings] = useState<ProductMapping>({});
  const [showProductMapping, setShowProductMapping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
      setPreviewOrders([]);
      setShowPreview(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setResult(null);
      setPreviewOrders([]);
      setShowPreview(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const downloadTemplate = () => {
    const csvContent = `FECHA,ID,NOMBRE,PROVINCIA,CANTON,DISTRITO,DIRECCION,TELEFONO,VALOR,PRODUCTOS,LINK UBICACION,NOTA ASESOR,JORNADA DE RUTA`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Plantilla_CSV_Vacia_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewCSV = async () => {
    if (!file || !user?.companyId) return;
    
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);
      
      console.log('Headers encontrados:', headers);
      console.log('Líneas de datos:', dataLines.length);
      
      // Parse CSV and create preview orders
      const preview: Order[] = [];
      const unmappedProductsList: UnmappedProduct[] = [];
      const companies = await mockApi.getCompanies();
      const company = companies.find(c => c.id === user.companyId) || companies[0];
      const companyPrefix = user.companyId === '1' ? 'PMC' : user.companyId === '2' ? 'BF' : 'AS';
      
      // Filter products by company
      const companyProducts = mockProducts.filter(p => p.companyId === user.companyId);
      console.log('Productos de la empresa:', companyProducts.length);
      
      // Process ALL lines instead of limiting to 5
      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;
        
        try {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const [fecha, idCliente, nombre, provincia, canton, distrito, direccion, telefono, valor, productosCsv, linkUbicacion, notaAsesor, jornadaRuta] = values;
          
          console.log(`Línea ${i + 1}:`, { nombre, productosCsv, valor });
          
          if (nombre && direccion && telefono && valor) {
            // Parse products from CSV
            let orderItems: any[] = [];
            
            if (productosCsv && productosCsv.trim()) {
              // Split products by comma and parse "1 X PRODUCTO" format
              const productEntries = productosCsv.split(',').map(p => p.trim()).filter(Boolean);
              console.log(`Productos encontrados en línea ${i + 1}:`, productEntries);
              console.log(`Raw productosCsv: "${productosCsv}"`);
              console.log(`ProductEntries después del split:`, productEntries);
              console.log(`Número de entradas de productos:`, productEntries.length);
              
              for (let j = 0; j < productEntries.length; j++) {
                const productEntry = productEntries[j];
                console.log(`Procesando entrada ${j + 1}: "${productEntry}"`);
                
                // Parse "1 X CREATINA" format
                const match = productEntry.match(/^(\d+)\s*X\s*(.+)$/i);
                console.log(`Regex match para "${productEntry}":`, match);
                
                if (match) {
                  const quantity = parseInt(match[1]);
                  const productName = match[2].trim();
                  
                  console.log(`Producto parseado: cantidad=${quantity}, nombre="${productName}"`);
                  
                  // Find a matching product or create a simple item without price
                  const foundProduct = companyProducts.find(p => 
                    p.name.toLowerCase().includes(productName.toLowerCase()) ||
                    productName.toLowerCase().includes(p.name.toLowerCase())
                  );
                  
                  if (foundProduct) {
                    const newItem = {
                      id: `${foundProduct.id}-${j}`,
                      product: foundProduct,
                      quantity: quantity,
                      price: 0, // No individual price
                      totalPrice: 0 // No individual total
                    };
                    orderItems.push(newItem);
                    console.log(`Producto encontrado y agregado:`, foundProduct.name, `cantidad:`, quantity, `item:`, newItem);
                  } else {
                    // Add to unmapped products list
                    const unmappedProduct: UnmappedProduct = {
                      id: `unmapped-${i}-${j}`,
                      name: productName,
                      quantity: quantity,
                      orderIndex: i,
                      itemIndex: j
                    };
                    unmappedProductsList.push(unmappedProduct);
                    
                    // Create a simple product item without price
                    const simpleProduct = {
                      id: `simple-${i}-${j}`,
                      sku: `SIMPLE-${i}-${j}`,
                      name: productName,
                      category: 'General',
                      price: 0, // No price
                      companyId: user.companyId
                    };
                    
                    const newItem = {
                      id: simpleProduct.id,
                      product: simpleProduct,
                      quantity: quantity,
                      price: 0, // No individual price
                      totalPrice: 0 // No individual total
                    };
                    orderItems.push(newItem);
                    console.log(`Producto simple creado y agregado:`, productName, `cantidad:`, quantity, `item:`, newItem);
                  }
                } else {
                  // Fallback: treat as single product with quantity 1
                  const productName = productEntry.trim();
                  console.log(`Producto sin formato estándar:`, productName);
                  
                  const foundProduct = companyProducts.find(p => 
                    p.name.toLowerCase().includes(productName.toLowerCase()) ||
                    productName.toLowerCase().includes(p.name.toLowerCase())
                  );
                  
                  if (foundProduct) {
                    const newItem = {
                      id: `${foundProduct.id}-${j}`,
                      product: foundProduct,
                      quantity: 1,
                      price: 0, // No individual price
                      totalPrice: 0 // No individual total
                    };
                    orderItems.push(newItem);
                    console.log(`Producto fallback encontrado y agregado:`, foundProduct.name, `item:`, newItem);
                  } else {
                    // Add to unmapped products list
                    const unmappedProduct: UnmappedProduct = {
                      id: `unmapped-${i}-${j}`,
                      name: productName,
                      quantity: 1,
                      orderIndex: i,
                      itemIndex: j
                    };
                    unmappedProductsList.push(unmappedProduct);
                    
                    const simpleProduct = {
                      id: `simple-${i}-${j}`,
                      sku: `SIMPLE-${i}-${j}`,
                      name: productName,
                      category: 'General',
                      price: 0, // No price
                      companyId: user.companyId
                    };
                    
                    const newItem = {
                      id: simpleProduct.id,
                      product: simpleProduct,
                      quantity: 1,
                      price: 0, // No individual price
                      totalPrice: 0 // No individual total
                    };
                    orderItems.push(newItem);
                    console.log(`Producto fallback simple creado y agregado:`, productName, `item:`, newItem);
                  }
                }
                
                console.log(`orderItems después de procesar entrada ${j + 1}:`, orderItems.length, orderItems);
              }
              
              console.log(`Total de items generados para línea ${i + 1}:`, orderItems.length);
              console.log(`Items finales:`, orderItems);
            }
            
            const previewOrder: Order = {
              id: `${companyPrefix}-PREVIEW-${i + 1}`,
              customerName: nombre,
              customerPhone: telefono,
              customerAddress: direccion,
              customerProvince: provincia || 'San José',
              customerCanton: canton || 'CENTRAL',
              customerDistrict: distrito || 'CARMEN',
              customerLocationLink: linkUbicacion || undefined,
              items: orderItems,
              totalAmount: parseFloat(valor) || 0,
              status: 'pendiente',
              paymentMethod: 'efectivo',
              origin: 'csv',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              notes: notaAsesor || undefined,
              deliveryAddress: direccion,
              companyId: user.companyId,
              company: company,
              routeSchedule: jornadaRuta || 'DIA',
            };
            
            console.log(`Pedido creado para línea ${i + 1}:`, previewOrder);
            console.log(`Items en el pedido:`, previewOrder.items.length, previewOrder.items);
            
            preview.push(previewOrder);
          }
        } catch (error) {
          console.error('Error parsing preview line:', error);
        }
      }
      
      console.log('Pedidos de vista previa generados:', preview.length);
      console.log('Primer pedido:', preview[0]);
      console.log('Productos no encontrados:', unmappedProductsList.length);
      
      setPreviewOrders(preview);
      setUnmappedProducts(unmappedProductsList);
      setShowPreview(true);
      setShowProductMapping(unmappedProductsList.length > 0);
    } catch (error) {
      console.error('Error en previewCSV:', error);
      alert('Error al leer el archivo');
    }
  };

  const processCSV = async () => {
    if (!file || !user?.companyId) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const result = await mockApi.processCSVUpload(text, user.companyId);
      setResult(result);
      setShowPreview(false);
    } catch (error) {
      console.error('Error processing CSV:', error);
      setResult({
        success: 0,
        errors: ['Error al procesar el archivo CSV']
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProductMapping = (unmappedProductId: string, mappedProductId: string) => {
    setProductMappings(prev => ({
      ...prev,
      [unmappedProductId]: mappedProductId
    }));
  };

  const applyProductMappings = () => {
    const updatedOrders = previewOrders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const mapping = productMappings[item.id];
        if (mapping) {
          const mappedProduct = mockProducts.find(p => p.id === mapping);
          if (mappedProduct) {
            return {
              ...item,
              product: mappedProduct
            };
          }
        }
        return item;
      })
    }));
    
    setPreviewOrders(updatedOrders);
    setShowProductMapping(false);
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setPreviewOrders([]);
    setShowPreview(false);
    setUnmappedProducts([]);
    setProductMappings({});
    setShowProductMapping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Upload className="w-6 h-6 text-gray-600" />
            </div>
            Subir Archivo CSV
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Arrastra tu archivo CSV aquí o haz clic para seleccionarlo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              file 
                ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={openFileSelector}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-green-800">{file.name}</p>
                  <p className="text-green-600 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <Upload className="w-10 h-10 text-gray-500" />
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-700">
                    Arrastra tu archivo CSV aquí
                  </p>
                  <p className="text-gray-500 mt-1">
                    o haz clic para seleccionar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Template Download Button - Moved here */}
          <div className="flex justify-center">
            <Button onClick={downloadTemplate} variant="outline" className="px-6 py-3 text-base font-medium border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors duration-200">
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla Vacía
            </Button>
          </div>

          {/* Action Buttons */}
          {file && (
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={previewCSV}
                variant="outline"
                className="px-6 py-3 text-base font-medium border-2 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors duration-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
              
              <Button
                onClick={processCSV}
                disabled={isUploading}
                className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Pedidos
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetForm}
                variant="outline"
                className="px-6 py-3 text-base font-medium border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors duration-200"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Descartar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {showPreview && previewOrders.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-3xl font-bold text-orange-800">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Eye className="w-8 h-8 text-orange-600" />
              </div>
              Vista Previa de Pedidos ({previewOrders.length})
            </CardTitle>
            <CardDescription className="text-xl text-orange-700">
              Revisa cómo se verán todos tus pedidos antes de subirlos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[70vh] overflow-y-auto pr-2">
              {previewOrders.map((order, index) => (
                <div key={order.id} className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-900 text-lg">{order.customerName}</h4>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        {order.customerAddress}
                      </p>
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        Tel: {order.customerPhone}
                      </p>
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        Monto: ₡{order.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        {order.customerDistrict}, {order.customerCanton}
                      </p>
                    </div>
                    
                    {/* Products Section */}
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-800 text-sm border-t border-gray-100 pt-2">Productos:</h5>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {order.items.map((item, itemIndex) => {
                            console.log(`Renderizando item ${itemIndex}:`, item);
                            return (
                              <div key={itemIndex} className="flex items-center py-1 text-xs border-b border-gray-200 last:border-b-0">
                                <span className="text-gray-700 font-medium">{item.product.name}</span>
                                <span className="text-gray-500 ml-2">x{item.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {(!order.items || order.items.length === 0) && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-800 text-sm border-t border-gray-100 pt-2">Productos:</h5>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-500 italic text-xs">Sin productos especificados</p>
                          <p className="text-gray-400 text-xs mt-1">Items: {order.items?.length || 0}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary Footer */}
            <div className="mt-8 text-center">
              <div className="bg-orange-100 px-6 py-4 rounded-xl inline-block">
                <p className="text-lg text-orange-800 font-semibold">
                  Mostrando todos los {previewOrders.length} pedidos del archivo CSV
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  Total estimado: ₡{previewOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Mapping Section */}
      {showProductMapping && unmappedProducts.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-amber-800">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Link className="w-8 h-8 text-amber-600" />
              </div>
              Productos No Encontrados ({unmappedProducts.length})
            </CardTitle>
            <CardDescription className="text-lg text-amber-700">
              Enlaza los productos del CSV con productos existentes en tu inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Los siguientes productos no se encontraron en tu inventario. Selecciona un producto existente para cada uno o déjalos sin mapear.
                </AlertDescription>
              </Alert>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-100">
                      <TableHead className="font-semibold text-amber-900">Producto del CSV</TableHead>
                      <TableHead className="font-semibold text-amber-900">Cantidad</TableHead>
                      <TableHead className="font-semibold text-amber-900">Pedido #</TableHead>
                      <TableHead className="font-semibold text-amber-900">Enlazar con Producto</TableHead>
                      <TableHead className="font-semibold text-amber-900">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unmappedProducts.map((unmappedProduct) => {
                      const mappedProduct = productMappings[unmappedProduct.id] 
                        ? mockProducts.find(p => p.id === productMappings[unmappedProduct.id])
                        : null;
                      
                      return (
                        <TableRow key={unmappedProduct.id} className="hover:bg-amber-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-amber-600" />
                              {unmappedProduct.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              {unmappedProduct.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              #{unmappedProduct.orderIndex + 1}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={productMappings[unmappedProduct.id] || ''}
                              onValueChange={(value) => handleProductMapping(unmappedProduct.id, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar producto..." />
                              </SelectTrigger>
                              <SelectContent>
                                {mockProducts
                                  .filter(p => p.companyId === user?.companyId)
                                  .map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{product.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                          (SKU: {product.sku})
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {mappedProduct ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Enlazado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                Sin enlazar
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-amber-200">
                <div className="text-sm text-amber-700">
                  <span className="font-medium">
                    {Object.keys(productMappings).length} de {unmappedProducts.length} productos enlazados
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowProductMapping(false)}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Omitir por ahora
                  </Button>
                  <Button
                    onClick={applyProductMappings}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Aplicar Enlaces
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <Card className={`border-0 shadow-lg ${
          result.success > 0 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50' 
            : 'bg-gradient-to-br from-red-50 to-rose-50'
        }`}>
          <CardHeader className="pb-4">
            <CardTitle className={`flex items-center gap-3 text-2xl font-bold ${
              result.success > 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              <div className={`p-2 rounded-lg ${
                result.success > 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {result.success > 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              Resultado del Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success > 0 ? (
              <div className="space-y-4">
                <div className="bg-green-100 p-6 rounded-xl border border-green-200">
                  <p className="text-green-800 font-semibold text-lg text-center">
                    ✅ Se procesaron {result.success} pedidos exitosamente
                  </p>
                </div>
                {result.errors.length > 0 && (
                  <div className="bg-yellow-100 p-6 rounded-xl border border-yellow-200">
                    <p className="text-yellow-800 font-semibold mb-3 text-lg">⚠️ Advertencias:</p>
                    <ul className="text-sm text-yellow-700 space-y-2">
                      {result.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-100 p-6 rounded-xl border border-red-200">
                  <p className="text-red-800 font-semibold mb-3 text-lg">❌ Errores encontrados:</p>
                  <ul className="text-sm text-red-700 space-y-2">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={resetForm} 
                variant="outline"
                className="px-8 py-3 text-base font-medium border-2 hover:bg-gray-50 transition-colors duration-200"
              >
                Subir Otro CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
