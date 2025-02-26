import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID parsing
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de turno inválido' },
        { status: 400 }
      );
    }

    // Safely parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Cuerpo de la solicitud inválido' },
        { status: 400 }
      );
    }

    // Destructure and validate estado
    const { estado } = requestBody;
    const estadosPermitidos = ['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO'];
    if (!estado || !estadosPermitidos.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      );
    }

    try {
      const turno = await prisma.turno.update({
        where: { id },
        data: { estado },
        include: {
          barbero: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          },
          servicios: {
            include: {
              servicio: {
                select: {
                  id: true,
                  nombre: true,
                  duracion: true,
                  precio: true
                }
              }
            }
          }
        },
      });

      // Transform turno to match frontend interface
      const turnoFormateado = {
        id: turno.id,
        fecha: turno.fecha,
        estado: turno.estado,
        cliente: {
          nombre: turno.cliente.nombre,
          apellido: turno.cliente.apellido,
          email: turno.cliente.email
        },
        barbero: {
          nombre: turno.barbero.nombre,
          apellido: turno.barbero.apellido
        },
        servicio: {
          nombre: turno.servicios[0]?.servicio.nombre || '',
          duracion: turno.servicios[0]?.servicio.duracion || 0,
          precio: turno.servicios[0]?.servicio.precio || 0
        }
      };

      return NextResponse.json(turnoFormateado);

    } catch (updateError) {
      // Handle specific Prisma errors
      if (updateError instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (updateError.code === 'P2002') {
          return NextResponse.json(
            { error: 'No se puede actualizar el turno' },
            { status: 409 }
          );
        }
        // Record not found
        if (updateError.code === 'P2025') {
          return NextResponse.json(
            { error: 'Turno no encontrado' },
            { status: 404 }
          );
        }
      }

      // Rethrow other errors
      throw updateError;
    }

  } catch (error) {
    console.error('Error al actualizar turno:', error);
    
    // More detailed error logging for development
    const errorDetails = error instanceof Error 
      ? { 
          message: error.message, 
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }
      : { message: 'Error desconocido' };

    return NextResponse.json(
      { 
        error: 'Error al actualizar turno',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}