'use client';
import { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, isSameDay, parseISO, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DisponibilidadProps {
  sucursalId: number;
  barberoId?: number;
  serviciosIds: number[];
  onHorarioSeleccionado: (fecha: Date, hora: string, barberoId: number) => void;
}

interface BarberoDisponible {
  id: number;
  nombre: string;
}

interface SlotHorario {
  hora: string;
  barberos: BarberoDisponible[];
}

export default function DisponibilidadSelector({
  sucursalId,
  barberoId,
  serviciosIds,
  onHorarioSeleccionado
}: DisponibilidadProps) {
  const [date, setDate] = useState<Date>(startOfToday());
  const [disponibilidad, setDisponibilidad] = useState<SlotHorario[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [selectedHora, setSelectedHora] = useState<string | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<number | null>(null);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (!sucursalId || !date) return;
      
      setLoading(true);
      setMensaje(null);
      setSelectedHora(null);
      setSelectedBarbero(null);
      
      try {
        // Construir los parámetros de la URL
        const params = new URLSearchParams();
        params.append('fecha', date.toISOString());
        params.append('sucursalId', sucursalId.toString());
        
        if (barberoId) {
          params.append('barberoId', barberoId.toString());
        }
        
        if (serviciosIds.length > 0) {
          params.append('servicios', serviciosIds.join(','));
        }
        
        // Realizar la petición
        const response = await fetch(`/api/turnos/disponibilidad?${params.toString()}`);
        const data = await response.json();
        
        if (response.ok) {
          setDisponibilidad(data.disponibilidad || []);
          if (data.mensaje) {
            setMensaje(data.mensaje);
          }
        } else {
          setMensaje(data.error || 'Error al cargar la disponibilidad');
          setDisponibilidad([]);
        }
      } catch (error) {
        console.error('Error al obtener disponibilidad:', error);
        setMensaje('Error de conexión. Intenta nuevamente.');
        setDisponibilidad([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDisponibilidad();
  }, [date, sucursalId, barberoId, serviciosIds]);

  const handleSeleccionarHorario = () => {
    if (!selectedHora || !selectedBarbero) return;
    
    const fechaHora = new Date(date);
    const [horas, minutos] = selectedHora.split(':').map(num => parseInt(num));
    fechaHora.setHours(horas, minutos, 0, 0);
    
    onHorarioSeleccionado(fechaHora, selectedHora, selectedBarbero);
  };

  const renderHorarios = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (mensaje) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>{mensaje}</p>
        </div>
      );
    }

    if (disponibilidad.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No hay horarios disponibles para esta fecha</p>
          <p className="text-sm mt-2">Intenta con otra fecha o sucursal</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
        {disponibilidad.map((slot) => (
          <Button
            key={slot.hora}
            variant={selectedHora === slot.hora ? "default" : "outline"}
            className="justify-start h-auto py-2"
            onClick={() => {
              setSelectedHora(slot.hora);
              // Si solo hay un barbero disponible, seleccionarlo automáticamente
              if (slot.barberos.length === 1) {
                setSelectedBarbero(slot.barberos[0].id);
              } else {
                // Si ya había seleccionado un barbero, comprobar si está disponible en este nuevo horario
                if (selectedBarbero) {
                  const barberoDisponible = slot.barberos.find(b => b.id === selectedBarbero);
                  if (!barberoDisponible) {
                    setSelectedBarbero(null);
                  }
                }
              }
            }}
          >
            <div className="text-left">
              <div className="font-medium">{slot.hora}</div>
              <div className="text-xs text-gray-500">
                {slot.barberos.length === 1 
                  ? `Barbero: ${slot.barberos[0].nombre}` 
                  : `${slot.barberos.length} barberos disponibles`}
              </div>
            </div>
          </Button>
        ))}
      </div>
    );
  };

  const renderBarberosDisponibles = () => {
    if (!selectedHora) return null;
    
    const slotSeleccionado = disponibilidad.find(s => s.hora === selectedHora);
    if (!slotSeleccionado || slotSeleccionado.barberos.length <= 1) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Selecciona un barbero:</h4>
        <RadioGroup 
          value={selectedBarbero?.toString() || ""} 
          onValueChange={(value) => setSelectedBarbero(parseInt(value))}
        >
          {slotSeleccionado.barberos.map(barbero => (
            <div key={barbero.id} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={barbero.id.toString()} id={`barbero-${barbero.id}`} />
              <Label htmlFor={`barbero-${barbero.id}`}>{barbero.nombre}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Selecciona fecha y hora</CardTitle>
        <CardDescription>
          Elige una fecha y un horario disponible para tu reserva
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              disabled={(date) => {
                const today = startOfToday();
                return isSameDay(date, today) ? false : date < today;
              }}
              locale={es}
              className="rounded-md border"
            />
          </div>
          <div>
            <h3 className="font-medium mb-2">
              {format(date, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            {renderHorarios()}
            {renderBarberosDisponibles()}
            
            <div className="mt-4">
              <Button 
                onClick={handleSeleccionarHorario} 
                disabled={!selectedHora || !selectedBarbero}
                className="w-full"
              >
                Confirmar horario
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}