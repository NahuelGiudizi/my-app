import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const barbero = await prisma.barbero.findUnique({
      where: { id },
      include: {
        sucursales: {
          include: {
            sucursal: true
          }
        }
      }
    });
    
    if (!barbero) {
      return NextResponse.json(
        { error: 'Barbero no encontrado' },
        { status: 404 }
      );
    }
    
    console.log("Datos del barbero:", barbero); // Para depuración
    
    return NextResponse.json(barbero);
  } catch (error) {
    console.error('Error obteniendo barbero:', error);
    return NextResponse.json(
      { error: 'Error al obtener el barbero' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log("Datos recibidos para actualizar:", body);
    console.log("URL de foto recibida:", body.foto);
    
    // Verificar si el barbero existe
    const existingBarbero = await prisma.barbero.findUnique({
      where: { id }
    });
    
    if (!existingBarbero) {
      return NextResponse.json(
        { error: 'Barbero no encontrado' },
        { status: 404 }
      );
    }
    
    // Extraer sucursales del cuerpo
    const { sucursales, ...barberoData } = body;
    
    // Preparar datos asegurando tipos correctos
    const updateData = {
      nombre: barberoData.nombre,
      apellido: barberoData.apellido,
      email: barberoData.email,
      telefono: barberoData.telefono || null,
      foto: barberoData.foto || null,
      especialidad: barberoData.especialidad || null,
      experiencia: barberoData.experiencia ? parseInt(barberoData.experiencia.toString()) : null,
      calificacion: barberoData.calificacion ? parseFloat(barberoData.calificacion.toString()) : null,
      instagram: barberoData.instagram || null,
      biografia: barberoData.biografia || null
    };
    
    console.log("Datos a actualizar:", updateData);
    
    // Actualizar barbero
    const updatedBarbero = await prisma.barbero.update({
      where: { id },
      data: {
        ...updateData,
        // Si se proporcionan nuevas sucursales, actualiza las conexiones
        ...(sucursales && {
          sucursales: {
            // Primero, eliminar todas las conexiones existentes
            deleteMany: {},
            // Luego, crear nuevas conexiones
            create: sucursales.map((sucursalId: number) => ({
              sucursal: { connect: { id: sucursalId } }
            }))
          }
        })
      },
      include: {
        sucursales: {
          include: {
            sucursal: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedBarbero);
  } catch (error) {
    console.error('Error actualizando barbero:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el barbero', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    // Verificar si el barbero existe
    const existingBarbero = await prisma.barbero.findUnique({
      where: { id }
    });
    
    if (!existingBarbero) {
      return NextResponse.json(
        { error: 'Barbero no encontrado' },
        { status: 404 }
      );
    }
    
    // Eliminar primero las relaciones con sucursales
    await prisma.barberoSucursal.deleteMany({
      where: { barberoId: id }
    });
    
    // Eliminar el barbero
    await prisma.barbero.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando barbero:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el barbero' },
      { status: 500 }
    );
  }
}