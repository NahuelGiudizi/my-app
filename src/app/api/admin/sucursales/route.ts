// src/app/api/admin/sucursales/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const sucursales = await prisma.sucursal.findMany({
      orderBy: {
        nombre: 'asc',
      },
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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const sucursal = await prisma.sucursal.create({
      data
    });
    
    return NextResponse.json(sucursal, { status: 201 });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    return NextResponse.json(
      { error: 'Error al crear sucursal' },
      { status: 500 }
    );
  }
}