// src/app/api/barberos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const incluirSucursales = searchParams.get('incluirSucursales') === 'true';

    let barberos;
    
    if (incluirSucursales) {
      // Obtener barberos CON sus relaciones a sucursales
      barberos = await prisma.barbero.findMany({
        include: {
          // Esto debe apuntar a la tabla de relación correcta según tu modelo
          sucursales: {
            select: {
              sucursalId: true,
              sucursal: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          }
        }
      });
    } else {
      // Obtener solo los barberos sin relaciones
      barberos = await prisma.barbero.findMany();
    }
    
    return NextResponse.json(barberos);
  } catch (error) {
    console.error('Error al obtener barberos:', error);
    return NextResponse.json(
      { error: 'Error al obtener barberos' },
      { status: 500 }
    );
  }
}