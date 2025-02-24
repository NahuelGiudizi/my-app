import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';

// Para debug
const logError = (msg: string, data: any) => {
  console.error(`[LOGIN ERROR] ${msg}:`, data);
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos:', body);
    
    const { email, password } = body;

    // Verificar que email y password existan
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar admin por email
    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    console.log('Admin encontrado:', admin ? 'Sí' : 'No');

    if (!admin) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    try {
      const passwordMatch = await compare(password, admin.password);
      console.log('Contraseña coincide:', passwordMatch);

      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        );
      }
    } catch (error) {
      logError('Error comparando contraseñas', error);
      return NextResponse.json(
        { error: 'Error al verificar credenciales' },
        { status: 500 }
      );
    }

    // Generar token JWT
    const token = sign(
      { id: admin.id, email: admin.email },
      'secret-key-debe-cambiarse',
      { expiresIn: '8h' }
    );

    // Crear respuesta con cookie
const response = NextResponse.json({ 
  success: true,
  redirect: '/admin/dashboard'
});
    
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60
    });

    return response;
  } catch (error) {
    logError('Error general', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}