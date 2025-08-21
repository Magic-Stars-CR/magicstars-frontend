'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileText, 
  Download, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function UploadOrdersPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    success: number;
    errors: number;
    errorDetails: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Simular procesamiento del archivo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultados
      setResults({
        total: 25,
        success: 23,
        errors: 2,
        errorDetails: [
          'Línea 12: Teléfono inválido',
          'Línea 18: Dirección faltante'
        ]
      });
      
      setUploaded(true);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Crear y descargar template CSV
    const csvContent = `Nombre Cliente,Teléfono,Dirección,Monto,Método Pago,Notas
Juan Pérez,8888-8888,San José Centro,15000,efectivo,Entregar en recepción
María López,7777-7777,Curridabat,25000,sinpe,`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_pedidos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/asesor">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Cargar Pedidos</h1>
          <p className="text-muted-foreground">
            Importa múltiples pedidos desde un archivo CSV
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Subir Archivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csvFile">Seleccionar Archivo</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Solo archivos CSV. Máximo 5MB.
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Procesar Archivo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Template Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Descargar Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Descarga nuestro template CSV para asegurar que tu archivo tenga el formato correcto.
            </p>
            
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Descargar Template CSV
            </Button>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Formato Requerido:</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Nombre Cliente: Nombre completo del cliente</p>
                <p>• Teléfono: Formato 8888-8888</p>
                <p>• Dirección: Dirección completa de entrega</p>
                <p>• Monto: Cantidad en colones (sin símbolo de moneda)</p>
                <p>• Método Pago: "efectivo" o "sinpe"</p>
                <p>• Notas: Información adicional (opcional)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {uploaded && results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.errors === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              Resultados del Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{results.total}</p>
                <p className="text-sm text-muted-foreground">Total Procesados</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{results.success}</p>
                <p className="text-sm text-muted-foreground">Exitosos</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{results.errors}</p>
                <p className="text-sm text-muted-foreground">Con Errores</p>
              </div>
            </div>

            {results.errors > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-red-600">Detalles de Errores:</h4>
                <div className="space-y-1">
                  {results.errorDetails.map((error, index) => (
                    <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard/asesor/orders">
                  Ver Todos los Pedidos
                </Link>
              </Button>
              <Button onClick={() => {
                setFile(null);
                setUploaded(false);
                setResults(null);
              }}>
                Cargar Otro Archivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
