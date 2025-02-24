// src/app/api/admin/reset-password/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';

export async function GET() {
  try {
    const hashedPassword = await hash('admin123', 10);
    
    const admin = await prisma.admin.update({
      where: { 
        email: 'admin@barberia.com' 
      },
      data: {
        password: hashedPassword
      }
    });

    return NextResponse.json({ 
      message: 'Contraseña actualizada', 
      passwordHash: hashedPassword 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al actualizar contraseña' }, { status: 500 });
  }
}