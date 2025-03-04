// src/app/api/disponibilidad/route.ts - Versión corregida

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addMinutes } from 'date-fns';
import { checkTimeRangeOverlap, getUTCDayBounds } from '@/lib/dateUtils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get('fecha');
    const sucursalId = searchParams.get('sucursalId');
    const barberoId = searchParams.get('barberoId');
    const serviciosStr = searchParams.get('servicios');
    const duracion = searchParams.get('duracion');
    
    // Validar parámetros requeridos
    if (!fecha || !sucursalId || !barberoId) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros fecha, sucursalId y barberoId' },
        { status: 400 }
      );
    }

    // Convertir parámetros
    const sucursalIdNum = parseInt(sucursalId);
    const barberoIdNum = parseInt(barberoId);
    const duracionNum = duracion ? parseInt(duracion) : 30; // 30 minutos por defecto
    const fechaDate = new Date(fecha);
    const serviciosIds = serviciosStr ? serviciosStr.split(',').map(id => parseInt(id)) : [];

    console.log("Verificando disponibilidad para:", {
      fecha: fechaDate.toISOString(),
      sucursalId: sucursalIdNum,
      barberoId: barberoIdNum,
      duracion: duracionNum,
      servicios: serviciosIds
    });

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

    // Verificar que el barbero trabaja en la sucursal
    const sucursalBarbero = await prisma.barberoSucursal.findFirst({
      where: {
        sucursalId: sucursalIdNum,
        barberoId: barberoIdNum
      },
      include: {
        barbero: true
      }
    });
    
    if (!sucursalBarbero) {
      return NextResponse.json(
        { error: 'El barbero seleccionado no trabaja en esta sucursal' },
        { status: 400 }
      );
    }

// Obtener horarios de la sucursal
const horarioInicio = sucursal.horarioInicio;
const horarioFin = sucursal.horarioFin;

// Extraer horas y minutos correctamente 
let horaInicio, minInicio, horaFin, minFin;

try {
  const inicioDate = new Date(horarioInicio);
  const finDate = new Date(horarioFin);
  
  horaInicio = inicioDate.getHours();
  minInicio = inicioDate.getMinutes();
  horaFin = finDate.getHours();
  minFin = finDate.getMinutes();

  console.log("Horas extraídas correctamente:", { 
    horaInicio, minInicio, horaFin, minFin 
  });
} catch (error) {
  console.error("Error al procesar horarios:", error);
  return NextResponse.json(
    { error: 'Error al procesar los horarios de la sucursal' },
    { status: 500 }
  );
}

// Crear fechas con componentes UTC explícitos
const dayBounds = getUTCDayBounds(fechaDate);

// Validar que las horas sean números válidos antes de crear las fechas
if (isNaN(horaInicio) || isNaN(minInicio) || isNaN(horaFin) || isNaN(minFin)) {
  console.error("Horas inválidas:", { horaInicio, minInicio, horaFin, minFin });
  return NextResponse.json(
    { error: 'Formato de horario inválido en la sucursal' },
    { status: 500 }
  );
}

const inicioJornada = new Date(Date.UTC(
  fechaDate.getUTCFullYear(),
  fechaDate.getUTCMonth(),
  fechaDate.getUTCDate(),
  horaInicio,
  minInicio,
  0,
  0
));

const finJornada = new Date(Date.UTC(
  fechaDate.getUTCFullYear(),
  fechaDate.getUTCMonth(),
  fechaDate.getUTCDate(),
  horaFin,
  minFin,
  0,
  0
));

// Validar que las fechas sean válidas antes de usar toISOString
if (isNaN(inicioJornada.getTime()) || isNaN(finJornada.getTime())) {
  console.error("Fechas de jornada inválidas:", { inicioJornada, finJornada });
  return NextResponse.json(
    { error: 'Error al generar los horarios de la jornada' },
    { status: 500 }
  );
}

