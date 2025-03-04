'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Barbero {
  id: number;
  nombre: string;
  apellido: string;
}

interface Servicio {
  id?: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
  barberos?: {
    barberoId: number;
    barbero: {
      id: number;
      nombre: string;
      apellido: string;
    }
  }[];
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [servicioEditando, setServicioEditando] = useState<Servicio>({
    nombre: '',
    descripcion: '',
    duracion: 30,
    precio: 0
  });
  const [barberosSeleccionados, setBarberosSeleccionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviciosFiltrados, setServiciosFiltrados] = useState<Servicio[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar servicios
        const responseServicios = await fetch('/api/servicios');
        if (!responseServicios.ok) throw new Error('Error al cargar servicios');
        const servicios = await responseServicios.json();
        
        // Cargar barberos
        const responseBarberos = await fetch('/api/barberos');
        if (!responseBarberos.ok) throw new Error('Error al cargar barberos');
        const barberos = await responseBarberos.json();
        
        setServicios(servicios);
        setServiciosFiltrados(servicios);
        setBarberos(barberos);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filtrar servicios cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setServiciosFiltrados(servicios);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtrados = servicios.filter(servicio => 
      servicio.nombre.toLowerCase().includes(query) || 
      servicio.descripcion.toLowerCase().includes(query) ||
      servicio.barberos?.some(b => 
        `${b.barbero.nombre} ${b.barbero.apellido}`.toLowerCase().includes(query)
      )
    );
    
    setServiciosFiltrados(filtrados);
  }, [searchQuery, servicios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const servicioData = {
        ...servicioEditando,
        barberos: barberosSeleccionados
      };
      
      const url = servicioData.id 
        ? `/api/admin/servicios/${servicioData.id}` 
        : '/api/admin/servicios';
      
      const method = servicioData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicioData),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar servicio');
      }
      
      // Recargar datos
      const serviciosResponse = await fetch('/api/servicios');
      const serviciosData = await serviciosResponse.json();
      
      setServicios(serviciosData);
      setServiciosFiltrados(serviciosData);
      
      // Limpiar formulario
      setMostrarFormulario(false);
      setServicioEditando({
        nombre: '',
        descripcion: '',
        duracion: 30,
        precio: 0
      });
      setBarberosSeleccionados([]);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el servicio');
    }
  };

  const handleEdit = (servicio: Servicio) => {
    setServicioEditando({
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      duracion: servicio.duracion,
      precio: servicio.precio
    });
    
    // Preparar barberos seleccionados
    const barberosIds = servicio.barberos?.map(b => b.barberoId) || [];
    setBarberosSeleccionados(barberosIds);
    setMostrarFormulario(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este servicio?')) return;
    
    try {
      const response = await fetch(`/api/admin/servicios/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar servicio');
      }
      
      // Actualizar lista
      setServicios(prev => prev.filter(s => s.id !== id));
      setServiciosFiltrados(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el servicio');
    }
  };

  const handleBarberoToggle = (barberoId: number) => {
    setBarberosSeleccionados(prev => {
      if (prev.includes(barberoId)) {
        return prev.filter(id => id !== barberoId);
      } else {
        return [...prev, barberoId];
      }
    });
  };

  // Formatear precio para mostrar
  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  // Barra de búsqueda y botón de nuevo servicio
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
          placeholder="Buscar servicio..."
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
          setServicioEditando({
            nombre: '',
            descripcion: '',
            duracion: 30,
            precio: 0
          });
          setBarberosSeleccionados([]);
          setMostrarFormulario(true);
        }} 
        className="bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 py-2 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>Nuevo Servicio</span>
      </button>
    </>
  );

  if (loading) {
    return (
      <AdminLayout title="Gestión de Servicios" currentPage="servicios">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Servicios" currentPage="servicios" actions={headerActions}>
      {/* Formulario de Servicio */}
      {mostrarFormulario && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">
            {servicioEditando.id ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Nombre del Servicio</label>
              <input
                type="text"
                value={servicioEditando.nombre}
                onChange={(e) => setServicioEditando({...servicioEditando, nombre: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Descripción</label>
              <textarea
                rows={3}
                value={servicioEditando.descripcion}
                onChange={(e) => setServicioEditando({...servicioEditando, descripcion: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={servicioEditando.duracion}
                  onChange={(e) => setServicioEditando({...servicioEditando, duracion: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Precio</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={servicioEditando.precio}
                  onChange={(e) => setServicioEditando({...servicioEditando, precio: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Barberos que ofrecen este servicio</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {barberos.map(barbero => (
                  <div key={barbero.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`barbero-${barbero.id}`}
                      checked={barberosSeleccionados.includes(barbero.id)}
                      onChange={() => handleBarberoToggle(barbero.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`barbero-${barbero.id}`} className="ml-2 text-sm text-gray-200">
                      {barbero.nombre} {barbero.apellido}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mensaje de no resultados */}
      {serviciosFiltrados.length === 0 && !loading && !error && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/30">
          <p className="text-gray-400">
            {searchQuery 
              ? `No se encontraron servicios que coincidan con "${searchQuery}"`
              : "No hay servicios registrados"}
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Lista de Servicios - Grid responsive */}
      {!loading && !error && serviciosFiltrados.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviciosFiltrados.map(servicio => (
            <div key={servicio.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-gray-700/30 hover:shadow-blue-900/20 hover:translate-y-[-2px] transition-all duration-300">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-white">{servicio.nombre}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(servicio)}
                      className="p-1 text-blue-400 hover:text-blue-300"
                      title="Editar servicio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => servicio.id && handleDelete(servicio.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                      title="Eliminar servicio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center mt-2 text-lg">
                  <span className="font-bold text-green-400">{formatPrecio(servicio.precio)}</span>
                  <span className="mx-2 text-gray-500">•</span>
                  <span className="text-gray-300">{servicio.duracion} min</span>
                </div>
                
                {servicio.descripcion && (
                  <p className="mt-2 text-gray-400 text-sm">{servicio.descripcion}</p>
                )}
                
                {servicio.barberos && servicio.barberos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-1">Ofrecido por:</p>
                    <div className="flex flex-wrap gap-1">
                      {servicio.barberos.map(b => (
                        <span key={b.barberoId} className="px-2 py-1 bg-purple-900/40 text-purple-200 text-xs rounded">
                          {b.barbero.nombre} {b.barbero.apellido}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista móvil optimizada para pantallas pequeñas */}
      <div className="md:hidden fixed bottom-4 right-4 z-10">
        <button 
          onClick={() => {
            setServicioEditando({
              nombre: '',
              descripcion: '',
              duracion: 30,
              precio: 0
            });
            setBarberosSeleccionados([]);
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