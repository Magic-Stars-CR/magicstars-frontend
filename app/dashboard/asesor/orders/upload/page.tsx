'use client';

import { CSVUpload } from '@/components/ui/csv-upload';

export default function UploadOrdersPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Subir Pedidos CSV</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Sube un archivo CSV con tus pedidos para procesarlos automáticamente. 
          Asegúrate de que el archivo tenga el formato correcto con todos los campos requeridos.
        </p>
      </div>
      
      <CSVUpload />
    </div>
  );
}
