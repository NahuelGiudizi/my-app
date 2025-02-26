import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sucursalId = parseInt(params.id);
    
    if (isNaN(sucursalId)) {
      return NextResponse.json(
        { error: 'ID de sucursal inválido' },
        { status: 400 }
      );
    }

    // Verificar que la sucursal existe
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: sucursalId }
    });
    
    if (!sucursal) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }
    
    // Obtener todos los servicios (sin filtrar por sucursal por ahora)
    // En una implementación real, utilizarías una relación entre servicios y sucursales
    // Esto es una simplificación temporal
    const servicios = await prisma.servicio.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    
    return NextResponse.json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios de la sucursal:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}