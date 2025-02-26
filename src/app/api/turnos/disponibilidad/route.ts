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
    } else {
      // Duración por defecto si no se seleccionaron servicios
      duracionTotal = 30;
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

    // Convertir fecha de string a Date
    const fechaDate = new Date(fecha);
    const diaSemana = fechaDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    // Verificar si la sucursal atiende en el día seleccionado
    const diasAtencionArr = sucursal.diasAtencion.split(',');
    const diasMap: Record<string, number> = {
      'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'DOMINGO': 0
    };
    
    const diaSemanaStr = Object.keys(diasMap).find(key => diasMap[key] === diaSemana);
    if (!diaSemanaStr || !diasAtencionArr.includes(diaSemanaStr)) {
      return NextResponse.json({ 
        disponibilidad: [], 
        mensaje: 'La sucursal no atiende este día' 
      });
    }

    // Parsear horarios de la sucursal
    const horaApertura = parse(sucursal.horarioInicio, 'HH:mm', new Date());
    const horaCierre = parse(sucursal.horarioFin, 'HH:mm', new Date());

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
    }

    // Obtener todos los turnos existentes para la fecha, sucursal y barbero(s) seleccionados
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        fecha: {
          gte: new Date(new Date(fecha).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(fecha).setHours(23, 59, 59, 999))
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
            nombre: true
          }
        }
      }
    });

    // Crear slots de tiempo disponibles (cada 30 minutos)
    const slots = [];
    let currentTime = new Date(fechaDate);
    currentTime.setHours(horaApertura.getHours(), horaApertura.getMinutes(), 0, 0);
    
    const endTime = new Date(fechaDate);
    endTime.setHours(horaCierre.getHours(), horaCierre.getMinutes(), 0, 0);
    
    // Asegurar que no intentamos generar slots en el pasado
    const now = new Date();
    if (isSameDay(currentTime, now) && isAfter(now, currentTime)) {
      // Si es hoy y ya pasamos la hora de apertura, empezamos desde ahora
      // Redondeamos a los siguientes 30 minutos
      const minutes = now.getMinutes();
      const roundToNext30 = minutes > 30 ? 60 - minutes : 30 - minutes;
      currentTime = addMinutes(now, roundToNext30);
    }

    // Generar todos los slots de tiempo posibles
    while (isBefore(currentTime, endTime)) {
      // Para cada slot, verificar disponibilidad con cada barbero
      for (const sucursalBarbero of barberos) {
        // Verificar si el slot conflictúa con turnos existentes
        const slotFin = addMinutes(new Date(currentTime), duracionTotal);
        let conflicto = false;
        
        for (const turno of turnosExistentes.filter(t => t.barberoId === sucursalBarbero.barberoId)) {
          const turnoDuracion = turno.servicios.reduce(
            (total, ts) => total + ts.servicio.duracion, 0
          );
          
          const turnoInicio = new Date(turno.fecha);
          const turnoFin = addMinutes(turnoInicio, turnoDuracion);
          
          // Verificar si hay solapamiento entre el slot y el turno
          if (
            (isAfter(slotFin, turnoInicio) && isBefore(currentTime, turnoFin)) || 
            (isSameDay(slotFin, turnoInicio) && slotFin.getTime() === turnoInicio.getTime()) ||
            (isSameDay(currentTime, turnoFin) && currentTime.getTime() === turnoFin.getTime())
          ) {
            conflicto = true;
            break;
          }
        }
        
        if (!conflicto) {
          slots.push({
            hora: format(currentTime, 'HH:mm'),
            barberoId: sucursalBarbero.barberoId,
            barberoNombre: `${sucursalBarbero.barbero.nombre} ${sucursalBarbero.barbero.apellido}`,
            disponible: true
          });
        }
      }
      
      // Avanzar al siguiente slot (30 minutos)
      currentTime = addMinutes(currentTime, 30);
    }

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

    return NextResponse.json({ 
      disponibilidad: Object.values(slotsAgrupados),
      fecha: format(fechaDate, 'EEEE d MMMM yyyy', { locale: es }),
      duracionServicio: duracionTotal
    });
    
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}