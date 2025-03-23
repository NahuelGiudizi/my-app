// src/app/api/public/paises/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const paises = await prisma.pais.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    
    return NextResponse.json(paises);
  } catch (error) {
    console.error('Error obteniendo países:', error);
    return NextResponse.json(
      { error: 'Error al obtener países' },
      { status: 500 }
    );
  }
}

// src/app/api/public/paises/[id]/provincias/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paisId = parseInt(params.id);
    
    if (isNaN(paisId)) {
      return NextResponse.json(
        { error: 'ID de país inválido' },
        { status: 400 }
      );
    }
    
    const provincias = await prisma.provincia.findMany({
      where: { paisId },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    return NextResponse.json(provincias);
  } catch (error) {
    console.error('Error obteniendo provincias:', error);
    return NextResponse.json(
      { error: 'Error al obtener provincias' },
      { status: 500 }
    );
  }
}

// src/app/api/public/provincias/[id]/ciudades/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const provinciaId = parseInt(params.id);
    
    if (isNaN(provinciaId)) {
      return NextResponse.json(
        { error: 'ID de provincia inválido' },
        { status: 400 }
      );
    }
    
    const ciudades = await prisma.ciudad.findMany({
      where: { provinciaId },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    return NextResponse.json(ciudades);
  } catch (error) {
    console.error('Error obteniendo ciudades:', error);
    return NextResponse.json(
      { error: 'Error al obtener ciudades' },
      { status: 500 }
    );
  }
}

// src/app/api/public/ciudades/[id]/barberias/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ciudadId = parseInt(params.id);
    
    if (isNaN(ciudadId)) {
      return NextResponse.json(
        { error: 'ID de ciudad inválido' },
        { status: 400 }
      );
    }
    
    // Buscar todas las sucursales de barberías en esta ciudad
    const sucursales = await prisma.barberiasSucursales.findMany({
      where: { 
        ciudadId,
        barberia: {
          activa: true
        }
      },
      include: {
        barberia: true,
        diasAtencion: true,
        _count: {
          select: {
            barberos: true
          }
        }
      },
      orderBy: [
        {
          barberia: {
            destacada: 'desc' // Primero barberías destacadas
          }
        },
        {
          nombre: 'asc'
        }
      ]
    });
    
    // Agrupar sucursales por barbería para devolver un resultado más organizado
    const barberiaMap = new Map();
    
    for (const sucursal of sucursales) {
      const barberiaId = sucursal.barberia.id;
      
      if (!barberiaMap.has(barberiaId)) {
        barberiaMap.set(barberiaId, {
          id: barberiaId,
          nombre: sucursal.barberia.nombre,
          logo: sucursal.barberia.logo,
          descripcion: sucursal.barberia.descripcion,
          destacada: sucursal.barberia.destacada,
          sucursales: []
        });
      }
      
      const barberia = barberiaMap.get(barberiaId);
      barberia.sucursales.push({
        id: sucursal.id,
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        telefono: sucursal.telefono,
        horarioInicio: sucursal.horarioInicio,
        horarioFin: sucursal.horarioFin,
        diasAtencion: sucursal.diasAtencion,
        cantidadBarberos: sucursal._count.barberos,
        latitud: sucursal.latitud,
        longitud: sucursal.longitud
      });
    }
    
    const resultado = Array.from(barberiaMap.values());
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error obteniendo barberías por ciudad:', error);
    return NextResponse.json(
      { error: 'Error al obtener barberías' },
      { status: 500 }
    );
  }
}

// src/app/api/public/barberias/cercanas/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Obtener coordenadas de la URL
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius') || '5'; // Radio en kilómetros, por defecto 5km
    
    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Latitud y longitud son requeridas' },
        { status: 400 }
      );
    }
    
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = parseFloat(radiusStr);
    
    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return NextResponse.json(
        { error: 'Parámetros de ubicación inválidos' },
        { status: 400 }
      );
    }
    
    // Consulta nativa para encontrar sucursales dentro del radio
    // Utilizamos la fórmula de Haversine para calcular distancias
    const sucursales = await prisma.$queryRaw`
      SELECT 
        s.id, 
        s.nombre, 
        s.direccion,
        s.telefono,
        s.latitud,
        s.longitud,
        s."barberiaId",
        b.nombre as "barberiaNombre",
        b.logo as "barberiaLogo",
        b.destacada as "barberiaDestacada",
        c.nombre as "ciudadNombre",
        p.nombre as "provinciaNombre",
        (6371 * acos(
          cos(radians(${lat})) * 
          cos(radians(s.latitud)) * 
          cos(radians(s.longitud) - radians(${lng})) + 
          sin(radians(${lat})) * 
          sin(radians(s.latitud))
        )) AS distancia
      FROM "Sucursal" s
      JOIN "Barberia" b ON s."barberiaId" = b.id
      JOIN "Ciudad" c ON s."ciudadId" = c.id
      JOIN "Provincia" p ON c."provinciaId" = p.id
      WHERE 
        s.latitud IS NOT NULL 
        AND s.longitud IS NOT NULL
        AND b.activa = true
      HAVING distancia <= ${radius}
      ORDER BY b.destacada DESC, distancia ASC
      LIMIT 50
    `;
    
    // Agrupar resultados por barbería
    const barberiaMap = new Map();
    
    for (const sucursal: any of sucursales) {
      const barberiaId = sucursal.barberiaId;
      
      if (!barberiaMap.has(barberiaId)) {
        barberiaMap.set(barberiaId, {
          id: barberiaId,
          nombre: sucursal.barberiaNombre,
          logo: sucursal.barberiaLogo,
          destacada: sucursal.barberiaDestacada,
          sucursales: []
        });
      }
      
      const barberia = barberiaMap.get(barberiaId);
      barberia.sucursales.push({
        id: sucursal.id,
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        telefono: sucursal.telefono,
        ciudad: sucursal.ciudadNombre,
        provincia: sucursal.provinciaNombre,
        latitud: sucursal.latitud,
        longitud: sucursal.longitud,
        distancia: Math.round(sucursal.distancia * 10) / 10 // Redondear a 1 decimal
      });
    }
    
    const resultado = Array.from(barberiaMap.values());
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error obteniendo barberías cercanas:', error);
    return NextResponse.json(
      { error: 'Error al obtener barberías cercanas' },
      { status: 500 }
    );
  }
}