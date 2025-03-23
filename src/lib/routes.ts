// src/lib/routes.ts
export const protectedRoutes = {
    // Rutas para usuarios autenticados genéricos
    authenticated: [
        '/dashboard',
        '/profile'
    ],

    // Rutas específicas para super admins
    superAdmin: [
        '/admin/super',
    ],

    // Rutas específicas para admins de barbería
    barberiaAdmin: [
        '/admin/barberia'
    ],

    // Rutas específicas para barberos
    barbero: [
        '/barbero'
    ],

    // Rutas específicas para clientes
    cliente: [
        '/cliente'
    ],

    // Rutas públicas (no requieren autenticación)
    public: [
        '/',
        '/login',
        '/register',
        '/reserva',
        '/barberias'
    ]
};

// Función para comprobar si una ruta está protegida
export const isProtectedRoute = (path: string): boolean => {
    // Extraer la primera parte de la ruta
    const baseRoute = `/${path.split('/')[1]}`;

    return !protectedRoutes.public.some(route =>
        route === baseRoute || path.startsWith(route + '/')
    );
};

// Función para comprobar si un usuario tiene acceso a una ruta
export const hasAccessToRoute = (
    path: string,
    userRole?: string,
    barberiaId?: number
): boolean => {
    // Si es una ruta pública, todos tienen acceso
    if (!isProtectedRoute(path)) {
        return true;
    }

    // Si no hay rol de usuario, no tiene acceso a rutas protegidas
    if (!userRole) {
        return false;
    }

    // Verificar acceso según rol
    switch (userRole) {
        case 'SUPER_ADMIN':
            // Super admin tiene acceso a todo
            return true;

        case 'ADMIN_BARBERIA':
            // Admin de barbería tiene acceso a sus rutas específicas
            if (path.startsWith('/admin/barberia/')) {
                // Verificar si el ID de la barbería en la ruta coincide con su barberiaId
                const matchBarberia = path.match(/\/admin\/barberia\/(\d+)/);
                const routeBarberiaId = matchBarberia ? parseInt(matchBarberia[1]) : null;

                // Si hay un ID de barbería en la ruta, debe coincidir con su barberiaId
                return !routeBarberiaId || routeBarberiaId === barberiaId;
            }

            // También tiene acceso a rutas genéricas
            return protectedRoutes.authenticated.some(route =>
                path === route || path.startsWith(route + '/')
            );

        case 'BARBERO':
            // Barbero solo tiene acceso a sus rutas específicas
            return protectedRoutes.barbero.some(route =>
                path === route || path.startsWith(route + '/')
            ) || protectedRoutes.authenticated.some(route =>
                path === route || path.startsWith(route + '/')
            );

        case 'CLIENTE':
            // Cliente solo tiene acceso a sus rutas específicas
            return protectedRoutes.cliente.some(route =>
                path === route || path.startsWith(route + '/')
            ) || protectedRoutes.authenticated.some(route =>
                path === route || path.startsWith(route + '/')
            );

        default:
            return false;
    }
};