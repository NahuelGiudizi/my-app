'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/AdminBarberiaLayout';
import Link from 'next/link';

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  cantidadBarberos: number;
  cantidadTurnosHoy: number;
}

interface EstadisticasGenerales {
  sucursales: number;
  barberos: number;
  turnosHoy: number;
  turnosPendientes: number;
  turnosCompletados: number;
  ingresosMes: number;
}

interface TurnoReciente {
  id: number;
  fecha: string;
  cliente: {
    nombre: string;
    email: string;
  };
  sucursal: {
    nombre: string;
  };
  barbero: {
    nombre: string;
  };
  servicios: {
    nombre: string;
    precio: number;
  }[];
  precioTotal: number;
  estado: string;
}

export default function AdminBarberiaDashboard() {
  const [barberiaId, setBarberiaId] = useState<number | null>(null);
  const [barberiaNombre, setBarberiaNombre] = useState<string>('');
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [turnosRecientes, setTurnosRecientes] = useState<TurnoReciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulamos la obtención del ID de la barbería desde la sesión o estado global
        // En una implementación real, esto vendría de la autenticación
        const barberia = { id: 1, nombre: 'Mi Barbería' };
        setBarberiaId(barberia.id);
        setBarberiaNombre(barberia.nombre);
        
        // Cargar sucursales de la barbería
        await fetchSucursales(barberia.id);
        
        // Cargar estadísticas generales
        await fetchEstadisticas(barberia.id);
        
        // Cargar turnos recientes
        await fetchTurnosRecientes(barberia.id);
        
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDatosIniciales();
  }, []);

  // Función para cargar sucursales
  const fetchSucursales = async (id: number) => {
    try {
      // En una implementación real, esta sería una llamada API real
      // const response = await fetch(`/api/admin/barberia/${id}/sucursales`);
      // const data = await response.json();
      
      // Simulamos datos para el ejemplo
      const datosSucursales: Sucursal[] = [
        { id: 1, nombre: 'Sucursal Centro', direccion: 'Calle Principal 123', cantidadBarberos: 5, cantidadTurnosHoy: 12 },
        { id: 2, nombre: 'Sucursal Norte', direccion: 'Av. del Norte 456', cantidadBarberos: 3, cantidadTurnosHoy: 8 },
        { id: 3, nombre: 'Sucursal Sur', direccion: 'Paseo del Sur 789', cantidadBarberos: 4, cantidadTurnosHoy: 10 },
      ];
      
      setSucursales(datosSucursales);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      throw error;
    }
  };

  // Función para cargar estadísticas
  const fetchEstadisticas = async (id: number) => {
    try {
      // En una implementación real, esta sería una llamada API real
      // const response = await fetch(`/api/admin/barberia/${id}/estadisticas`);
      // const data = await response.json();
      
      // Simulamos datos para el ejemplo
      const datosEstadisticas: EstadisticasGenerales = {
        sucursales: 3,
        barberos: 12,
        turnosHoy: 30,
        turnosPendientes: 15,
        turnosCompletados: 10,
        ingresosMes: 250000
      };
      
      setEstadisticas(datosEstadisticas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      throw error;
    }
  };

  // Función para cargar turnos recientes
  const fetchTurnosRecientes = async (id: number) => {
    try {
      // En una implementación real, esta sería una llamada API real
      // const response = await fetch(`/api/admin/barberia/${id}/turnos/recientes`);
      // const data = await response.json();
      
      // Simulamos datos para el ejemplo
      const datosTurnos: TurnoReciente[] = [
        {
          id: 1,
          fecha: '2025-03-23T10:00:00',
          cliente: { nombre: 'Juan Pérez', email: 'juan@email.com' },
          sucursal: { nombre: 'Sucursal Centro' },
          barbero: { nombre: 'Carlos García' },
          servicios: [{ nombre: 'Corte de pelo', precio: 1500 }],
          precioTotal: 1500,
          estado: 'PENDIENTE'
        },
        {
          id: 2,
          fecha: '2025-03-23T11:30:00',
          cliente: { nombre: 'María López', email: 'maria@email.com' },
          sucursal: { nombre: 'Sucursal Norte' },
          barbero: { nombre: 'Roberto Martínez' },
          servicios: [
            { nombre: 'Corte de pelo', precio: 1500 },
            { nombre: 'Arreglo de barba', precio: 800 }
          ],
          precioTotal: 2300,
          estado: 'CONFIRMADO'
        },
        {
          id: 3,
          fecha: '2025-03-23T13:00:00',
          cliente: { nombre: 'Pedro González', email: 'pedro@email.com' },
          sucursal: { nombre: 'Sucursal Sur' },
          barbero: { nombre: 'José Rodríguez' },
          servicios: [{ nombre: 'Arreglo de barba', precio: 800 }],
          precioTotal: 800,
          estado: 'COMPLETADO'
        },
        {
          id: 4,
          fecha: '2025-03-23T14:30:00',
          cliente: { nombre: 'Ana Martínez', email: 'ana@email.com' },
          sucursal: { nombre: 'Sucursal Centro' },
          barbero: { nombre: 'Carlos García' },
          servicios: [
            { nombre: 'Corte de pelo', precio: 1500 },
            { nombre: 'Lavado', precio: 500 }
          ],
          precioTotal: 2000,
          estado: 'PENDIENTE'
        }
      ];
      
      setTurnosRecientes(datosTurnos);
    } catch (error) {
      console.error('Error cargando turnos recientes:', error);
      throw error;
    }
  };

  // Función para obtener clase de estado
  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-600/30 text-yellow-300';
      case 'CONFIRMADO':
        return 'bg-green-600/30 text-green-300';
      case 'CANCELADO':
        return 'bg-red-600/30 text-red-300';
      case 'COMPLETADO':
        return 'bg-blue-600/30 text-blue-300';
      default:
        return 'bg-gray-600/30 text-gray-300';
    }
  };

  // Formateador de moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  // Botones de acciones rápidas para el header
  const headerActions = (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/barberia/${barberiaId}/turnos/nuevo`}
        className="bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 py-2 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>Nuevo Turno</span>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Cargando..." currentPage="dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Dashboard - ${barberiaNombre}`} currentPage="dashboard" actions={headerActions}>
      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Tarjetas de Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-6 border border-blue-800/30">
            <h3 className="text-gray-400 text-sm mb-1">Turnos de Hoy</h3>
            <p className="text-3xl font-bold text-white">{estadisticas.turnosHoy}</p>
            <div className="mt-2 flex text-xs">
              <span className="bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded-full">
                {estadisticas.turnosPendientes} pendientes
              </span>
              <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full ml-2">
                {estadisticas.turnosCompletados} completados
              </span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-6 border border-green-800/30">
            <h3 className="text-gray-400 text-sm mb-1">Ingresos del Mes</h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(estadisticas.ingresosMes)}</p>
            <p className="mt-2 text-gray-400 text-xs">Actualizado a hoy</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg p-6 border border-purple-800/30">
            <h3 className="text-gray-400 text-sm mb-1">Sucursales</h3>
            <p className="text-3xl font-bold text-white">{estadisticas.sucursales}</p>
            <Link href={`/admin/barberia/${barberiaId}/sucursales`} className="mt-2 text-purple-300 text-xs hover:text-purple-200 transition-colors">
              Ver todas las sucursales →
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-lg p-6 border border-orange-800/30">
            <h3 className="text-gray-400 text-sm mb-1">Barberos</h3>
            <p className="text-3xl font-bold text-white">{estadisticas.barberos}</p>
            <Link href={`/admin/barberia/${barberiaId}/barberos`} className="mt-2 text-orange-300 text-xs hover:text-orange-200 transition-colors">
              Ver todos los barberos →
            </Link>
          </div>
        </div>
      )}

      {/* Sección principal con turnos recientes y sucursales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de turnos recientes */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Turnos Recientes</h2>
            <Link href={`/admin/barberia/${barberiaId}/turnos`} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
              Ver todos →
            </Link>
          </div>
          
          <div className="space-y-4">
            {turnosRecientes.map(turno => (
              <div key={turno.id} className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/40 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-white">{turno.cliente.nombre}</h3>
                    <p className="text-gray-400 text-sm">{turno.cliente.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs ${getEstadoClass(turno.estado)}`}>
                    {turno.estado}
                  </span>
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(new Date(turno.fecha), 'EEEE d MMMM, HH:mm', { locale: es })}
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {turno.sucursal.nombre}
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {turno.barbero.nombre}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Servicios:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {turno.servicios.map((servicio, idx) => (
                        <span key={idx} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">
                          {servicio.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total:</p>
                    <p className="text-green-400 font-medium">{formatCurrency(turno.precioTotal)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Sucursales */}
        <div className="lg:col-span-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Mis Sucursales</h2>
            <Link href={`/admin/barberia/${barberiaId}/sucursales`} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
              Administrar →
            </Link>
          </div>
          
          <div className="space-y-4">
            {sucursales.map(sucursal => (
              <div key={sucursal.id} className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/40 transition-colors">
                <h3 className="font-medium text-white">{sucursal.nombre}</h3>
                <p className="text-sm text-gray-400 mt-1">{sucursal.direccion}</p>
                
                <div className="mt-3 flex justify-between">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Barberos</p>
                    <p className="text-lg font-medium text-white">{sucursal.cantidadBarberos}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Turnos Hoy</p>
                    <p className="text-lg font-medium text-white">{sucursal.cantidadTurnosHoy}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Link 
                    href={`/admin/barberia/${barberiaId}/sucursales/${sucursal.id}`}
                    className="text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 px-3 py-1 rounded transition-colors flex-1 text-center"
                  >
                    Ver Detalles
                  </Link>
                  <Link 
                    href={`/admin/barberia/${barberiaId}/sucursales/${sucursal.id}/turnos`}
                    className="text-xs bg-green-900/30 hover:bg-green-900/50 text-green-300 px-3 py-1 rounded transition-colors flex-1 text-center"
                  >
                    Turnos
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}