console.log("Horario de la sucursal:", {
  inicio: inicioJornada.toISOString(),
  fin: finJornada.toISOString()
});

    // Obtener turnos existentes para el barbero específico y la fecha
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        barberoId: barberoIdNum,
        sucursalId: sucursalIdNum,
        fecha: {
          gte: dayBounds.start,
          lt: dayBounds.end
        },
        estado: {
          not: 'CANCELADO'
        }
      },
      include: {
        servicios: {
          include: {
            servicio: true
          }
        }
      }
    });

    console.log(`Encontrados ${turnosExistentes.length} turnos para el barbero #${barberoIdNum} en esta fecha`);

    // Procesar los turnos para detectar intervalos ocupados
    const intervalosOcupados = turnosExistentes.map(turno => {
      const inicioTurno = new Date(turno.fecha);
      
      // Calcular la duración total del turno sumando la duración de sus servicios
      const duracionTurno = turno.servicios.reduce(
        (total, ts) => total + ts.servicio.duracion, 0
      );
      
      const finTurno = addMinutes(inicioTurno, duracionTurno);
      
      console.log(`Turno #${turno.id}: ${inicioTurno.toISOString()} a ${finTurno.toISOString()} (${duracionTurno} min)`);
      
      return {
        id: turno.id,
        inicio: inicioTurno,
        fin: finTurno,
        duracion: duracionTurno
      };
    });

    // Generar slots de tiempo disponibles (cada 30 minutos)
    const slots = [];
    let currentTime = new Date(inicioJornada);
    
    // Asegurarse de no incluir slots en el pasado
    const now = new Date();
    if (now > currentTime) {
      // Redondear a los siguientes 30 minutos
      const minutes = now.getUTCMinutes();
      const roundedMinutes = minutes < 30 ? 30 : 60;
      const roundedHour = minutes < 30 ? now.getUTCHours() : now.getUTCHours() + 1;
      
      currentTime = new Date(Date.UTC(
        fechaDate.getUTCFullYear(),
        fechaDate.getUTCMonth(),
        fechaDate.getUTCDate(),
        roundedHour,
        roundedMinutes === 60 ? 0 : roundedMinutes,
        0,
        0
      ));
    }

    console.log(`Generando slots desde ${currentTime.toISOString()} hasta ${finJornada.toISOString()}`);

    while (currentTime < finJornada) {
      // Para cada slot potencial, verificamos si está disponible
      const slotInicio = new Date(currentTime);
      const slotFin = addMinutes(new Date(currentTime), duracionNum);
      
      // Verificar si este slot se solapa con algún intervalo ocupado
      let hayConflicto = false;
      let turnoConflicto = null;
      
      for (const intervalo of intervalosOcupados) {
        // Verificar si hay solapamiento entre el slot y el intervalo ocupado
        if (checkTimeRangeOverlap(slotInicio, slotFin, intervalo.inicio, intervalo.fin)) {
          hayConflicto = true;
          turnoConflicto = intervalo;
          console.log(`Conflicto detectado para slot ${slotInicio.toISOString()}-${slotFin.toISOString()} con turno #${intervalo.id}`);
          break;
        }
      }
      
      // Si no hay conflicto, este slot está disponible
      if (!hayConflicto) {
        slots.push({
          inicio: slotInicio,
          fin: slotFin,
          disponible: true
        });
      } else {
        // Para depuración, incluimos también los slots no disponibles
        slots.push({
          inicio: slotInicio,
          fin: slotFin,
          disponible: false,
          conflicto: turnoConflicto ? `Turno #${turnoConflicto.id}` : null
        });
      }
      
      // Avanzar al siguiente slot (30 minutos)
      currentTime = addMinutes(currentTime, 30);
    }

    console.log(`Total de slots generados: ${slots.length}, disponibles: ${slots.filter(s => s.disponible).length}`);

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', detalle: error.message },
      { status: 500 }
    );
  }
}