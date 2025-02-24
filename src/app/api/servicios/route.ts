import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const servicios = await prisma.servicio.findMany();
    return NextResponse.json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}