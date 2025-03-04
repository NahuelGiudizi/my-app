'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import ServiceSelector from '../../components/ServiceSelector';
import DisponibilidadSelector from '../../components/DisponibilidadSelector';
import AppointmentForm from '../../components/AppointmentForm';

export default function ReservaPage() {
  const [paso, setPaso] = useState(1);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState<number | null>(null);
  const [sucursales, setSucursales] = useState<Array<{ id: number; nombre: string; direccion?: string }>>([]);
  const [clienteInfo, setClienteInfo] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservaCompletada, setReservaCompletada] = useState(false);
  // Estados para información adicional
  const [selectedSucursalInfo, setSelectedSucursalInfo] = useState<any>(null);
  const [selectedBarberoInfo, setSelectedBarberoInfo] = useState<any>(null);
  const [serviciosInfo, setServiciosInfo] = useState<any[]>([]);
  const [precioTotal, setPrecioTotal] = useState(0);
  const [duracionTotal, setDuracionTotal] = useState(0);

  // Cargar sucursales cuando el componente se monta
  useEffect(() => {
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
  }, []);

  // Cuando se selecciona una sucursal, cargar su información
  useEffect(() => {
    if (sucursalId) {
      const sucursal = sucursales.find(s => s.id === sucursalId);
      setSelectedSucursalInfo(sucursal);
    }
  }, [sucursalId, sucursales]);

  // Cuando se seleccionan servicios, cargar su información
  useEffect(() => {
    if (serviciosSeleccionados.length > 0) {
      const fetchServicios = async () => {
        try {
          const response = await fetch('/api/servicios');
          if (response.ok) {
            const allServicios = await response.json();
            const selectedServicios = allServicios.filter((s: any) => 
              serviciosSeleccionados.includes(s.id)
            );
            setServiciosInfo(selectedServicios);
            
            // Calcular precio y duración totales
            const precioTotal = selectedServicios.reduce((total: number, s: any) => total + Number(s.precio), 0);
            const duracionTotal = selectedServicios.reduce((total: number, s: any) => total + s.duracion, 0);
            setPrecioTotal(precioTotal);
            setDuracionTotal(duracionTotal);
          }
        } catch (error) {
          console.error('Error cargando servicios:', error);
        }
      };
      fetchServicios();
    }
  }, [serviciosSeleccionados]);

  // Cuando se selecciona un barbero, cargar su información
  useEffect(() => {
    if (barberoSeleccionado) {
      const fetchBarbero = async () => {
        try {
          const response = await fetch(`/api/barberos/${barberoSeleccionado}`);
          if (response.ok) {
            const barbero = await response.json();
            setSelectedBarberoInfo(barbero);
          }
        } catch (error) {
          console.error('Error cargando barbero:', error);
        }
      };
      fetchBarbero();
    }
  }, [barberoSeleccionado]);

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

  // Componente para mostrar el resumen de la reserva
  const ReservaSummary = () => (
    <Card className="w-full mb-6 lg:mb-0">
      <CardHeader>
        <CardTitle>Resumen de tu reserva</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedSucursalInfo && (
          <div className="space-y-1">
            <h3 className="text-sm text-gray-500">Sucursal</h3>
            <p className="font-medium">{selectedSucursalInfo.nombre}</p>
            {selectedSucursalInfo.direccion && (
              <p className="text-sm text-gray-600">{selectedSucursalInfo.direccion}</p>
            )}
          </div>
        )}

        {serviciosInfo.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm text-gray-500">Servicios seleccionados</h3>
            <ul className="divide-y divide-gray-100">
              {serviciosInfo.map((servicio: any) => (
                <li key={servicio.id} className="py-2 flex justify-between">
                  <span>{servicio.nombre}</span>
                  <span className="font-medium">${Number(servicio.precio).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 flex justify-between font-medium">
              <span>Total:</span>
              <span>${precioTotal.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-500 flex justify-between">
              <span>Duración:</span>
              <span>{duracionTotal} min</span>
            </div>
          </div>
        )}

        {selectedBarberoInfo && (
          <div className="space-y-1">
            <h3 className="text-sm text-gray-500">Barbero</h3>
            <div className="flex items-center space-x-3">
              {selectedBarberoInfo.foto ? (
                <img 
                  src={selectedBarberoInfo.foto} 
                  alt={selectedBarberoInfo.nombre} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {selectedBarberoInfo.nombre?.[0]}{selectedBarberoInfo.apellido?.[0]}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{selectedBarberoInfo.nombre} {selectedBarberoInfo.apellido}</p>
                {selectedBarberoInfo.especialidad && (
                  <p className="text-sm text-gray-600">{selectedBarberoInfo.especialidad}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {fechaSeleccionada && horaSeleccionada && (
          <div className="space-y-1">
            <h3 className="text-sm text-gray-500">Fecha y hora</h3>
            <p className="font-medium">
              {fechaSeleccionada.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}, {horaSeleccionada}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPaso = () => {
    // Aquí manejamos el caso del formulario completo con mejor uso de espacio
    if (paso === 3) {
      return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Resumen (solo en desktop) */}
          <div className="lg:col-span-1 hidden lg:block">
            <ReservaSummary />
          </div>
          
          {/* Columna derecha - Selector de disponibilidad */}
          <div className="lg:col-span-2">
            {/* Versión móvil del resumen */}
            <div className="lg:hidden mb-6">
              <ReservaSummary />
            </div>
            
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
        </div>
      );
    }
    
    // Para los otros pasos, mantenemos el diseño original pero con la misma estructura responsive
    switch (paso) {
      case 1:
        return (
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <Card className="w-full">
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
                          {sucursal.direccion && (
                            <span className="text-sm text-gray-500 mt-1">{sucursal.direccion}</span>
                          )}
                        </Button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 hidden lg:block">
              <ReservaSummary />
            </div>
            
            <div className="lg:col-span-2">
              <div className="lg:hidden mb-6">
                <ReservaSummary />
              </div>
              
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
          </div>
        );

      case 4:
        return (
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 hidden lg:block">
              <ReservaSummary />
            </div>
            
            <div className="lg:col-span-2">
              <div className="lg:hidden mb-6">
                <ReservaSummary />
              </div>
              
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Tus datos</CardTitle>
                  <CardDescription>
                    Completa tus datos para confirmar la reserva
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </div>
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

  // También puedes optar por el componente AppointmentForm para una interfaz más integrada
  if (paso >= 1 && paso <= 4 && false) { // Deshabilitado por ahora, habilitar si quieres usarlo
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Reserva de Turno</h1>
        <AppointmentForm />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Reserva de Turno</h1>
      {renderPaso()}
    </div>
  );
}