'use client';

import { useEffect, useState } from 'react';

interface Barbero {
  id: number;
  nombre: string;
  apellido: string;
}

interface Servicio {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
}

export default function ServiceAndBarberList() {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [barberosRes, serviciosRes] = await Promise.all([
          fetch('/api/barberos'),
          fetch('/api/servicios')
        ]);

        console.log('Respuesta barberos:', barberosRes.status);
        console.log('Respuesta servicios:', serviciosRes.status);

        if (!barberosRes.ok || !serviciosRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const barberosData = await barberosRes.json();
        const serviciosData = await serviciosRes.json();

        console.log('Barberos:', barberosData);
        console.log('Servicios:', serviciosData);

        setBarberos(barberosData);
        setServicios(serviciosData);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar datos. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-white text-center py-8">Cargando información...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-gray-700">
          Nuestros Barberos
        </h2>
        {barberos.length === 0 ? (
          <p className="text-gray-400">No hay barberos disponibles</p>
        ) : (
          <div className="grid gap-4">
            {barberos.map((barbero) => (
              <div 
                key={barbero.id} 
                className="bg-gray-800 rounded-lg p-4 shadow-lg hover:bg-gray-700 transition-colors"
              >
                <h3 className="text-lg font-medium text-white">
                  {barbero.nombre} {barbero.apellido}
                </h3>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-gray-700">
          Servicios Disponibles
        </h2>
        {servicios.length === 0 ? (
          <p className="text-gray-400">No hay servicios disponibles</p>
        ) : (
          <div className="grid gap-4">
            {servicios.map((servicio) => (
              <div 
                key={servicio.id} 
                className="bg-gray-800 rounded-lg p-4 shadow-lg hover:bg-gray-700 transition-colors"
              >
                <h3 className="text-lg font-medium text-white mb-2">
                  {servicio.nombre}
                </h3>
                <div className="space-y-1 text-gray-300">
                  <p>Duración: {servicio.duracion} min</p>
                  <p>Precio: ${servicio.precio}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}