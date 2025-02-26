import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        apellido: 'asc'
      }
    });
    
    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos requeridos
    const { nombre, apellido, email, telefono } = body;
    
    if (!nombre || !apellido || !email || !telefono) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }
    
    // Verificar si el cliente ya existe por email
    const clienteExistente = await prisma.cliente.findUnique({
      where: { email }
    });
    
    if (clienteExistente) {
      // Si el cliente ya existe, actualizamos sus datos y lo devolvemos
      const clienteActualizado = await prisma.cliente.update({
        where: { id: clienteExistente.id },
        data: {
          nombre,
          apellido,
          telefono
          // No actualizamos el email ya que es único y lo estamos usando como identificador
        }
      });
      
      return NextResponse.json(clienteActualizado);
    }
    
    // Si el cliente no existe, lo creamos
    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        apellido,
        email,
        telefono
      }
    });
    
    return NextResponse.json(nuevoCliente, { status: 201 });
  } catch (error) {
    console.error('Error al crear/actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}