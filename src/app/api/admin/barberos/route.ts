// src/app/api/admin/barberos/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const barberoSchema = z.object({
  nombre: z.string().min(2).max(50),
  apellido: z.string().min(2).max(50),
  email: z.string().email(),
  telefono: z.string().optional(),
  foto: z.string().optional(),
  especialidad: z.string().optional(),
  experiencia: z.number().int().min(0).optional(),
  calificacion: z.number().min(0).max(5).optional(),
  sucursales: z.array(z.number()).optional()
});

export async function GET() {
  try {
    const barberos = await prisma.barbero.findMany({
      include: {
        sucursales: {
          include: {
            sucursal: true
          }
        }
      }
    });
    
    return NextResponse.json(barberos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching barbers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = barberoSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { sucursales, ...barberoData } = validation.data;
    
    const nuevoBarbero = await prisma.barbero.create({
      data: {
        ...barberoData,
        sucursales: sucursales ? {
          create: sucursales.map(sucursalId => ({
            sucursal: { connect: { id: sucursalId } }
          }))
        } : undefined
      },
      include: {
        sucursales: true
      }
    });

    return NextResponse.json(nuevoBarbero, { status: 201 });
  } catch (error) {
    console.error('Error creating barber:', error);
    return NextResponse.json(
      { error: 'Error creating barber' },
      { status: 500 }
    );
  }
}