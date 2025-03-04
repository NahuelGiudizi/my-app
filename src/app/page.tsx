'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import AppointmentForm from '@/components/AppointmentForm';
import ServiceAndBarberList from '@/components/ServiceAndBarberList';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function Home() {
  // Estado para manejar la visibilidad del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Estados para pasar datos preseleccionados al formulario
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);

  // Esta función maneja todos los clics de reserva y pasa los datos adecuados
  const handleReserveClick = (type: 'service' | 'barber' | 'promotion', id?: number) => {
    if (type === 'service') {
      setSelectedService(id || null);
      setSelectedBarber(null);
    } else if (type === 'barber') {
      setSelectedBarber(id || null);
      setSelectedService(null);
    }
    // Abrir el modal
    setIsModalOpen(true);
    // Prevenir scroll en el body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  };

  // Cerrar el modal y restaurar el scroll
  const handleCloseModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  // Limpiar el estilo de overflow cuando el componente se desmonta
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 py-12 relative overflow-hidden">
      {/* Animated Background Component */}
      <AnimatedBackground />
      
      {/* Botón de Admin en la esquina superior derecha */}
      <div className="absolute top-4 right-4 z-10">
        <Link 
          href="/admin/login" 
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          Panel Admin
        </Link>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 relative">
          <h1 className="text-5xl font-bold text-center text-white mb-4">
            Barbería System
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Cortes de precisión y estilo que definen tu imagen personal
          </p>
          
          {/* CTA principal */}
          <button 
            onClick={() => handleReserveClick('promotion')}
            className="mt-8 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:translate-y-[-2px] active:translate-y-0"
          >
            Reservar Ahora
          </button>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
          {/* Panel de servicios y barberos */}
          <div className="bg-gray-800/80 rounded-lg p-6 shadow-xl hover:shadow-blue-900/10 transition-all border border-gray-700/50">
            <ServiceAndBarberList 
              onServiceReserveClick={(id) => handleReserveClick('service', id)}
              onBarberReserveClick={(id) => handleReserveClick('barber', id)}
            />
          </div>
          
          {/* Panel con formulario visible solo en desktop */}
          <div className="bg-gray-800/80 rounded-lg p-6 shadow-xl hover:shadow-blue-900/10 transition-all hidden lg:block border border-gray-700/50">
            <AppointmentForm 
              preselectedService={selectedService} 
              preselectedBarber={selectedBarber}
            />
          </div>
        </div>
        
        {/* Footer minimalista */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 Barbería System. Todos los derechos reservados.</p>
          <div className="flex justify-center space-x-6 mt-3">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </footer>
      </div>

      {/* Modal para el formulario de reserva - Versión Mejorada con Scroll */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          {/* Overlay con efecto de blur */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>
          
          {/* Contenedor del modal con altura máxima y scroll interno */}
          <div 
            className="relative bg-gray-800 rounded-lg border border-gray-700 max-w-3xl w-full mx-4 my-4 md:mx-auto z-50 overflow-hidden transform transition-all animate-modal-open shadow-xl max-h-[90vh] flex flex-col"
          >
            {/* Botón para cerrar */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Header del modal fijo */}
            <div className="p-6 pb-0 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                Reserva tu cita
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Completa el formulario para asegurar tu horario
              </p>
            </div>
            
            {/* Contenido del modal con scroll */}
            <div className="p-6 overflow-y-auto">
              <AppointmentForm 
                preselectedService={selectedService} 
                preselectedBarber={selectedBarber}
                onComplete={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Estilos para la animación del modal */}
      <style jsx global>{`
        @keyframes modalOpen {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-modal-open {
          animation: modalOpen 0.3s ease-out forwards;
        }
        
        /* Estilos para optimizar el scroll en el modal */
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.5) rgba(31, 41, 55, 0.1);
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.1);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
          border-radius: 3px;
        }
      `}</style>
    </main>
  );
}