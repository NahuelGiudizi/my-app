'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  turnos?: {
    id: number;
    fecha: string;
    estado: string;
  }[];
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/clientes');
        
        if (!response.ok) {
          throw new Error('Error al cargar clientes');
        }
        
        const data = await response.json();
        setClientes(data);
        setClientesFiltrados(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filtrar clientes cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setClientesFiltrados(clientes);
      return;
    }
    
    const termino = busqueda.toLowerCase();
    const filtrados = clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(termino) || 
      cliente.apellido.toLowerCase().includes(termino) || 
      cliente.email.toLowerCase().includes(termino) || 
      cliente.telefono.toLowerCase().includes(termino)
    );
    
    setClientesFiltrados(filtrados);
  }, [busqueda, clientes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clienteData = {
        ...clienteEditando
      };
      
      const url = clienteData.id 
        ? `/api/admin/clientes/${clienteData.id}` 
        : '/api/admin/clientes';
      
      const method = clienteData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar cliente');
      }
      
      // Recargar datos
      const clientesResponse = await fetch('/api/clientes');
      const clientesData = await clientesResponse.json();
      
      setClientes(clientesData);
      setClientesFiltrados(clientesData);
      
      // Limpiar formulario
      setMostrarFormulario(false);
      setClienteEditando({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el cliente');
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setClienteEditando({
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono,
    });
    setMostrarFormulario(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este cliente? Esta acción eliminará también todas sus reservas.')) return;
    
    try {
      const response = await fetch(`/api/admin/clientes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar cliente');
      }
      
      // Actualizar lista
      setClientes(prev => prev.filter(c => c.id !== id));
      setClientesFiltrados(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el cliente');
    }
  };

  const verHistorialTurnos = (id: number) => {
    window.location.href = `/admin/clientes/${id}/turnos`;
  };

  // Barra de búsqueda y botón de nuevo cliente
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
          placeholder="Buscar cliente por nombre, email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setBusqueda('')}
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
      
      <button 
        onClick={() => {
          setClienteEditando({
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
          });
          setMostrarFormulario(true);
        }} 
        className="bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 py-2 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>Nuevo Cliente</span>
      </button>
    </>
  );

  if (loading) {
    return (
      <AdminLayout title="Gestión de Clientes" currentPage="clientes">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Clientes" currentPage="clientes" actions={headerActions}>
      {/* Formulario de Cliente */}
      {mostrarFormulario && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">
            {clienteEditando.id ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Nombre</label>
                <input
                  type="text"
                  value={clienteEditando.nombre}
                  onChange={(e) => setClienteEditando({...clienteEditando, nombre: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Apellido</label>
                <input
                  type="text"
                  value={clienteEditando.apellido}
                  onChange={(e) => setClienteEditando({...clienteEditando, apellido: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                <input
                  type="email"
                  value={clienteEditando.email}
                  onChange={(e) => setClienteEditando({...clienteEditando, email: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={clienteEditando.telefono}
                  onChange={(e) => setClienteEditando({...clienteEditando, telefono: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
                  required
                />
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
      {clientesFiltrados.length === 0 && !loading && !error && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/30">
          <p className="text-gray-400">
            {busqueda 
              ? `No se encontraron clientes que coincidan con "${busqueda}"`
              : "No hay clientes registrados"}
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Lista de Clientes */}
      {!loading && !error && clientesFiltrados.length > 0 && (
        <div className="overflow-x-auto bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30">
          <table className="w-full text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700/30 text-gray-300">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Teléfono</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map(cliente => (
                <tr key={cliente.id} className="border-b border-gray-700 bg-gray-800/10 hover:bg-gray-700/20">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    {cliente.nombre} {cliente.apellido}
                  </td>
                  <td className="px-6 py-4">{cliente.email}</td>
                  <td className="px-6 py-4">{cliente.telefono}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="font-medium text-blue-400 hover:text-blue-300"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => cliente.id && handleDelete(cliente.id)}
                        className="font-medium text-red-400 hover:text-red-300"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => cliente.id && verHistorialTurnos(cliente.id)}
                        className="font-medium text-green-400 hover:text-green-300"
                        title="Ver historial"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista móvil para agregar clientes */}
      <div className="md:hidden fixed bottom-4 right-4 z-10">
        <button 
          onClick={() => {
            setClienteEditando({
              nombre: '',
              apellido: '',
              email: '',
              telefono: '',
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