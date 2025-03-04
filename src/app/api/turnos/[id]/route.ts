// src/app/api/turnos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const turnoId = parseInt(params.id);
    const { estado } = await request.json();
    
    if (!estado) {
      return NextResponse.json(
        { error: 'El estado es requerido' },
        { status: 400 }
      );
    }
    
    // Validar que el estado sea uno de los permitidos
    const estadosValidos = ['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      );
    }
    
    // Actualizar el estado del turno
    const turnoActualizado = await prisma.turno.update({
      where: { id: turnoId },
      data: { estado }
    });
    
    return NextResponse.json(turnoActualizado);
  } catch (error) {
    console.error('Error al actualizar el turno:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}