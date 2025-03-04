// my-app\src\app\api\turnos\disponibilidad\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addMinutes, format, parse, isAfter, isBefore, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get('fecha');
    const sucursalId = searchParams.get('sucursalId');
    const barberoId = searchParams.get('barberoId');
    const serviciosIds = searchParams.get('servicios')?.split(',');

    // Validar parámetros requeridos
    if (!fecha || !sucursalId) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros fecha y sucursalId' },
        { status: 400 }
      );
    }

    // Convertir IDs a números
    const sucursalIdNum = parseInt(sucursalId);
    const barberoIdNum = barberoId ? parseInt(barberoId) : undefined;
    
    console.log("Verificando disponibilidad para:", {
      fecha,
      sucursalId: sucursalIdNum,
      barberoId: barberoIdNum,
      serviciosIds
    });
    
    // Calcular duración total en minutos si se seleccionaron servicios
    let duracionTotal = 0;
    
    if (serviciosIds && serviciosIds.length > 0) {
      const servicios = await prisma.servicio.findMany({
        where: {
          id: {
            in: serviciosIds.map(id => parseInt(id))
          }
        },
        select: { duracion: true }
      });
      
      duracionTotal = servicios.reduce((total, servicio) => total + servicio.duracion, 0);
      console.log(`Duración total de servicios: ${duracionTotal} minutos`);
    } else {
      // Duración por defecto si no se seleccionaron servicios
      duracionTotal = 30;
      console.log("Usando duración por defecto: 30 minutos");
    }

    // Obtener información de la sucursal
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: sucursalIdNum },
      select: {
        diasAtencion: true,
        horarioInicio: true,
        horarioFin: true
      }
    });

    if (!sucursal) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }

    console.log("Información de sucursal:", {
      diasAtencion: sucursal.diasAtencion,
      horarioInicio: sucursal.horarioInicio,
      horarioFin: sucursal.horarioFin
    });

    // Crear fechas UTC para inicio y fin del día
    const fechaDate = new Date(fecha);
    const inicioDelDiaUTC = new Date(Date.UTC(
      fechaDate.getUTCFullYear(),
      fechaDate.getUTCMonth(),
      fechaDate.getUTCDate(),
      0, 0, 0, 0
    ));

    const finDelDiaUTC = new Date(Date.UTC(
      fechaDate.getUTCFullYear(),
      fechaDate.getUTCMonth(),
      fechaDate.getUTCDate(),
      23, 59, 59, 999
    ));

    console.log("Rango de fecha para búsqueda:", {
      inicioDelDiaUTC: inicioDelDiaUTC.toISOString(),
      finDelDiaUTC: finDelDiaUTC.toISOString()
    });

    const diaSemana = fechaDate.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    // Verificar si la sucursal atiende en el día seleccionado
    const diasAtencionArr = sucursal.diasAtencion.split(',');
    const diasMap: Record<string, number> = {
      'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'DOMINGO': 0
    };
    
    const diaSemanaStr = Object.keys(diasMap).find(key => diasMap[key] === diaSemana);
    console.log(`Día de la semana: ${diaSemanaStr} (${diaSemana})`);
    
    if (!diaSemanaStr || !diasAtencionArr.includes(diaSemanaStr)) {
      console.log(`Sucursal no atiende este día (${diaSemanaStr}). Días de atención: ${diasAtencionArr.join(', ')}`);
      return NextResponse.json({ 
        disponibilidad: [], 
        mensaje: 'La sucursal no atiende este día' 
      });
    }

    // Convertir horarios de la sucursal a UTC
    const [horaInicioHora, horaInicioMin] = sucursal.horarioInicio.split(':').map(Number);
    const [horaFinHora, horaFinMin] = sucursal.horarioFin.split(':').map(Number);
    
    // Crear objetos Date para la jornada en UTC
    const inicioJornadaUTC = new Date(Date.UTC(
      fechaDate.getUTCFullYear(),
      fechaDate.getUTCMonth(),
      fechaDate.getUTCDate(),
      horaInicioHora,
      horaInicioMin,
      0,
      0
    ));
    
    const finJornadaUTC = new Date(Date.UTC(
      fechaDate.getUTCFullYear(),
      fechaDate.getUTCMonth(),
      fechaDate.getUTCDate(),
      horaFinHora,
      horaFinMin,
      0,
      0
    ));
    
    console.log("Horario de la sucursal en UTC:", {
      inicioJornadaUTC: inicioJornadaUTC.toISOString(),
      finJornadaUTC: finJornadaUTC.toISOString()
    });

    // Obtener los barberos disponibles en la sucursal para el día seleccionado
    let barberos;
    
    if (barberoIdNum) {
      // Si se especificó un barbero, verificar que esté disponible en esa sucursal
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
      
      barberos = [sucursalBarbero];
      console.log(`Verificando disponibilidad para barbero específico: ${sucursalBarbero.barbero.nombre} ${sucursalBarbero.barbero.apellido}`);
    } else {
      // Si no se especificó barbero, obtener todos los disponibles en esa sucursal
      barberos = await prisma.barberoSucursal.findMany({
        where: {
          sucursalId: sucursalIdNum,
        },
        include: {
          barbero: true
        }
      });
      console.log(`Verificando disponibilidad para todos los barberos (${barberos.length})`);
    }

    // Usar variables UTC para la consulta de turnos existentes
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        fecha: {
          gte: inicioDelDiaUTC,
          lt: finDelDiaUTC
        },
        sucursalId: sucursalIdNum,
        barberoId: barberoIdNum ? barberoIdNum : {
          in: barberos.map(b => b.barberoId)
        },
        estado: {
          not: 'CANCELADO'
        }
      },
      include: {
        servicios: {
          include: {
            servicio: {
              select: {
                duracion: true
              }
            }
          }
        },
        barbero: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    console.log(`Encontrados ${turnosExistentes.length} turnos existentes para esta fecha`);
    
    // Listar los turnos existentes para depuración
    turnosExistentes.forEach(turno => {
      const duracionTurno = turno.servicios.reduce(
        (total, ts) => total + ts.servicio.duracion, 0
      );
      const turnoInicio = new Date(turno.fecha);
      const turnoFin = addMinutes(new Date(turno.fecha), duracionTurno);
      
      console.log(`Turno #${turno.id}: ${turnoInicio.toISOString()} - ${turnoFin.toISOString()} (${duracionTurno} min) - Barbero: ${turno.barbero.nombre} ${turno.barbero.apellido}`);
    });

    // Crear slots de tiempo disponibles (cada 30 minutos) utilizando UTC
    const slots = [];
    let currentTime = new Date(inicioJornadaUTC);
    
    // Asegurar que no intentamos generar slots en el pasado
    const nowUTC = new Date();
    if (isSameDay(currentTime, nowUTC) && isAfter(nowUTC, currentTime)) {
      // Si es hoy y ya pasamos la hora de apertura, empezamos desde ahora
      // Redondeamos a los siguientes 30 minutos en UTC
      const minutesUTC = nowUTC.getUTCMinutes();
      const roundToNext30 = minutesUTC > 30 ? 60 - minutesUTC : 30 - minutesUTC;
      currentTime = addMinutes(nowUTC, roundToNext30);
      console.log(`Ajustando hora de inicio a ${currentTime.toISOString()} porque estamos en el mismo día`);
    }

    console.log(`Generando slots desde ${currentTime.toISOString()} hasta ${finJornadaUTC.toISOString()}`);

    // Generar todos los slots de tiempo posibles
    while (isBefore(currentTime, finJornadaUTC)) {
      // Para cada slot, verificar disponibilidad con cada barbero
      for (const sucursalBarbero of barberos) {
        // Verificar si el slot conflictúa con turnos existentes
        const slotInicio = new Date(currentTime);
        const slotFin = addMinutes(new Date(currentTime), duracionTotal);
        let conflicto = false;
        let turnoConflicto = null;
        
        for (const turno of turnosExistentes.filter(t => t.barberoId === sucursalBarbero.barberoId)) {
          const turnoDuracion = turno.servicios.reduce(
            (total, ts) => total + ts.servicio.duracion, 0
          );
          
          const turnoInicio = new Date(turno.fecha);
          const turnoFin = addMinutes(turnoInicio, turnoDuracion);
          
          // Verificar si hay solapamiento entre el slot y el turno
          const haySupeposicion = (
            (slotInicio < turnoFin && slotFin > turnoInicio)
          );
          
          if (haySupeposicion) {
            conflicto = true;
            turnoConflicto = turno;
            break;
          }
        }
        
        if (!conflicto) {
          slots.push({
            hora: format(slotInicio, 'HH:mm'),
            barberoId: sucursalBarbero.barberoId,
            barberoNombre: `${sucursalBarbero.barbero.nombre} ${sucursalBarbero.barbero.apellido}`,
            disponible: true
          });
        } else if (turnoConflicto) {
          console.log(`Slot ${format(slotInicio, 'HH:mm')} no disponible para barbero ${sucursalBarbero.barbero.nombre} por conflicto con turno #${turnoConflicto.id}`);
        }
      }
      
      // Avanzar al siguiente slot (30 minutos)
      currentTime = addMinutes(currentTime, 30);
    }

    console.log(`Generados ${slots.length} slots disponibles en total`);

    // Agrupar slots por hora para mostrar los barberos disponibles en cada horario
    const slotsAgrupados = slots.reduce((result: Record<string, any>, slot) => {
      const hora = slot.hora;
      
      if (!result[hora]) {
        result[hora] = {
          hora,
          barberos: []
        };
      }
      
      result[hora].barberos.push({
        id: slot.barberoId,
        nombre: slot.barberoNombre
      });
      
      return result;
    }, {});

    const slotsResultado = Object.values(slotsAgrupados);
    console.log(`Respondiendo con ${slotsResultado.length} slots agrupados por hora`);

    return NextResponse.json({ 
      disponibilidad: slotsResultado,
      fecha: format(fechaDate, 'EEEE d MMMM yyyy', { locale: es }),
      duracionServicio: duracionTotal
    });
    
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', detalle: error.message },
      { status: 500 }
    );
  }
}