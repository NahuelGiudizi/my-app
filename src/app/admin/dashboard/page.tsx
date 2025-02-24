'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Turno {
  id: number;
  fecha: string;
  estado: string;
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
  };
  barbero: {
    nombre: string;
    apellido: string;
  };
  servicio: {
    nombre: string;
    duracion: number;
    precio: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/turnos');
      
      if (!response.ok) {
        throw new Error('Error al cargar turnos');
      }
      
      const data = await response.json();
      setTurnos(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los turnos');
    } finally {
      setLoading(false);
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

  const handleEstadoChange = async (id: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/admin/turnos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        fetchTurnos(); // Recargar los turnos
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado del turno');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Barra lateral */}
      <div className="flex h-screen">
        <div className="w-64 bg-gray-800 text-white p-4">
          <h1 className="text-2xl font-bold mb-8">Panel Admin</h1>
          <nav className="space-y-2">
            <a className="block py-2.5 px-4 rounded bg-blue-600 text-white">
              Dashboard
            </a>
            <a className="block py-2.5 px-4 rounded hover:bg-gray-700 transition">
              Barberos
            </a>
            <a className="block py-2.5 px-4 rounded hover:bg-gray-700 transition">
              Servicios
            </a>
            <a className="block py-2.5 px-4 rounded hover:bg-gray-700 transition">
              Clientes
            </a>
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 transition text-white rounded"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Turnos Reservados</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => fetchTurnos()} 
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                >
                  Actualizar
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-white">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-3"></div>
                <p>Cargando turnos...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 p-4 rounded-lg text-center">
                {error}
              </div>
            ) : turnos.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                No hay turnos reservados
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="bg-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Fecha y Hora
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Barbero
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Servicio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {turnos.map((turno) => (
                        <tr key={turno.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(turno.fecha).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              {turno.cliente.nombre} {turno.cliente.apellido}
                            </div>
                            <div className="text-xs text-gray-400">
                              {turno.cliente.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {turno.barbero.nombre} {turno.barbero.apellido}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">{turno.servicio.nombre}</div>
                            <div className="text-xs text-gray-400">
                              {turno.servicio.duracion} min - ${turno.servicio.precio}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              turno.estado === 'PENDIENTE' ? 'bg-yellow-600' :
                              turno.estado === 'CONFIRMADO' ? 'bg-green-600' :
                              turno.estado === 'CANCELADO' ? 'bg-red-600' :
                              'bg-blue-600'
                            }`}>
                              {turno.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <select 
                              className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600"
                              value={turno.estado}
                              onChange={(e) => handleEstadoChange(turno.id, e.target.value)}
                            >
                              <option value="PENDIENTE">Pendiente</option>
                              <option value="CONFIRMADO">Confirmado</option>
                              <option value="CANCELADO">Cancelado</option>
                              <option value="COMPLETADO">Completado</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}