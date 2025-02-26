// src/app/admin/sucursales/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Sucursal {
  id?: number;
  nombre: string;
  direccion: string;
  telefono: string;
  horarioInicio: string;
  horarioFin: string;
  diasAtencion: string[];
}

const diasSemana = [
  { id: 'LUNES', label: 'Lunes' },
  { id: 'MARTES', label: 'Martes' },
  { id: 'MIERCOLES', label: 'Miércoles' },
  { id: 'JUEVES', label: 'Jueves' },
  { id: 'VIERNES', label: 'Viernes' },
  { id: 'SABADO', label: 'Sábado' },
  { id: 'DOMINGO', label: 'Domingo' },
];

// Utility function to parse diasAtencion
const parseDiasAtencion = (diasAtencion: string | string[] | undefined): string[] => {
  // If it's already an array, return it
  if (Array.isArray(diasAtencion)) return diasAtencion;
  
  // If it's a string, split it
  if (typeof diasAtencion === 'string') {
    // Handle comma-separated or space-separated strings
    return diasAtencion
      .split(/[,\s]+/)
      .map(dia => dia.trim().toUpperCase())
      .filter(dia => dia); // Remove empty strings
  }
  
  // Return empty array if undefined or invalid input
  return [];
};

export default function SucursalesPage() {
  const router = useRouter();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [sucursalEditando, setSucursalEditando] = useState<Sucursal>({
    nombre: '',
    direccion: '',
    telefono: '',
    horarioInicio: '09:00',
    horarioFin: '18:00',
    diasAtencion: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar sucursales existentes
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/sucursales');
        
        if (!response.ok) {
          throw new Error('Error al cargar sucursales');
        }
        
        const data = await response.json();
        
        // Parse diasAtencion for each sucursal
        const parsedSucursales = data.map((sucursal: Sucursal) => ({
          ...sucursal,
          diasAtencion: parseDiasAtencion(sucursal.diasAtencion)
        }));
        
        setSucursales(parsedSucursales);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar las sucursales');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSucursales();
  }, []);

  const handleDiaToggle = (dia: string) => {
    setSucursalEditando(prev => {
      if (prev.diasAtencion.includes(dia)) {
        return {
          ...prev,
          diasAtencion: prev.diasAtencion.filter(d => d !== dia)
        };
      } else {
        return {
          ...prev,
          diasAtencion: [...prev.diasAtencion, dia]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sucursalData = {
        ...sucursalEditando,
        diasAtencion: sucursalEditando.diasAtencion.join(',')
      };
      
      const url = sucursalData.id 
        ? `/api/admin/sucursales/${sucursalData.id}` 
        : '/api/admin/sucursales';
      
      const method = sucursalData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sucursalData),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar sucursal');
      }
      
      // Recargar datos
      const sucursalesResponse = await fetch('/api/admin/sucursales');
      const sucursalesData = await sucursalesResponse.json();
      
      // Parse diasAtencion for each sucursal
      const parsedSucursales = sucursalesData.map((sucursal: Sucursal) => ({
        ...sucursal,
        diasAtencion: parseDiasAtencion(sucursal.diasAtencion)
      }));
      
      setSucursales(parsedSucursales);
      
      // Limpiar formulario
      setMostrarFormulario(false);
      setSucursalEditando({
        nombre: '',
        direccion: '',
        telefono: '',
        horarioInicio: '09:00',
        horarioFin: '18:00',
        diasAtencion: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la sucursal');
    }
  };

  const handleEdit = (sucursal: Sucursal) => {
    setSucursalEditando({
      ...sucursal,
      diasAtencion: parseDiasAtencion(sucursal.diasAtencion)
    });
    setMostrarFormulario(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;
    
    try {
      const response = await fetch(`/api/admin/sucursales/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar sucursal');
      }
      
      // Actualizar lista
      setSucursales(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la sucursal');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col h-screen">
        <h1 className="text-2xl font-bold mb-8">Panel Admin</h1>
        <nav className="space-y-2 flex-grow">
          <a href="/admin/dashboard" className="block py-2.5 px-4 rounded hover:bg-gray-700 transition">
            Dashboard
          </a>
          <a href="/admin/barberos" className="block py-2.5 px-4 rounded hover:bg-gray-700 transition">
            Barberos
          </a>
          <a href="/admin/servicios" className="block py-2.5 px-4 rounded hover:bg-gray-700 transition">
            Servicios
          </a>
          <a href="/admin/clientes" className="block py-2.5 px-4 rounded hover:bg-gray-700 transition">
            Clientes
          </a>
          <a href="/admin/sucursales" className="block py-2.5 px-4 rounded bg-blue-600 text-white">
            Sucursales
          </a>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto py-2.5 px-4 bg-red-600 hover:bg-red-700 transition text-white rounded flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Gestión de Sucursales</h2>
            <button 
              onClick={() => {
                setSucursalEditando({
                  nombre: '',
                  direccion: '',
                  telefono: '',
                  horarioInicio: '09:00',
                  horarioFin: '18:00',
                  diasAtencion: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
                });
                setMostrarFormulario(true);
              }} 
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Nueva Sucursal
            </button>
          </div>

          {/* Formulario de Sucursal */}
          {mostrarFormulario && (
            <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">
                {sucursalEditando.id ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={sucursalEditando.nombre}
                    onChange={(e) => setSucursalEditando({...sucursalEditando, nombre: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={sucursalEditando.direccion}
                    onChange={(e) => setSucursalEditando({...sucursalEditando, direccion: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={sucursalEditando.telefono}
                    onChange={(e) => setSucursalEditando({...sucursalEditando, telefono: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Horario Inicio</label>
                    <input
                      type="time"
                      value={sucursalEditando.horarioInicio}
                      onChange={(e) => setSucursalEditando({...sucursalEditando, horarioInicio: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Horario Fin</label>
                    <input
                      type="time"
                      value={sucursalEditando.horarioFin}
                      onChange={(e) => setSucursalEditando({...sucursalEditando, horarioFin: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Días de Atención</label>
                  <div className="grid grid-cols-4 gap-2">
                    {diasSemana.map(dia => (
                      <div key={dia.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`dia-${dia.id}`}
                          checked={sucursalEditando.diasAtencion.includes(dia.id)}
                          onChange={() => handleDiaToggle(dia.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`dia-${dia.id}`} className="ml-2 text-sm text-gray-200">
                          {dia.label}
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
                  >Guardar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Sucursales */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="mt-2 text-gray-400">Cargando sucursales...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900 bg-opacity-25 border border-red-600 text-red-400 p-4 rounded-lg">
              {error}
            </div>
          ) : sucursales.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No hay sucursales registradas
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {sucursales.map(sucursal => (
                <div key={sucursal.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-white">{sucursal.nombre}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(sucursal)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => sucursal.id && handleDelete(sucursal.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-gray-300">
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1 1 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {sucursal.direccion}
                      </p>
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {sucursal.telefono}
                      </p>
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {sucursal.horarioInicio} - {sucursal.horarioFin}
                      </p>
                    </div>
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {sucursal.diasAtencion.map(dia => (
                          <span key={dia} className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded">
                            {diasSemana.find(d => d.id === dia)?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}