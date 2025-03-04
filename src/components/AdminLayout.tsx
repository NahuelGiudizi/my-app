'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import MobileAdminMenu from './MobileAdminMenu';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  currentPage: 'dashboard' | 'barberos' | 'servicios' | 'clientes' | 'sucursales';
  actions?: React.ReactNode;
}

export default function AdminLayout({ 
  children, 
  title, 
  currentPage,
  actions
}: AdminLayoutProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Fixed for all screen sizes */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-800 md:pl-64">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white md:hidden">Panel Admin</h1>
          
          <div className="flex items-center gap-2">
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
      </header>

      {/* Mobile Menu Component */}
      <MobileAdminMenu 
        currentPage={currentPage} 
        isOpen={menuVisible} 
        onClose={closeMenu} 
      />

      {/* Desktop Sidebar Component */}
      <div className="hidden md:block">
        <AdminSidebar currentPage={currentPage} />
      </div>

      {/* Main content - Con padding-top para evitar superposición */}
      <div className="md:pl-64 p-4 md:p-8" style={{ paddingTop: "4rem" }}>
        <div className="max-w-6xl mx-auto">
          {/* Encabezado con título y acciones opcionales */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
            
            {actions && (
              <div className="flex gap-2 items-center">
                {actions}
              </div>
            )}
          </div>

          {/* Contenido principal */}
          {children}
        </div>
      </div>
    </div>
  );
}