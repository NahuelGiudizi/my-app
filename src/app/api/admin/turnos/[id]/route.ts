import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { estado } = await request.json();

    // Validar estados permitidos
    const estadosPermitidos = ['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO'];
    if (!estadosPermitidos.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      );
    }

    const turno = await prisma.turno.update({
      where: { id },
      data: { estado },
      include: {
        barbero: true,
        cliente: true,
        servicio: true,
      },
    });

    return NextResponse.json(turno);
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    return NextResponse.json(
      { error: 'Error al actualizar turno' },
      { status: 500 }
    );
  }
}