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
    
    const sucursal = await prisma.sucursal.update({
      where: { id },
      data
    });
    
    return NextResponse.json(sucursal);
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    return NextResponse.json(
      { error: 'Error al actualizar sucursal' },
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