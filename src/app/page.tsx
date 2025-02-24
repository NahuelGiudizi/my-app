import Link from 'next/link';
import AppointmentForm from '@/components/AppointmentForm';
import ServiceAndBarberList from '@/components/ServiceAndBarberList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 py-12 relative">
      {/* Botón de Admin en la esquina superior derecha */}
      <div className="absolute top-4 right-4">
        <Link 
          href="/admin/login" 
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          Panel Admin
        </Link>
      </div>

      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-white mb-12">
          Barbería System
        </h1>
        
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <ServiceAndBarberList />
          <div className="flex justify-center">
            <AppointmentForm />
          </div>
        </div>
      </div>
    </main>
  );
}