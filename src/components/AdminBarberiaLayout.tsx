'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AdminPage = 'dashboard' | 'sucursales' | 'barberos' | 'servicios' | 'clientes' | 'turnos' | 'configuracion';

interface AdminBarberiaLayoutProps {
  children: React.ReactNode;
  title: string;
  currentPage: AdminPage;
  barberiaId?: number; // Si no se provee, se toma de la sesión o estado global
  actions?: React.ReactNode;
}

export default function AdminBarberiaLayout({ 
  children, 
  title, 
  currentPage,
  barberiaId = 1, // Valor por defecto para este ejemplo
  actions
}: AdminBarberiaLayoutProps) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleLogout = async () => {
    try {
      // En una implementación real, esto llamaría a una API de logout
      // await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Lista de items del menú
  const menuItems = [
    { name: 'Dashboard', path: `/admin/barberia/${barberiaId}/dashboard`, id: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Sucursales', path: `/admin/barberia/${barberiaId}/sucursales`, id: 'sucursales', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Barberos', path: `/admin/barberia/${barberiaId}/barberos`, id: 'barberos', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'Servicios', path: `/admin/barberia/${barberiaId}/servicios`, id: 'servicios', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { name: 'Turnos', path: `/admin/barberia/${barberiaId}/turnos`, id: 'turnos', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Clientes', path: `/admin/barberia/${barberiaId}/clientes`, id: 'clientes', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Configuración', path: `/admin/barberia/${barberiaId}/configuracion`, id: 'configuracion', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Fixed for all screen sizes */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-800 md:pl-64">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white md:hidden">Panel Admin</h1>
            <h1 className="text-xl font-bold text-white hidden md:block">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mostrar acciones del header si existen */}
            {actions && <div className="hidden md:flex">{actions}</div>}
            
            {/* Solo mostrar el botón hamburguesa en móvil */}
            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 bg-gray-700 hover:bg-gray-600 rounded-md"
              aria-label={menuVisible ? "Cerrar menú" : "Abrir menú"}
            >
              {menuVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mostrar acciones del header en móvil si existen */}
        {actions && (
          <div className="md:hidden px-4 py-2 bg-gray-800 border-t border-gray-700">
            {actions}
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-800 shadow-lg transition-transform duration-300 transform ${
          menuVisible ? 'translate-y-14' : '-translate-y-full'
        }`}
        style={{ height: 'calc(100vh - 56px)', top: '56px' }}
      >
        <div className="p-4 overflow-y-auto h-full flex flex-col">
          <nav className="space-y-1 mb-4">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center py-2.5 px-4 rounded transition-colors text-sm font-medium ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-200'
                }`}
                onClick={closeMenu}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.name}
              </Link>
            ))}
          </nav>
          
          <button
            onClick={handleLogout}
            className="mt-auto py-2.5 px-4 bg-red-600/30 hover:bg-red-700/40 transition-colors text-red-300 rounded-md text-sm font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 w-64 bg-gray-800 text-white flex flex-col h-screen">
        <div className="p-4 flex-grow overflow-y-auto">
          <div className="mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center text-xl font-bold text-white mr-3">
                BS
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Barbería System</h2>
                <p className="text-xs text-gray-400">Panel de Administración</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center py-2.5 px-4 rounded transition-colors text-sm font-medium ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-700 text-gray-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-600/30 hover:bg-red-700/40 transition-colors text-red-300 rounded-md text-sm font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content - Con padding-top para evitar superposición */}
      <div className="md:pl-64 p-4 md:p-8" style={{ paddingTop: actions ? "7rem" : "4rem" }}>
        <div className="max-w-6xl mx-auto">
          {/* Título solo visible en móvil ya que en desktop está en el header */}
          <div className="md:hidden mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          </div>

          {/* Contenido principal */}
          {children}
        </div>
      </div>