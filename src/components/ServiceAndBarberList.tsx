//my-app\src\components\ServiceAndBarberList.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Barbero {
  id: number;
  nombre: string;
  apellido: string;
  foto?: string; // URL de la foto
  especialidad?: string; // Nueva propiedad
  experiencia?: number; // Nueva propiedad (años)
  calificacion?: number; // Nueva propiedad (de 1 a 5)
  instagram?: string; // Nueva propiedad
}

interface Servicio {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
  descripcion?: string; // Nueva propiedad
  imagen?: string; // URL de la imagen
}

// Añadimos props para los callbacks de reserva
interface ServiceAndBarberListProps {
  onServiceReserveClick?: (id: number) => void;
  onBarberReserveClick?: (id: number) => void;
}

export default function ServiceAndBarberList({
  onServiceReserveClick,
  onBarberReserveClick
}: ServiceAndBarberListProps) {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<Barbero | null>(null);
  const [activeTab, setActiveTab] = useState<'barberos' | 'servicios'>('barberos');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [barberosRes, serviciosRes] = await Promise.all([
          fetch('/api/barberos'),
          fetch('/api/servicios')
        ]);

        if (!barberosRes.ok || !serviciosRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const barberosData = await barberosRes.json();
        const serviciosData = await serviciosRes.json();

        // Simular datos adicionales para el ejemplo
        const barberosConDetalles = barberosData.map((barbero: Barbero) => ({
          ...barbero,
          foto: `/barberos/${barbero.id}.jpg`, // URL de ejemplo - deberías tener fotos reales
          especialidad: ['Cortes clásicos', 'Degradados', 'Barba', 'Cortes modernos'][Math.floor(Math.random() * 4)],
          experiencia: Math.floor(Math.random() * 10) + 1,
          calificacion: (Math.floor(Math.random() * 10) + 40) / 10, // Entre 4.0 y 5.0
          instagram: `@${barbero.nombre.toLowerCase()}${barbero.apellido.toLowerCase()}`
        }));

        const serviciosConDetalles = serviciosData.map((servicio: Servicio) => ({
          ...servicio,
          descripcion: [
            "Incluye lavado y secado",
            "Finalizado con productos premium",
            "Técnica personalizada según la forma del rostro",
            "Incluye asesoramiento personalizado"
          ][Math.floor(Math.random() * 4)],
          imagen: `/servicios/${servicio.id}.jpg` // URL de ejemplo
        }));

        setBarberos(barberosConDetalles);
        setServicios(serviciosConDetalles);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar datos. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Renderizar estrellas según la calificación
  const renderEstrellas = (calificacion: number) => {
    const estrellas = [];
    const fullStars = Math.floor(calificacion);
    const hasHalfStar = calificacion % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      estrellas.push(
        <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (hasHalfStar) {
      estrellas.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-yellow-400">
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
        <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    }
    
    return estrellas;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin mb-4"></div>
        <p className="text-white text-lg">Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 text-center max-w-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-red-500 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-300 text-lg font-medium mb-2">¡Algo salió mal!</p>
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Modal para detalles del barbero
  const renderBarberoModal = () => {
    if (!selectedBarbero) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedBarbero(null)}>
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl max-w-md w-full overflow-hidden shadow-2xl transform transition-all animate-modal-open" onClick={e => e.stopPropagation()}>
          <div className="relative h-72 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>
            <div className="w-full h-full bg-gray-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
              <div className="flex items-center justify-center h-full">
                <div className="w-36 h-36 rounded-full bg-gray-800 border-4 border-white/20 flex items-center justify-center text-white text-6xl font-bold">
                  {selectedBarbero.nombre[0]}{selectedBarbero.apellido[0]}
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <h3 className="text-2xl font-bold text-white">{selectedBarbero.nombre} {selectedBarbero.apellido}</h3>
              <div className="flex items-center mt-1">
                {renderEstrellas(selectedBarbero.calificacion || 4)}
                <span className="ml-2 text-gray-300 text-sm">({selectedBarbero.calificacion?.toFixed(1)})</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Especialidad</div>
                <div className="font-medium text-white">{selectedBarbero.especialidad}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Experiencia</div>
                <div className="font-medium text-white">{selectedBarbero.experiencia} años</div>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">Acerca de</h4>
              <p className="text-gray-300">
                {selectedBarbero.nombre} es un barbero con {selectedBarbero.experiencia} años de experiencia, 
                especializado en {selectedBarbero.especialidad}. Apasionado por su trabajo y comprometido 
                con la satisfacción de sus clientes.
              </p>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <a 
                href={`https://instagram.com/${selectedBarbero.instagram?.substring(1)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-pink-400 hover:text-pink-300"
              >
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
                {selectedBarbero.instagram}
              </a>
              
              {/* Ahora usamos el callback recibido por props */}
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation(); // Evitar que se cierre el modal por el onClick del overlay
                  if (onBarberReserveClick) {
                    onBarberReserveClick(selectedBarbero.id);
                    setSelectedBarbero(null); // Cerrar modal después de reservar
                  } else {
                    // Fallback al comportamiento anterior si no hay callback
                    window.location.href = '/reserva?barbero=' + selectedBarbero.id;
                  }
                }}
              >
                Reservar Turno
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-6 py-3 text-lg font-medium transition-colors ${
            activeTab === 'barberos'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('barberos')}
        >
          Nuestros Barberos
        </button>
        <button
          className={`px-6 py-3 text-lg font-medium transition-colors ${
            activeTab === 'servicios'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('servicios')}
        >
          Servicios
        </button>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'barberos' ? (
        <section>
          {barberos.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No hay barberos disponibles</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {barberos.map((barbero) => (
                <div 
                  key={barbero.id} 
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-blue-900/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedBarbero(barbero)}
                >
                  <div className="h-48 bg-gray-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                    <div className="flex items-center justify-center h-full">
                      <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-white/20 flex items-center justify-center text-white text-4xl font-bold">
                        {barbero.nombre[0]}{barbero.apellido[0]}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-white">{barbero.nombre} {barbero.apellido}</h3>
                      <span className="bg-blue-600/20 text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
                        {barbero.especialidad}
                      </span>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      {renderEstrellas(barbero.calificacion || 4)}
                      <span className="ml-2 text-gray-400 text-sm">({barbero.calificacion?.toFixed(1)})</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-gray-400 text-sm">{barbero.experiencia} años de exp.</div>
                      <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        Ver perfil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          {servicios.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No hay servicios disponibles</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {servicios.map((servicio) => (
                <div 
                  key={servicio.id} 
                  className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-900/20 transition-all duration-300"
                >
                  {/* Cabecera con título principal */}
                  <div className="h-40 bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white px-4 text-center">
                      {servicio.nombre}
                    </h3>
                  </div>
                  
                  {/* Contenido con info y botón */}
                  <div className="p-5">
                    {/* Descripción */}
                    <p className="text-gray-300 text-sm min-h-[50px] mb-4">
                      {servicio.descripcion || 'Servicio profesional de barbería'}
                    </p>
                    
                    {/* Info de precio y duración */}
                    <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                      <div className="space-y-1">
                        
                        <div className="flex items-center text-gray-400 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {servicio.duracion} min
                        </div>
                        <div className="text-green-400 font-medium text-lg">
                          ${servicio.precio}
                        </div>
                      </div>
                      
                      {/* Ahora usamos el callback para el botón de reserva de servicio */}
                      <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onServiceReserveClick) {
                            onServiceReserveClick(servicio.id);
                          } else {
                            // Fallback al comportamiento anterior si no hay callback
                            window.location.href = '/reserva?servicio=' + servicio.id;
                          }
                        }}
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal para detalles del barbero */}
      {renderBarberoModal()}
      
      {/* Estilos para la animación del modal */}
      <style jsx global>{`
        @keyframes modalOpen {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-modal-open {
          animation: modalOpen 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}