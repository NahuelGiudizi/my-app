// src/app/api/admin/barberias/[id]/route.ts
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

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID inválido' },
                { status: 400 }
            );
        }

        const barberia = await prisma.barberia.findUnique({
            where: { id },
            include: {
                sucursales: true,
                _count: {
                    select: {
                        sucursales: true,
                        adminsBarberia: true
                    }
                }
            }
        });

        if (!barberia) {
            return NextResponse.json(
                { error: 'Barbería no encontrada' },
                { status: 404 }
            );
        }

        // Verificar permisos según el rol del usuario
        if (session.user.role === 'ADMIN_BARBERIA') {
            // Verificar si este admin tiene acceso a esta barbería
            const userAdmin = await prisma.userAdmin.findFirst({
                where: {
                    userId: session.user.id,
                    barberiaId: id
                }
            });

            if (!userAdmin) {
                return NextResponse.json(
                    { error: 'No tiene permisos para acceder a esta barbería' },
                    { status: 403 }
                );
            }
        }
        else if (session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Rol no autorizado' },
                { status: 403 }
            );
        }

        return NextResponse.json(barberia);
    } catch (error) {
        console.error('Error obteniendo barbería:', error);
        return NextResponse.json(
            { error: 'Error al obtener barbería' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Solo super admin o admin de la barbería puede modificarla
        if (session.user.role !== 'SUPER_ADMIN') {
            if (session.user.role === 'ADMIN_BARBERIA') {
                const userAdmin = await prisma.userAdmin.findFirst({
                    where: {
                        userId: session.user.id,
                        barberiaId: parseInt(params.id)
                    }
                });

                if (!userAdmin) {
                    return NextResponse.json(
                        { error: 'No tiene permisos para modificar esta barbería' },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'Rol no autorizado' },
                    { status: 403 }
                );
            }
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID inválido' },
                { status: 400 }
            );
        }

        // Verificar si la barbería existe
        const barberia = await prisma.barberia.findUnique({
            where: { id }
        });

        if (!barberia) {
            return NextResponse.json(
                { error: 'Barbería no encontrada' },
                { status: 404 }
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

        const barberiaActualizada = await prisma.barberia.update({
            where: { id },
            data: validation.data
        });

        return NextResponse.json(barberiaActualizada);
    } catch (error) {
        console.error('Error actualizando barbería:', error);
        return NextResponse.json(
            { error: 'Error al actualizar la barbería' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'No autorizado para eliminar barberías' },
                { status: 403 }
            );
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID inválido' },
                { status: 400 }
            );
        }

        // Verificar si la barbería existe
        const barberia = await prisma.barberia.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        sucursales: true,
                        adminsBarberia: true
                    }
                }
            }
        });

        if (!barberia) {
            return NextResponse.json(
                { error: 'Barbería no encontrada' },
                { status: 404 }
            );
        }

        // Verificar si tiene sucursales o administradores
        if (barberia._count.sucursales > 0 || barberia._count.adminsBarberia > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar una barbería con sucursales o administradores' },
                { status: 400 }
            );
        }

        await prisma.barberia.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error eliminando barbería:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la barbería' },
            { status: 500 }
        );
    }
}