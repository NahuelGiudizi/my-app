'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MobileAdminMenuProps {
  currentPage: 'dashboard' | 'barberos' | 'servicios' | 'clientes' | 'sucursales';
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileAdminMenu({ currentPage, isOpen, onClose }: MobileAdminMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Lista de items del menú
  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', id: 'dashboard' },
    { name: 'Barberos', path: '/admin/barberos', id: 'barberos' },
    { name: 'Servicios', path: '/admin/servicios', id: 'servicios' },
    { name: 'Clientes', path: '/admin/clientes', id: 'clientes' },
    { name: 'Sucursales', path: '/admin/sucursales', id: 'sucursales' }
  ];

  return (
    <div 
      className={`md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-800 shadow-lg transition-transform duration-300 transform ${
        isOpen ? 'translate-y-14' : '-translate-y-full'
      }`}
      style={{ height: 'calc(100vh - 56px)' }}
    >
      <div className="p-4 overflow-y-auto h-full flex flex-col">
        <nav className="space-y-1 mb-4">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`block py-2.5 px-4 rounded transition-colors text-sm font-medium ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700 text-gray-200'
              }`}
              onClick={onClose}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        <button
          onClick={handleLogout}
          className="mt-auto py-2.5 px-4 bg-red-600/30 hover:bg-red-700/40 transition-colors text-red-300 rounded-md text-sm font-medium flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m13 4a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}