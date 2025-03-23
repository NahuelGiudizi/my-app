// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

// Tipo para almacenar la información del token
interface TokenPayload {
  id: number;
  email: string;
  role: string;
  barberiaId?: number; // Solo para admins de barbería
}

export async function middleware(request: NextRequest) {
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/signup', '/api/auth', '/api/public'];
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Rutas específicas según rol
  const adminBarberiaPath = '/admin/barberia';
  const superAdminPath = '/admin/super';
  const clientePath = '/cliente';

  // Obtenemos y verificamos el token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Si no hay token, redireccionar al login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verificar el token y extraer la información
    // En producción, deberías usar una clave secreta más segura
    const payload = verify(token, process.env.JWT_SECRET || 'secret-key-debe-cambiarse') as TokenPayload;

    // Verificar permisos según la ruta solicitada
    if (request.nextUrl.pathname.startsWith(adminBarberiaPath)) {
      // Solo admins de barbería pueden acceder a esta ruta
      if (payload.role !== 'ADMIN_BARBERIA') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Si se especifica un ID de barbería en la URL, verificar que el admin tenga acceso
      const urlBarberiaId = extractBarberiaIdFromUrl(request.nextUrl.pathname);
      if (urlBarberiaId && payload.barberiaId !== urlBarberiaId) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
    else if (request.nextUrl.pathname.startsWith(superAdminPath)) {
      // Solo super admins pueden acceder a estas rutas
      if (payload.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
    else if (request.nextUrl.pathname.startsWith(clientePath)) {
      // Solo clientes pueden acceder a estas rutas
      if (payload.role !== 'CLIENTE' && payload.role !== 'ADMIN_BARBERIA' && payload.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Si llega aquí, el usuario está autenticado y tiene los permisos adecuados
    return NextResponse.next();
  } catch (error) {
    console.error('Error verificando token:', error);
    // Token inválido o expirado
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Función auxiliar para extraer el ID de barbería de la URL
// Por ejemplo: /admin/barberia/123/sucursales -> 123
function extractBarberiaIdFromUrl(path: string): number | null {
  const match = path.match(/\/admin\/barberia\/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

export const config = {
  matcher: [
    // Rutas que necesitan autenticación
    '/admin/:path*',
    '/cliente/:path*',
    '/api/admin/:path*',
    '/api/cliente/:path*',
    // Excluimos rutas públicas
    '/((?!login|signup|api/auth|api/public|_next/static|favicon.ico).*)',
  ],
};