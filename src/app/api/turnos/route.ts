// /my-app/src/app/api/turnos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { enviarConfirmacionTurno } from '../../../lib/email-service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Datos recibidos:", body);

    // Validar los datos de entrada
    const {
      clienteData,  // En lugar de clienteId
      sucursalId,
      barberoId,
      fecha,
      serviciosIds
    } = body;

    if (!clienteData || !sucursalId || !barberoId || !fecha || !serviciosIds || !serviciosIds.length) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que los datos del cliente están completos
    if (!clienteData.nombre || !clienteData.apellido || !clienteData.email || !clienteData.telefono) {
      return NextResponse.json(
        { error: 'Datos del cliente incompletos' },
        { status: 400 }
      );
    }

    // Buscar o crear el cliente
    let cliente;
    if (clienteData.email) {
      cliente = await prisma.cliente.findUnique({
        where: { email: clienteData.email }
      });
    }

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nombre: clienteData.nombre,
          apellido: clienteData.apellido,
          email: clienteData.email,
          telefono: clienteData.telefono
        }
      });
    } else {
      // Actualizar datos existentes
      cliente = await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          nombre: clienteData.nombre,
          apellido: clienteData.apellido,
          telefono: clienteData.telefono
        }
      });
    }

    const clienteId = cliente.id;

    // Verificar que los servicios existen
    const servicios = await prisma.servicio.findMany({
      where: {
        id: {
          in: serviciosIds
        }
      }
    });

    if (servicios.length !== serviciosIds.length) {
      return NextResponse.json(
        { error: 'Uno o más servicios no existen' },
        { status: 404 }
      );
    }

    // Verificar que el barbero trabaja en la sucursal
    const sucursalBarbero = await prisma.barberoSucursal.findFirst({
      where: {
        sucursalId,
        barberoId
      }
    });

    if (!sucursalBarbero) {
      return NextResponse.json(
        { error: 'El barbero no trabaja en esta sucursal' },
        { status: 400 }
      );
    }

    // Actualiza la sección de verificación de conflictos en /my-app/src/app/api/turnos/route.ts

    // Verificar disponibilidad en la fecha y hora solicitada
    const fechaTurno = new Date(fecha);
    const duracionTotal = servicios.reduce((total, servicio) => total + servicio.duracion, 0);
    const fechaFinTurno = new Date(fechaTurno.getTime() + duracionTotal * 60000);

    console.log('Verificando disponibilidad para:', {
      fecha: fechaTurno.toISOString(),
      barberoId,
      sucursalId,
      duracionTotal,
      fechaFinTurno: fechaFinTurno.toISOString()
    });

    // Usar la misma lógica de obtención de turno que en la API de disponibilidad
    // para asegurarnos de que las verificaciones de disponibilidad sean consistentes
    const { getUTCDayBounds, checkTimeRangeOverlap } = await import('@/lib/dateUtils');

    const dayBounds = getUTCDayBounds(fechaTurno);

    // Buscar turnos existentes para el mismo barbero en la misma fecha
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        barberoId,
        sucursalId,
        estado: { not: 'CANCELADO' },
        fecha: {
          gte: dayBounds.start,
          lt: dayBounds.end
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

    console.log(`Encontrados ${turnosExistentes.length} turnos para el barbero #${barberoId} en esta fecha`);

    // Verificar conflictos usando la función de utilidad
    let hayConflicto = false;
    let turnoConflicto = null;

    for (const turno of turnosExistentes) {
      const inicioTurnoExistente = new Date(turno.fecha);

      // Calcular duración sumando la duración de sus servicios
      const duracionTurnoExistente = turno.servicios.reduce(
        (total, ts) => total + ts.servicio.duracion, 0
      );

      const finTurnoExistente = new Date(inicioTurnoExistente.getTime() + duracionTurnoExistente * 60000);

      console.log(`Verificando conflicto con turno #${turno.id}:`, {
        inicio: inicioTurnoExistente.toISOString(),
        fin: finTurnoExistente.toISOString()
      });

      const haySupeposicion = checkTimeRangeOverlap(
        fechaTurno,
        fechaFinTurno,
        inicioTurnoExistente,
        finTurnoExistente
      );

      if (haySupeposicion) {
        hayConflicto = true;
        turnoConflicto = turno;
        console.log(`⚠️ CONFLICTO DETECTADO con turno #${turno.id}`);
        break;
      }
    }

    if (hayConflicto) {
      console.log('Detalles del conflicto:', {
        turnoConflictoId: turnoConflicto?.id,
        fechaTurnoConflicto: turnoConflicto?.fecha,
        fechaSolicitada: fechaTurno
      });

      return NextResponse.json(
        {
          error: 'El horario seleccionado ya no está disponible',
          detalles: `Conflicto con otro turno existente (#${turnoConflicto?.id})`
        },
        { status: 409 }
      );
    }

    // Crear el turno en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el turno
      const nuevoTurno = await tx.turno.create({
        data: {
          fecha: fechaTurno,
          estado: 'PENDIENTE',
          clienteId,
          barberoId,
          sucursalId
        }
      });

      // Crear las relaciones con los servicios
      for (const servicio of servicios) {
        await tx.servicioTurno.create({
          data: {
            turnoId: nuevoTurno.id,
            servicioId: servicio.id
          }
        });
      }

      return nuevoTurno;
    });

    // Obtener información completa del turno para enviar por email
    const turnoCompleto = await prisma.turno.findUnique({
      where: { id: resultado.id },
      include: {
        cliente: true,
        barbero: true,
        sucursal: true,
        servicios: {
          include: {
            servicio: true
          }
        }
      }
    });

    // Enviar email de confirmación
    if (turnoCompleto && cliente.email) {
      // Formatear los datos para el email
      const turnoInfo = {
        id: turnoCompleto.id,
        fecha: turnoCompleto.fecha,
        cliente: {
          nombre: turnoCompleto.cliente.nombre,
          apellido: turnoCompleto.cliente.apellido,
          email: turnoCompleto.cliente.email
        },
        barbero: {
          nombre: turnoCompleto.barbero.nombre,
          apellido: turnoCompleto.barbero.apellido
        },
        sucursal: {
          nombre: turnoCompleto.sucursal!.nombre,
          direccion: turnoCompleto.sucursal!.direccion
        },
        servicios: turnoCompleto.servicios.map(ts => ({
          nombre: ts.servicio.nombre,
          precio: Number(ts.servicio.precio)
        }))
      };

      try {
        await enviarConfirmacionTurno(turnoInfo);
      } catch (emailError) {
        console.error('Error al enviar email de confirmación:', emailError);
        // No fallamos la operación si el email falla
      }
    }

    return NextResponse.json({
      success: true,
      turno: resultado,
      mensaje: 'Turno creado correctamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear turno:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Obtener todos los turnos o filtrar por sucursal, barbero, cliente, fecha
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sucursalId = searchParams.get('sucursalId');
    const barberoId = searchParams.get('barberoId');
    const clienteId = searchParams.get('clienteId');
    const fecha = searchParams.get('fecha');
    const estado = searchParams.get('estado');

    // Construir la consulta con los filtros
    const where: any = {};

    if (sucursalId) {
      where.sucursalId = parseInt(sucursalId);
    }

    if (barberoId) {
      where.barberoId = parseInt(barberoId);
    }

    if (clienteId) {
      where.clienteId = parseInt(clienteId);
    }

    if (estado) {
      where.estado = estado;
    }

    if (fecha) {
      const fechaDate = new Date(fecha);
      where.fecha = {
        gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
        lt: new Date(fechaDate.setHours(23, 59, 59, 999))
      };
    }

    // Ejecutar la consulta
    const turnos = await prisma.turno.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        },
        barbero: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        sucursal: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        },
        servicios: {
          include: {
            servicio: true
          }
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    // Formatear los resultados para hacerlos más amigables
    const turnosFormateados = turnos.map(turno => ({
      id: turno.id,
      fecha: turno.fecha,
      estado: turno.estado,
      cliente: {
        id: turno.cliente.id,
        nombre: `${turno.cliente.nombre} ${turno.cliente.apellido}`,
        email: turno.cliente.email,
        telefono: turno.cliente.telefono
      },
      barbero: {
        id: turno.barbero.id,
        nombre: `${turno.barbero.nombre} ${turno.barbero.apellido}`
      },
      sucursal: turno.sucursal,
      servicios: turno.servicios.map(ts => ({
        id: ts.servicio.id,
        nombre: ts.servicio.nombre,
        precio: Number(ts.servicio.precio),
        duracion: ts.servicio.duracion
      })),
      duracionTotal: turno.servicios.reduce(
        (total, ts) => total + ts.servicio.duracion, 0
      ),
      precioTotal: turno.servicios.reduce(
        (total, ts) => total + Number(ts.servicio.precio), 0
      ),
      createdAt: turno.createdAt
    }));

    return NextResponse.json(turnosFormateados);

  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}