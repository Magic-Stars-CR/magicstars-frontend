import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_URL = 'https://primary-production-85ff.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Proxy: Sincronizando registros...');
    
    const response = await fetch(`${RAILWAY_URL}/webhook/Sync-Today-Registries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor Railway:', response.status, errorText);
      return NextResponse.json(
        { error: `Error del servidor: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Sincronización de registros exitosa');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error en proxy de sincronización de registros:', error);
    return NextResponse.json(
      { error: 'Error al conectar con el servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// Exportar también GET para verificar que la ruta funciona
export async function GET() {
  return NextResponse.json({ message: 'Ruta de sincronización de registros activa' });
}

