import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const turnos = await prisma.turno.findMany({
      include: {
        barbero: true,
        cliente: true,
        servicio: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    return NextResponse.json(turnos);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json(
      { error: 'Error al obtener turnos' },
      { status: 500 }
    );
  }
}