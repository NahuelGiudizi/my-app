// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Turno {
  id: number;
  fecha: string;
  estado: string;
  cliente: {
    nombre: string;
    apellido: string;
  };
  barbero: {
    nombre: string;
    apellido: string;
  };
  servicio: {
    nombre: string;
  };
}

export default function Dashboard() {
  const [turnos, setTurnos] = useState<Turno[]>([]);

  useEffect(() => {
    fetch('/api/turnos')
      .then(res => res.json())
      .then(data => setTurnos(data))
      .catch(err => console.error('Error:', err));
  }, []);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-white">Dashboard Administrativo</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-800 rounded-lg">
          <thead>
            <tr className="text-left text-white">
              <th className="p-4">Fecha</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Barbero</th>
              <th className="p-4">Servicio</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno) => (
              <tr key={turno.id} className="border-t border-gray-700 text-gray-300">
                <td className="p-4">{format(new Date(turno.fecha), 'dd/MM/yyyy HH:mm')}</td>
                <td className="p-4">{`${turno.cliente.nombre} ${turno.cliente.apellido}`}</td>
                <td className="p-4">{`${turno.barbero.nombre} ${turno.barbero.apellido}`}</td>
                <td className="p-4">{turno.servicio.nombre}</td>
                <td className="p-4">{turno.estado}</td>
                <td className="p-4">
                  <Button
                    onClick={() => {/* Implementar acciones */}}
                    variant="outline"
                    size="sm"
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}