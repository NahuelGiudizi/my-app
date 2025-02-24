// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('Middleware ejecutado para la ruta:', request.nextUrl.pathname);
  
  // Solo interceptar rutas administrativas
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // No interceptar la página de login
    if (request.nextUrl.pathname === '/admin/login') {
      console.log('Ruta de login, permitiendo acceso');
      return NextResponse.next();
    }

    // Solo verificar si existe el token, no lo validamos en el middleware
    const token = request.cookies.get('admin_token');
    console.log('Token encontrado:', !!token);

    if (!token) {
      console.log('No hay token, redirigiendo a login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Permitir acceso sin verificar el token
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};