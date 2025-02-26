'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import ServiceSelector from '../../components/ServiceSelector';
import DisponibilidadSelector from '../../components/DisponibilidadSelector';

export default function ReservaPage() {
  const [paso, setPaso] = useState(1);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState<number | null>(null);
  const [sucursales, setSucursales] = useState<Array<{ id: number; nombre: string }>>([]);
  const [clienteInfo, setClienteInfo] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservaCompletada, setReservaCompletada] = useState(false);

  // Cargar sucursales cuando el componente se monta
  useState(() => {
    const fetchSucursales = async () => {
      try {
        const response = await fetch('/api/sucursales');
        if (response.ok) {
          const data = await response.json();
          setSucursales(data);
        } else {
          setError('No se pudieron cargar las sucursales');
        }
      } catch (error) {
        console.error('Error cargando sucursales:', error);
        setError('Error al conectar con el servidor');
      }
    };

    fetchSucursales();
  });

  const handleSelectSucursal = (id: number) => {
    setSucursalId(id);
    setPaso(2);
  };

  const handleServiciosChange = (servicios: number[]) => {
    setServiciosSeleccionados(servicios);
  };

  const handleHorarioSeleccionado = (fecha: Date, hora: string, barberoId: number) => {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(hora);
    setBarberoSeleccionado(barberoId);
  };

  const handleClienteInfoChange = (field: string, value: string) => {
    setClienteInfo({
      ...clienteInfo,
      [field]: value
    });
  };

  const handleConfirmarReserva = async () => {
    if (!sucursalId || !fechaSeleccionada || !barberoSeleccionado || serviciosSeleccionados.length === 0) {
      setError('Faltan datos para completar la reserva');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Primero, crear o buscar el cliente
      const clienteResponse = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteInfo),
      });

      if (!clienteResponse.ok) {
        throw new Error('Error al registrar los datos del cliente');
      }

      const cliente = await clienteResponse.json();

      // Luego, crear el turno
      const turnoResponse = await fetch('/api/turnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: cliente.id,
          sucursalId,
          barberoId: barberoSeleccionado,
          fecha: fechaSeleccionada.toISOString(),
          serviciosIds: serviciosSeleccionados,
        }),
      });

      if (!turnoResponse.ok) {
        const errorData = await turnoResponse.json();
        throw new Error(errorData.error || 'Error al crear el turno');
      }

      setReservaCompletada(true);
      setPaso(5);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const renderPaso = () => {
    switch (paso) {
      case 1:
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Selecciona una sucursal</CardTitle>
              <CardDescription>
                Elige la sucursal donde quieres reservar tu turno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sucursales.length === 0 ? (
                  <p className="text-center col-span-full">No hay sucursales disponibles</p>
                ) : (
                  sucursales.map((sucursal) => (
                    <Button
                      key={sucursal.id}
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-start"
                      onClick={() => handleSelectSucursal(sucursal.id)}
                    >
                      <span className="text-lg font-medium">{sucursal.nombre}</span>
                    </Button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <div className="w-full max-w-3xl mx-auto">
            <ServiceSelector
              sucursalId={sucursalId!}
              onServiciosChange={handleServiciosChange}
              initialServicios={serviciosSeleccionados}
            />
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setPaso(1)}>
                Anterior
              </Button>
              <Button
                onClick={() => setPaso(3)}
                disabled={serviciosSeleccionados.length === 0}
              >
                Continuar
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="w-full max-w-3xl mx-auto">
            <DisponibilidadSelector
              sucursalId={sucursalId!}
              serviciosIds={serviciosSeleccionados}
              onHorarioSeleccionado={handleHorarioSeleccionado}
            />
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setPaso(2)}>
                Anterior
              </Button>
              <Button
                onClick={() => setPaso(4)}
                disabled={!fechaSeleccionada || !barberoSeleccionado}
              >
                Continuar
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Tus datos</CardTitle>
              <CardDescription>
                Completa tus datos para confirmar la reserva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={clienteInfo.nombre}
                      onChange={(e) => handleClienteInfoChange('nombre', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      value={clienteInfo.apellido}
                      onChange={(e) => handleClienteInfoChange('apellido', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clienteInfo.email}
                    onChange={(e) => handleClienteInfoChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={clienteInfo.telefono}
                    onChange={(e) => handleClienteInfoChange('telefono', e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setPaso(3)}>
                    Anterior
                  </Button>
                  <Button
                    onClick={handleConfirmarReserva}
                    disabled={loading || !clienteInfo.nombre || !clienteInfo.apellido || !clienteInfo.email || !clienteInfo.telefono}
                  >
                    {loading ? 'Procesando...' : 'Confirmar reserva'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-green-600">
                ¡Reserva Confirmada!
              </CardTitle>
              <CardDescription className="text-center">
                Hemos registrado tu turno exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <p className="mb-4">
                  Te hemos enviado un email con todos los detalles de tu reserva.
                </p>
                <p className="font-medium">
                  ¡Gracias por confiar en nosotros!
                </p>
              </div>
              <div className="mt-6 text-center">
                <Button onClick={() => window.location.href = '/'}>
                  Volver al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Reserva de Turno</h1>
      {renderPaso()}
    </div>
  );
}