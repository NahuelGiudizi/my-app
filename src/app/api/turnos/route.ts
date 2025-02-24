import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Primero creamos o actualizamos el cliente
    const cliente = await prisma.cliente.upsert({
      where: { email: data.clienteData.email },
      update: {
        nombre: data.clienteData.nombre,
        apellido: data.clienteData.apellido,
        telefono: data.clienteData.telefono,
      },
      create: {
        ...data.clienteData
      },
    });

    // Luego creamos el turno
    const turno = await prisma.turno.create({
      data: {
        fecha: new Date(data.fecha),
        estado: 'PENDIENTE',
        barberoId: parseInt(data.barberoId),
        clienteId: cliente.id,
        servicioId: parseInt(data.servicioId),
      },
      include: {
        barbero: true,
        servicio: true,
      },
    });

    return NextResponse.json(turno, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al crear el turno' },
      { status: 500 }
    );
  }
}