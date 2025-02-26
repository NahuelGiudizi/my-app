'use client';
import { useEffect, useState } from 'react';
// Adaptamos las importaciones a tu estructura de proyecto
// Importamos directamente desde los archivos locales sin usar alias @/
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion: number;
}

interface ServiceSelectorProps {
  sucursalId: number;
  onServiciosChange: (servicios: number[]) => void;
  initialServicios?: number[];
}

export default function ServiceSelector({ 
  sucursalId, 
  onServiciosChange,
  initialServicios = []
}: ServiceSelectorProps) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServicios, setSelectedServicios] = useState<number[]>(initialServicios);
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [precioTotal, setPrecioTotal] = useState(0);

  // Cargar servicios de la sucursal seleccionada
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sucursales/${sucursalId}/servicios`);
        
        if (!response.ok) {
          throw new Error('Error al cargar los servicios');
        }
        
        const data = await response.json();
        setServicios(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (sucursalId) {
      fetchServicios();
    }
  }, [sucursalId]);

  // Calcular tiempo y precio total
  useEffect(() => {
    const serviciosSeleccionados = servicios.filter(
      servicio => selectedServicios.includes(servicio.id)
    );
    
    const tiempo = serviciosSeleccionados.reduce(
      (total, servicio) => total + servicio.duracion, 0
    );
    
    const precio = serviciosSeleccionados.reduce(
      (total, servicio) => total + Number(servicio.precio), 0
    );
    
    setTiempoTotal(tiempo);
    setPrecioTotal(precio);
    
    // Notificar al componente padre
    onServiciosChange(selectedServicios);
  }, [selectedServicios, servicios, onServiciosChange]);

  // Manejar selección/deselección de servicios
  const toggleServicio = (servicioId: number) => {
    setSelectedServicios(prev => {
      if (prev.includes(servicioId)) {
        return prev.filter(id => id !== servicioId);
      } else {
        return [...prev, servicioId];
      }
    });
  };

  if (loading) {
    return <div className="text-center p-4">Cargando servicios...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Selecciona los servicios</CardTitle>
        <CardDescription>
          Puedes elegir uno o más servicios para tu reserva
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {servicios.length === 0 ? (
            <p className="text-center text-gray-500">
              No hay servicios disponibles en esta sucursal
            </p>
          ) : (
            servicios.map((servicio) => (
              <div key={servicio.id} className="flex items-center space-x-2 border p-3 rounded-lg">
                <Checkbox
                  id={`servicio-${servicio.id}`}
                  checked={selectedServicios.includes(servicio.id)}
                  onCheckedChange={() => toggleServicio(servicio.id)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`servicio-${servicio.id}`}
                    className="cursor-pointer text-sm font-medium"
                  >
                    {servicio.nombre}
                  </Label>
                  {servicio.descripcion && (
                    <p className="text-xs text-gray-500">{servicio.descripcion}</p>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-medium">${servicio.precio.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">{servicio.duracion} min</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      {selectedServicios.length > 0 && (
        <CardFooter className="flex flex-col space-y-2 border-t pt-4">
          <div className="flex justify-between w-full">
            <span className="font-medium">Tiempo estimado:</span>
            <span>{tiempoTotal} minutos</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="font-medium">Precio total:</span>
            <span className="font-bold">${precioTotal.toFixed(2)}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}