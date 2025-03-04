// src/app/api/admin/sucursales/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const sucursal = await prisma.sucursal.findUnique({
      where: { id }
    });
    
    if (!sucursal) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(sucursal);
  } catch (error) {
    console.error('Error al obtener sucursal:', error);
    return NextResponse.json(
      { error: 'Error al obtener sucursal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // Validate input
    if (!data.nombre || !data.direccion || !data.telefono) {
      return NextResponse.json(
        { error: 'Datos incompletos' }, 
        { status: 400 }
      );
    }
    
    // Prepare the data for update
    const sucursalData = {
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono,
      horarioInicio: new Date(`2023-01-01T${data.horarioInicio}:00`),
      horarioFin: new Date(`2023-01-01T${data.horarioFin}:00`),
      diasAtencion: {
        // Disconnect all existing days and reconnect new ones
        set: data.diasAtencion.split(',').map((dia: string) => ({ 
          nombre: dia.trim() 
        }))
      }
    };
    
    // Ensure all referenced days exist
    await Promise.all(
      data.diasAtencion.split(',').map(async (dia: string) => {
        await prisma.diaAtencion.upsert({
          where: { nombre: dia.trim() },
          update: {},
          create: { nombre: dia.trim() }
        })
      })
    );

    // Perform the update
    const sucursal = await prisma.sucursal.update({
      where: { id },
      data: sucursalData,
      include: { diasAtencion: true } // Include associated days in the response
    });
    
    return NextResponse.json(sucursal);
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al actualizar sucursal', 
        details: error instanceof Error 
          ? error.message 
          : String(error)
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Verificar si tiene barberos o turnos asociados
    const barberoSucursalCount = await prisma.barberoSucursal.count({
      where: { sucursalId: id }
    });
    
    const turnosCount = await prisma.turno.count({
      where: { sucursalId: id }
    });
    
    if (barberoSucursalCount > 0 || turnosCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la sucursal porque tiene barberos o turnos asociados' },
        { status: 400 }
      );
    }
    
    await prisma.sucursal.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar sucursal:', error);
    return NextResponse.json(
      { error: 'Error al eliminar sucursal' },
      { status: 500 }
    );
  }
}