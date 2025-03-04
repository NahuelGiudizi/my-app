'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

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
        
        // More robust parsing of sucursales
        const parsedSucursales = data.map((sucursal: any) => {
          // Extract time from DateTime, handling different input formats
          const extractTime = (dateTime: string) => {
            if (!dateTime) return '00:00';
            const date = new Date(dateTime);
            return date.toLocaleTimeString('es-CL', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }).padStart(5, '0');
          };
  
          // Parse days of operation
          const parseDiasAtencion = (() => {
            if (Array.isArray(sucursal.diasAtencion)) {
              // If it's an array of objects, extract names
              if (sucursal.diasAtencion[0] && typeof sucursal.diasAtencion[0] === 'object') {
                return sucursal.diasAtencion.map((dia: any) => dia.nombre);
              }
              // If it's an array of strings, return as is
              return sucursal.diasAtencion;
            }
            
            // If it's a string, split and trim
            if (typeof sucursal.diasAtencion === 'string') {
              return sucursal.diasAtencion
                .split(',')
                .map(dia => dia.trim().toUpperCase())
                .filter(dia => dia);
            }
            
            // Fallback
            return [];
          })();
  
          return {
            ...sucursal,
            horarioInicio: extractTime(sucursal.horarioInicio),
            horarioFin: extractTime(sucursal.horarioFin),
            diasAtencion: parseDiasAtencion
          };
        });
        
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
      // Validate inputs
      if (!sucursalEditando.nombre || !sucursalEditando.direccion || !sucursalEditando.telefono) {
        alert('Por favor complete todos los campos');
        return;
      }
  
      // Ensure diasAtencion is a comma-separated string
      const sucursalData = {
        ...sucursalEditando,
        diasAtencion: Array.isArray(sucursalEditando.diasAtencion) 
          ? sucursalEditando.diasAtencion.join(',') 
          : sucursalEditando.diasAtencion
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
        // Try to get more detailed error message
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar sucursal');
      }
      
      // Fetch updated data
      const sucursalesResponse = await fetch('/api/admin/sucursales');
      const sucursalesData = await sucursalesResponse.json();
      
      // Parse diasAtencion for each sucursal
      const parsedSucursales = sucursalesData.map((sucursal: any) => ({
        ...sucursal,
        diasAtencion: Array.isArray(sucursal.diasAtencion) 
          ? sucursal.diasAtencion.map((dia: any) => 
              typeof dia === 'object' ? dia.nombre : dia
            )
          : typeof sucursal.diasAtencion === 'string'
            ? sucursal.diasAtencion.split(',').map(dia => dia.trim().toUpperCase())
            : []
      }));
      
      setSucursales(parsedSucursales);
      
      // Reset form
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
      alert(error instanceof Error ? error.message : 'Error al guardar la sucursal');
    }
  };

  const handleEdit = (sucursal: Sucursal) => {
    // Robust parsing of days of operation
    const parsedDiasAtencion = (() => {
      // If diasAtencion is an array, use it directly
      if (Array.isArray(sucursal.diasAtencion)) {
        return sucursal.diasAtencion;
      }
      
      // If it's a string, split and trim
      if (typeof sucursal.diasAtencion === 'string') {
        return sucursal.diasAtencion
          .split(',')
          .map(dia => dia.trim().toUpperCase())
          .filter(dia => dia);
      }
      
      // If it's an array of objects (from backend), extract names
      if (sucursal.diasAtencion && typeof sucursal.diasAtencion[0] === 'object') {
        return sucursal.diasAtencion.map((dia: any) => dia.nombre);
      }
      
      // Fallback to default days
      return ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
    })();
  
    setSucursalEditando({
      ...sucursal,
      diasAtencion: parsedDiasAtencion
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

  // Botón de nueva sucursal que va en el header
  const headerActions = (
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
      className="bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 py-2 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      <span>Nueva Sucursal</span>
    </button>
  );

  if (loading) {
    return (
      <AdminLayout title="Gestión de Sucursales" currentPage="sucursales">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Sucursales" currentPage="sucursales" actions={headerActions}>
      {/* Formulario de Sucursal */}
      {mostrarFormulario && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-lg border border-gray-700/30">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Mensaje si no hay sucursales */}
      {!loading && !error && sucursales.length === 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/30">
          <p className="text-gray-400">No hay sucursales registradas</p>
        </div>
      )}

      {/* Lista de Sucursales */}
      {!loading && !error && sucursales.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sucursales.map(sucursal => (
            <div key={sucursal.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-gray-700/30 hover:shadow-blue-900/20 hover:translate-y-[-2px] transition-all duration-300">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-white">{sucursal.nombre}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(sucursal)}
                      className="p-1 text-blue-400 hover:text-blue-300"
                      title="Editar sucursal"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => sucursal.id && handleDelete(sucursal.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                      title="Eliminar sucursal"
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
                      <span key={dia} className="px-2 py-1 bg-blue-900/40 text-blue-200 text-xs rounded">
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

      {/* Vista móvil optimizada para pantallas pequeñas */}
      <div className="md:hidden fixed bottom-4 right-4 z-10">
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