'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminSidebarProps {
  currentPage: 'dashboard' | 'barberos' | 'servicios' | 'clientes' | 'sucursales';
}

export default function AdminSidebar({ currentPage }: AdminSidebarProps) {
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
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-4 flex-grow">
        <h1 className="text-2xl font-bold mb-8">Panel Admin</h1>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`block py-2.5 px-4 rounded transition-colors text-sm font-medium ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-200'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col h-screen">
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
    </div>
  );
}