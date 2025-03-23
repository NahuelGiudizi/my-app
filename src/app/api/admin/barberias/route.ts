// src/app/api/admin/barberias/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema para validar el input de la barbería
const barberiaSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  logo: z.string().optional().nullable(),
  sitioWeb: z.string().url().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  destacada: z.boolean().optional().default(false),
  activa: z.boolean().optional().default(true)
});

// GET - Obtener todas las barberías (para super admin)
// o solo las barberías asociadas con un admin específico
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { role, id } = session.user;
    
    // Filtrar según el rol del usuario
    if (role === 'SUPER_ADMIN') {
      // Super Admin puede ver todas las barberías
      const barberias = await prisma.barberia.findMany({
        include: {
          _count: {
            select: { sucursales: true }
          }
        },
        orderBy: {
          nombre: 'asc'
        }
      });
      
      return NextResponse.json(barberias);
    } 
    else if (role === 'ADMIN_BARBERIA') {
      // Admin de barbería solo ve las suyas
      const adminBarberias = await prisma.userAdmin.findMany({
        where: {
          userId: id
        },
        include: {
          barberia: {
            include: {
              _count: {
                select: { sucursales: true }
              }
            }
          }
        }
      });
      
      const barberias = adminBarberias.map(admin => admin.barberia);
      return NextResponse.json(barberias);
    } 
    else {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error obteniendo barberías:', error);
    return NextResponse.json(
      { error: 'Error al obtener barberías' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva barbería (solo super admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado para crear barberías' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = barberiaSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const nuevaBarberia = await prisma.barberia.create({
      data: validation.data
    });

    return NextResponse.json(nuevaBarberia, { status: 201 });
  } catch (error) {
    console.error('Error creando barbería:', error);
    return NextResponse.json(
      { error: 'Error al crear la barbería' },
      { status: 500 }
    );
  }
}