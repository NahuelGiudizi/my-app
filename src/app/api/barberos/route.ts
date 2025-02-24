import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const barberos = await prisma.barbero.findMany();
    return NextResponse.json(barberos);
  } catch (error) {
    console.error('Error al obtener barberos:', error);
    return NextResponse.json({ error: 'Error al obtener barberos' }, { status: 500 });
  }
}