// scripts/reset-admin.js
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdmin() {
    try {
        const hashedPassword = await hash('admin123', 10);

        // Intentar actualizar si existe
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: 'admin@barberia.com' }
        });

        if (existingAdmin) {
            await prisma.admin.update({
                where: { email: 'admin@barberia.com' },
                data: { password: hashedPassword }
            });
            console.log('Admin password reset successfully');
        } else {
            // Crear si no existe
            await prisma.admin.create({
                data: {
                    email: 'admin@barberia.com',
                    password: hashedPassword,
                    nombre: 'Administrador',
                    rol: 'SUPER_ADMIN'
                }
            });
            console.log('Admin account created successfully');
        }
    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();