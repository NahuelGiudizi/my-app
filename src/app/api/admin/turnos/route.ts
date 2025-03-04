import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

// Comprehensive type definitions
interface Servicio {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
}

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string; // Make telefono optional
}

interface Barbero {
  id: number;
  nombre: string;
  apellido: string;
}

interface Sucursal {
  id: number;
  nombre: string;
}

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
            email: true,
            telefono: true // Include telefono in the selection
          }
        },
        sucursal: {
          select: {
            id: true,
            nombre: true
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

    // Timezone to use (adjust as needed)
    const timeZone = 'America/Buenos_Aires';

    // Transform the data to match your frontend interface
    const formattedTurnos = turnos.map(turno => {
      // Convert the stored UTC time to the specified timezone
      const localDate = utcToZonedTime(turno.fecha, timeZone);

      // Calculate total price and duration for services
      const servicios: Servicio[] = turno.servicios.map(s => ({
        id: s.servicio.id,
        nombre: s.servicio.nombre,
        duracion: s.servicio.duracion,
        precio: Number(s.servicio.precio)
      }));

      const precioTotal = servicios.reduce((total, s) => total + s.precio, 0);
      const duracionTotal = servicios.reduce((total, s) => total + s.duracion, 0);

      return {
        id: turno.id,
        fecha: format(localDate, 'dd/MM/yyyy, HH:mm a'), // Format as requested
        fechaISO: localDate.toISOString(), // Keep ISO string for sorting/backend use
        estado: turno.estado,
        cliente: {
          nombre: `${turno.cliente.nombre} ${turno.cliente.apellido}`.trim(),
          email: turno.cliente.email,
          telefono: turno.cliente.telefono || '' // Handle potential undefined
        },
        barbero: {
          nombre: `${turno.barbero.nombre} ${turno.barbero.apellido}`.trim()
        },
        sucursal: {
          id: turno.sucursal?.id,
          nombre: turno.sucursal?.nombre
        },
        servicios,
        precioTotal,
        duracionTotal
      };
    });

    return NextResponse.json(formattedTurnos);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json(
      { error: 'Error al obtener turnos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Utility function for saving turns with correct timezone handling
export async function createTurno(data: any) {
  const timeZone = 'America/Buenos_Aires';
  
  // Create a date object in the specified timezone
  const localDate = new Date(data.fecha);
  
  // Adjust the date to UTC, accounting for timezone
  const utcDate = zonedTimeToUtc(localDate, timeZone);

  return prisma.turno.create({
    data: {
      ...data,
      fecha: utcDate
    }
  });
}