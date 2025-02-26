import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const turnos = await prisma.turno.findMany({
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
      orderBy: {
        fecha: 'desc'
      }
    });

    // Transform the data to match your frontend interface
    const formattedTurnos = turnos.map(turno => ({
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
    }));

    return NextResponse.json(formattedTurnos);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json(
      { error: 'Error al obtener turnos', details: error.message },
      { status: 500 }
    );
  }
}