'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AdminLayout from '@/components/AdminLayout';

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  duracion: number;
}

interface Turno {
  id: number;
  fecha: string;
  estado: string;
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
  };
  barbero: {
    nombre: string;
  };
  sucursal: {
    id: number;
    nombre: string;
  };
  servicios: Servicio[];
  precioTotal: number;
  duracionTotal: number;
}

type SortField = 'id' | 'fecha' | 'cliente' | 'barbero' | 'servicio' | 'estado' | 'sucursal';
type SortOrder = 'asc' | 'desc';

export default function AdminDashboard() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [turnosOrdenados, setTurnosOrdenados] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/turnos');
      
      if (!response.ok) throw new Error('Error al cargar turnos');
      
      const data = await response.json();
      setTurnos(data);
      ordenarTurnos(data, sortField, sortOrder);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, []);

  useEffect(() => {
    ordenarTurnos(turnos, sortField, sortOrder);
  }, [sortField, sortOrder, turnos, filterStatus, searchQuery]);

  const ordenarTurnos = (turnos: Turno[], campo: SortField, orden: SortOrder) => {
    // Primero aplicamos filtros si existen
    let turnosFiltrados = [...turnos];
    
    // Filtrar por estado si está seleccionado
    if (filterStatus) {
      turnosFiltrados = turnosFiltrados.filter(turno => turno.estado === filterStatus);
    }
    
    // Buscar por texto si hay una consulta
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      turnosFiltrados = turnosFiltrados.filter(turno => 
        turno.id.toString().includes(query) ||
        turno.cliente.nombre.toLowerCase().includes(query) ||
        turno.cliente.email.toLowerCase().includes(query) ||
        turno.barbero.nombre.toLowerCase().includes(query) ||
        (turno.sucursal?.nombre || '').toLowerCase().includes(query) ||
        turno.estado.toLowerCase().includes(query) ||
        turno.servicios.some(s => s.nombre.toLowerCase().includes(query))
      );
    }
    
    // Luego ordenamos
    const sorted = turnosFiltrados.sort((a, b) => {
      let valorA: any, valorB: any;
      
      switch (campo) {
        case 'id': valorA = a.id; valorB = b.id; break;
        case 'fecha': valorA = new Date(a.fecha); valorB = new Date(b.fecha); break;
        case 'cliente': valorA = a.cliente.nombre.toLowerCase(); valorB = b.cliente.nombre.toLowerCase(); break;
        case 'barbero': valorA = a.barbero.nombre.toLowerCase(); valorB = b.barbero.nombre.toLowerCase(); break;
        case 'servicio': valorA = a.servicios[0]?.nombre?.toLowerCase() || ''; valorB = b.servicios[0]?.nombre?.toLowerCase() || ''; break;
        case 'estado': valorA = a.estado.toLowerCase(); valorB = b.estado.toLowerCase(); break;
        case 'sucursal': valorA = a.sucursal?.nombre?.toLowerCase() || ''; valorB = b.sucursal?.nombre?.toLowerCase() || ''; break;
        default: valorA = a.fecha; valorB = b.fecha;
      }

      return orden === 'asc' ? valorA > valorB ? 1 : -1 : valorA < valorB ? 1 : -1;
    });

    setTurnosOrdenados(sorted);
  };

  const handleSort = (campo: SortField) => {
    setSortField(prev => campo === prev ? prev : campo);
    setSortOrder(prev => campo === sortField ? prev === 'asc' ? 'desc' : 'asc' : 'asc');
  };

  const renderSortIcon = (campo: SortField) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortField === campo ? 'opacity-100' : 'opacity-30'}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d={sortOrder === 'asc' ? "M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h7a1 1 0 100-2H3zm0 4a1 1 0 100 2h4a1 1 0 100-2H3z" : "M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h5a1 1 0 000-2H3zm0 4a1 1 0 000 2h4a1 1 0 100-2H3z"} clipRule="evenodd" />
    </svg>
  );

  const handleEstadoChange = async (id: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/admin/turnos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      response.ok && fetchTurnos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const ServiciosCell = ({ servicios, precioTotal, duracionTotal }: { 
    servicios: Servicio[], 
    precioTotal: number,
    duracionTotal: number 
  }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
      <div className="group relative">
        <div 
          className="font-medium cursor-pointer"
          onClick={() => servicios.length > 1 && setExpanded(!expanded)}
        >
          {servicios[0]?.nombre}
          {servicios.length > 1 && (
            <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-1.5">
              +{servicios.length - 1}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {duracionTotal} min · ${precioTotal.toFixed(2)}
        </div>
        
        {/* Dropdown con todos los servicios */}
        {expanded && servicios.length > 1 && (
          <div className="absolute top-full left-0 z-10 mt-1 w-64 rounded-md shadow-lg bg-gray-800 border border-gray-700 p-2">
            <div className="text-sm font-medium text-white mb-1">Servicios incluidos:</div>
            <ul className="space-y-1">
              {servicios.map((servicio, idx) => (
                <li key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-200">{servicio.nombre}</span>
                  <span className="text-gray-400">${servicio.precio.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-sm">
              <span className="font-medium text-blue-300">Total</span>
              <span className="font-medium text-blue-300">${precioTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getBadgeClass = (estado: string) => {
    const classes = {
      'PENDIENTE': 'bg-yellow-600/30 text-yellow-300',
      'CONFIRMADO': 'bg-green-600/30 text-green-300',
      'CANCELADO': 'bg-red-600/30 text-red-300',
      'COMPLETADO': 'bg-blue-600/30 text-blue-300'
    };
    return classes[estado as keyof typeof classes] || 'bg-gray-600/30 text-gray-300';
  };

  // Acciones para el encabezado
  const dashboardActions = (
    <>
      <div className="relative flex-grow max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          type="search"
          className="block w-full p-2 pl-10 text-sm bg-gray-800 border border-gray-600 placeholder-gray-400 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Buscar turno..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setSearchQuery('')}
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
      
      <button 
        onClick={fetchTurnos}
        className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 rounded-md text-sm font-medium transition-colors"
      >
        Actualizar
      </button>
    </>
  );

  if (loading) {
    return (
      <AdminLayout title="Dashboard" currentPage="dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Turnos Reservados" currentPage="dashboard" actions={dashboardActions}>
      {/* Filtros de estado */}
      {/* <div className="mb-6 flex flex-wrap gap-2">
        <div className="flex items-center mr-4">
          <span className="text-sm text-gray-400 mr-2">Estado:</span>
          <div className="flex gap-1">
            {['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFilterStatus(filterStatus === estado ? null : estado)}
                className={`px-2 py-1 rounded-md text-xs ${
                  filterStatus === estado 
                    ? `${getBadgeClass(estado)} font-medium` 
                    : 'bg-gray-700/50 text-gray-300'
                }`}
              >
                {estado}
              </button>
            ))}
            {filterStatus && (
              <button 
                onClick={() => setFilterStatus(null)}
                className="px-2 py-1 bg-gray-700 text-xs rounded hover:bg-gray-600 text-gray-300"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div> */}

      {/* Mensaje de no resultados */}
      {turnosOrdenados.length === 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/30">
          <p className="text-gray-400">
            {filterStatus && !searchQuery 
              ? `No hay turnos con estado "${filterStatus}"`
              : searchQuery && !filterStatus 
              ? `No hay resultados para "${searchQuery}"`
              : searchQuery && filterStatus 
              ? `No hay resultados para "${searchQuery}" con estado "${filterStatus}"`
              : "No hay turnos disponibles"}
          </p>
        </div>
      )}

      {/* Tabla de turnos (solo visible en desktop) */}
      {turnosOrdenados.length > 0 && (
        <div className="hidden md:block bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30">
          <table className="w-full">
            <thead className="bg-gray-700/30">
              <tr className="text-left text-sm text-gray-300">
                {['id', 'fecha', 'cliente', 'barbero', 'sucursal', 'servicio', 'estado'].map((campo) => (
                  <th 
                    key={campo} 
                    onClick={() => handleSort(campo as SortField)}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-700/40 transition-colors uppercase font-medium"
                  >
                    <div className="flex items-center">
                      {campo.replace(/_/g, ' ')}
                      {renderSortIcon(campo as SortField)}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnosOrdenados.map((turno) => (
                <tr key={turno.id} className="border-t border-gray-700/30 hover:bg-gray-700/10 transition-colors">
                  <td className="px-4 py-3 font-medium text-blue-400">#{turno.id}</td>
                  <td className="px-4 py-3 text-sm">{format(new Date(turno.fecha), 'dd/MM/yy HH:mm')}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{turno.cliente.nombre}</div>
                    <div className="text-xs text-gray-400">{turno.cliente.email}</div>
                  </td>
                  <td className="px-4 py-3 text-white">{turno.barbero.nombre}</td>
                  <td className="px-4 py-3 text-white">{turno.sucursal?.nombre || '-'}</td>
                  <td className="px-4 py-3">
                    <ServiciosCell 
                      servicios={turno.servicios} 
                      precioTotal={turno.precioTotal}
                      duracionTotal={turno.duracionTotal}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${getBadgeClass(turno.estado)}`}>
                      {turno.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select 
                      value={turno.estado}
                      onChange={(e) => handleEstadoChange(turno.id, e.target.value)}
                      className="bg-gray-700/50 border border-gray-600/30 text-white rounded-lg px-3 py-1.5 text-sm backdrop-blur-sm"
                    >
                      {['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO'].map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Versión móvil */}
      {turnosOrdenados.length > 0 && (
        <div className="md:hidden space-y-4">
          {turnosOrdenados.map((turno) => (
            <div key={turno.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-blue-400">#{turno.id}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {format(new Date(turno.fecha), 'dd/MM/yy HH:mm')}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getBadgeClass(turno.estado)}`}>
                  {turno.estado}
                </span>
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Cliente</div>
                  <div className="text-sm text-white">{turno.cliente.nombre}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400 mb-1">Barbero</div>
                  <div className="text-sm text-white">{turno.barbero.nombre}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1">Sucursal</div>
                  <div className="text-sm text-white">{turno.sucursal?.nombre || '-'}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1">Servicios</div>
                  <div className="relative">
                    <div>
                      <div className="font-medium">
                        {turno.servicios[0]?.nombre}
                        {turno.servicios.length > 1 && (
                          <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-1.5">
                            +{turno.servicios.length - 1}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {turno.duracionTotal} min · ${turno.precioTotal.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Mobile: Mostrar todos los servicios directamente */}
                    {turno.servicios.length > 1 && (
                      <div className="mt-2 pl-2 border-l-2 border-gray-700 space-y-1">
                        {turno.servicios.slice(1).map((servicio, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">{servicio.nombre}</span>
                            <span className="text-gray-400">${servicio.precio.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1">Cambiar Estado</div>
                  <select 
                    value={turno.estado}
                    onChange={(e) => handleEstadoChange(turno.id, e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600/30 text-white rounded-lg px-3 py-1.5 text-sm backdrop-blur-sm"
                  >
                    {['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO'].map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}