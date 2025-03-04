'use client';

import { useState, useEffect } from 'react';
import BarberoForm from '@/components/BarberoForm';
import AdminLayout from '@/components/AdminLayout';

interface Sucursal {
  id: number;
  nombre: string;
}

interface Servicio {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
}

interface Barbero {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  foto?: string;
  especialidad?: string;
  experiencia?: number;
  calificacion?: number;
  instagram?: string;
  biografia?: string;
  sucursales?: {
    sucursalId: number;
    sucursal: {
      id: number;
      nombre: string;
    }
  }[];
  servicios?: {
    servicioId: number;
    servicio: {
      id: number;
      nombre: string;
    }
  }[];
}

export default function BarberosPage() {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [barberoEditando, setBarberoEditando] = useState<Barbero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [barberosFiltrados, setBarberosFiltrados] = useState<Barbero[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchBarberos();
  }, []);

  // Filtrar barberos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setBarberosFiltrados(barberos);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtrados = barberos.filter(barbero => 
      barbero.nombre.toLowerCase().includes(query) || 
      barbero.apellido.toLowerCase().includes(query) || 
      barbero.email.toLowerCase().includes(query) || 
      (barbero.especialidad || '').toLowerCase().includes(query) ||
      barbero.sucursales?.some(s => s.sucursal.nombre.toLowerCase().includes(query)) ||
      barbero.servicios?.some(s => s.servicio.nombre.toLowerCase().includes(query))
    );
    
    setBarberosFiltrados(filtrados);
  }, [searchQuery, barberos]);

  const fetchBarberos = async () => {
    try {
      setLoading(true);
      
      // Cargar barberos con toda su información
      const responseBarberos = await fetch('/api/barberos?incluirSucursales=true');
      if (!responseBarberos.ok) throw new Error('Error al cargar barberos');
      const barberos = await responseBarberos.json();
      
      setBarberos(barberos);
      setBarberosFiltrados(barberos);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (barbero: Barbero) => {
    setBarberoEditando(barbero);
    setMostrarFormulario(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este barbero?')) return;
    
    try {
      const response = await fetch(`/api/admin/barberos/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar barbero');
      }
      
      // Actualizar lista
      setBarberos(prev => prev.filter(b => b.id !== id));
      setBarberosFiltrados(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el barbero');
    }
  };

  const handleFormSuccess = () => {
    setMostrarFormulario(false);
    setBarberoEditando(null);
    fetchBarberos(); // Recargar datos
  };

  // Renderizar estrellas según la calificación
  const renderEstrellas = (calificacion: number = 0) => {
    const estrellas = [];
    const fullStars = Math.floor(calificacion);
    const hasHalfStar = calificacion % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      estrellas.push(
        <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (hasHalfStar) {
      estrellas.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-yellow-400">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" fill="url(#half-star)" />
          <defs>
            <linearGradient id="half-star" x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#374151" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    
    // Añadir estrellas vacías
    const emptyStars = 5 - estrellas.length;
    for (let i = 0; i < emptyStars; i++) {
      estrellas.push(
        <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    }
    
    return estrellas;
  };

  // Barra de búsqueda y botón de nuevo barbero
  const headerActions = (
    <>
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          type="search"
          className="block w-full p-2 pl-10 text-sm bg-gray-800 border border-gray-600 placeholder-gray-400 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Buscar barbero..."
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
        onClick={() => {
          setBarberoEditando(null);
          setMostrarFormulario(true);
        }} 
        className="bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 py-2 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>Nuevo Barbero</span>
      </button>
    </>
  );

  if (loading) {
    return (
      <AdminLayout title="Gestión de Barberos" currentPage="barberos">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Barberos" currentPage="barberos" actions={headerActions}>
      {/* Formulario mejorado */}
      {mostrarFormulario && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30 mb-8">
          <div className="p-5">
            <h3 className="text-xl font-bold text-white mb-4">
              {barberoEditando ? 'Editar Barbero' : 'Nuevo Barbero'}
            </h3>
            <BarberoForm 
              barberoId={barberoEditando?.id} 
              onSuccess={handleFormSuccess} 
            />
          </div>
        </div>
      )}

      {/* Mensaje de no resultados */}
      {barberosFiltrados.length === 0 && !loading && !error && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/30">
          <p className="text-gray-400">
            {searchQuery 
              ? `No se encontraron barberos que coincidan con "${searchQuery}"`
              : "No hay barberos registrados"}
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Lista de Barberos - Grid responsive */}
      {!loading && !error && barberosFiltrados.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {barberosFiltrados.map(barbero => (
            <div key={barbero.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden hover:shadow-blue-900/20 hover:translate-y-[-2px] transition-all duration-300">
              {/* Sección superior con foto/avatar */}
              <div className="h-40 bg-gray-700 relative">
                {barbero.foto ? (
                  <img 
                    src={barbero.foto} 
                    alt={`${barbero.nombre} ${barbero.apellido}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                    <div className="w-20 h-20 rounded-full bg-gray-800 border-4 border-white/20 flex items-center justify-center text-white text-3xl font-bold">
                      {barbero.nombre?.[0]}{barbero.apellido?.[0]}
                    </div>
                  </div>
                )}
                {/* Gradiente oscuro superpuesto */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                
                {/* Información básica superpuesta */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{barbero.nombre} {barbero.apellido}</h3>
                  {barbero.especialidad && (
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-300">{barbero.especialidad}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-5">
                {/* Información de contacto */}
                <div className="space-y-1 text-gray-300 text-sm mb-3">
                  <p className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {barbero.email}
                  </p>
                  {barbero.telefono && (
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {barbero.telefono}
                    </p>
                  )}
                  {barbero.instagram && (
                    <p className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z"></path>
                        <path d="M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.5a3 3 0 110-6 3 3 0 010 6z"></path>
                        <circle cx="16.5" cy="7.5" r="1.5"></circle>
                      </svg>
                      {barbero.instagram}
                    </p>
                  )}
                </div>
                
                {/* Calificación y experiencia */}
                <div className="flex items-center justify-between mb-3">
                  {barbero.calificacion && (
                    <div className="flex items-center">
                      <div className="flex mr-1">
                        {renderEstrellas(barbero.calificacion)}
                      </div>
                      <span className="text-gray-400 text-xs">({barbero.calificacion.toFixed(1)})</span>
                    </div>
                  )}
                  
                  {barbero.experiencia && (
                    <span className="text-xs bg-blue-900/50 text-blue-200 px-2 py-1 rounded">
                      {barbero.experiencia} años exp.
                    </span>
                  )}
                </div>
                
                {/* Sucursales */}
                {barbero.sucursales && barbero.sucursales.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1">Sucursales:</p>
                    <div className="flex flex-wrap gap-1">
                      {barbero.sucursales.map(s => (
                        <span key={s.sucursalId} className="px-2 py-1 bg-blue-900/40 text-blue-200 text-xs rounded">
                          {s.sucursal.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Servicios */}
                {barbero.servicios && barbero.servicios.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1">Servicios:</p>
                    <div className="flex flex-wrap gap-1">
                      {barbero.servicios.map(s => (
                        <span key={s.servicioId} className="px-2 py-1 bg-green-900/40 text-green-200 text-xs rounded">
                          {s.servicio.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Acciones */}
                <div className="flex justify-end mt-4 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => handleEdit(barbero)}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center mr-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Editar
                  </button>
                  
                  <button
                    onClick={() => barbero.id && handleDelete(barbero.id)}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista móvil optimizada para pantallas pequeñas */}
      <div className="md:hidden fixed bottom-4 right-4 z-10">
        <button 
          onClick={() => {
            setBarberoEditando(null);
            setMostrarFormulario(true);
          }}
          className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </AdminLayout>
  );
}