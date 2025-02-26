import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addMinutes } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get('fecha');
    const sucursalId = searchParams.get('sucursalId');
    const serviciosStr = searchParams.get('servicios');
    const duracion = searchParams.get('duracion');

    // Validar parámetros requeridos
    if (!fecha || !sucursalId) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros fecha y sucursalId' },
        { status: 400 }
      );
    }

    // Convertir parámetros
    const sucursalIdNum = parseInt(sucursalId);
    const duracionNum = duracion ? parseInt(duracion) : 30; // 30 minutos por defecto
    const fechaDate = new Date(fecha);
    const serviciosIds = serviciosStr ? serviciosStr.split(',').map(id => parseInt(id)) : [];

    // Obtener información de la sucursal
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: sucursalIdNum }
    });

    if (!sucursal) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }

    // Obtener horarios de la sucursal
    const horarioInicio = sucursal.horarioInicio; // "09:00"
    const horarioFin = sucursal.horarioFin; // "20:00"

    // Convertir horarios a objetos Date para el día seleccionado
    const [horaInicio, minInicio] = horarioInicio.split(':').map(Number);
    const [horaFin, minFin] = horarioFin.split(':').map(Number);

    const inicioJornada = new Date(fechaDate);
    inicioJornada.setHours(horaInicio, minInicio, 0, 0);

    const finJornada = new Date(fechaDate);
    finJornada.setHours(horaFin, minFin, 0, 0);

    // Obtener turnos existentes para la fecha y sucursal
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        sucursalId: sucursalIdNum,
        fecha: {
          gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
          lt: new Date(fechaDate.setHours(23, 59, 59, 999))
        },
        estado: {
          not: 'CANCELADO'
        }
      }
    });

    // Generar slots de 30 minutos
    const slots = [];
    let currentTime = new Date(inicioJornada);

    while (currentTime < finJornada) {
      const slotInicio = new Date(currentTime);
      const slotFin = addMinutes(new Date(currentTime), duracionNum);

      // Verificar si el slot está disponible (no se superpone con turnos existentes)
      const disponible = !turnosExistentes.some(turno => {
        const turnoInicio = new Date(turno.fecha);
        const turnoFin = addMinutes(turnoInicio, 30); // Asumiendo 30 min por defecto para simplificar

        // Verificar superposición
        return (
          (slotInicio < turnoFin && slotFin > turnoInicio)
        );
      });

      slots.push({
        inicio: slotInicio,
        fin: slotFin,
        disponible
      });

      // Avanzar 30 minutos
      currentTime = addMinutes(currentTime, 30);
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}