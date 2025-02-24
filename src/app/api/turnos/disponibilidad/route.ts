// src/app/api/turnos/disponibilidad/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, addMinutes, format } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');
  const barberoId = searchParams.get('barberoId');

  if (!fecha || !barberoId) {
    return NextResponse.json(
      { error: 'Fecha y barberoId son requeridos' },
      { status: 400 }
    );
  }

  try {
    const fechaBase = new Date(fecha);
    
    // Obtener todos los turnos del día para el barbero
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        barberoId: parseInt(barberoId),
        fecha: {
          gte: startOfDay(fechaBase),
          lte: endOfDay(fechaBase)
        },
        estado: {
          not: 'CANCELADO'
        }
      },
      select: {
        fecha: true,
        servicio: {
          select: {
            duracion: true
          }
        }
      }
    });

    // Generar slots cada 30 minutos desde las 9:00 hasta las 18:00
    const slots = [];
    let currentTime = new Date(fechaBase);
    currentTime.setHours(9, 0, 0, 0);
    const endTime = new Date(fechaBase);
    endTime.setHours(18, 0, 0, 0);

    while (currentTime < endTime) {
      const isAvailable = !turnosExistentes.some(turno => {
        const turnoTime = new Date(turno.fecha);
        return currentTime >= turnoTime && 
               currentTime < addMinutes(turnoTime, turno.servicio.duracion);
      });

      slots.push({
        time: new Date(currentTime),
        available: isAvailable
      });

      currentTime = addMinutes(currentTime, 30);
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener disponibilidad' },
      { status: 500 }
    );
  }
}