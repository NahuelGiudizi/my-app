// src/app/api/admin/sucursales/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const sucursales = await prisma.sucursal.findMany({
      orderBy: {
        nombre: 'asc',
      },
      include: {
        diasAtencion: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    // Transform the result to ensure consistent structure
    const transformedSucursales = sucursales.map(sucursal => ({
      ...sucursal,
      diasAtencion: sucursal.diasAtencion.map(dia => dia.nombre)
    }));
    
    return NextResponse.json(transformedSucursales);
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    return NextResponse.json(
      { error: 'Error al obtener sucursales' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Ensure days exist before connecting
    await Promise.all(
      data.diasAtencion.split(',').map(async (dia: string) => {
        await prisma.diaAtencion.upsert({
          where: { nombre: dia.trim() },
          update: {},
          create: { nombre: dia.trim() }
        })
      })
    );

    const sucursalData = {
      ...data,
      horarioInicio: new Date(`2023-01-01T${data.horarioInicio}:00`),
      horarioFin: new Date(`2023-01-01T${data.horarioFin}:00`),
      // Convert diasAtencion to array of connected DiaAtencion
      diasAtencion: {
        connect: data.diasAtencion.split(',').map((dia: string) => ({ nombre: dia.trim() }))
      }
    };
    
    const sucursal = await prisma.sucursal.create({
      data: sucursalData,
      include: {
        diasAtencion: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    // Transform the result to ensure consistent structure
    const transformedSucursal = {
      ...sucursal,
      diasAtencion: sucursal.diasAtencion.map(dia => dia.nombre)
    };
    
    return NextResponse.json(transformedSucursal, { status: 201 });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    return NextResponse.json(
      { error: 'Error al crear sucursal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}