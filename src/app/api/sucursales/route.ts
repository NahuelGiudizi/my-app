//my-app\src\app\api\sucursales\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const sucursales = await prisma.sucursal.findMany({
      include: {
        diasAtencion: true
      }
    });
    
    return NextResponse.json(sucursales);
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    return NextResponse.json(
      { error: 'Error al obtener sucursales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos requeridos
    const { nombre, direccion, telefono, horarioInicio, horarioFin, diasAtencion } = body;
    
    if (!nombre || !direccion || !telefono || !horarioInicio || !horarioFin || !diasAtencion) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }
    
    // Crear la sucursal
    const sucursal = await prisma.sucursal.create({
      data: {
        nombre,
        direccion,
        telefono,
        horarioInicio,
        horarioFin,
        diasAtencion
      }
    });
    
    return NextResponse.json(sucursal, { status: 201 });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    return NextResponse.json(
      { error: 'Error al crear la sucursal' },
      { status: 500 }
    );
  }
}