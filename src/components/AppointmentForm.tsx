'use client';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useEffect } from "react";
import { parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { format, addDays, isSameDay } from 'date-fns';

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  horarioInicio: string;
  horarioFin: string;
  diasAtencion: string[];
}

interface Barbero {
  id: number;
  nombre: string;
  apellido: string;
  foto?: string;
  especialidad?: string;
  experiencia?: number;
  calificacion?: number;
  sucursales: { sucursalId: number }[];
}

interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  duracion: number;
  precio: number;
  imagen?: string;
  categoria?: string;
}

interface TimeSlot {
  inicio: Date;
  fin: Date;
  disponible: boolean;
}

// Añadimos props para permitir preselección
interface AppointmentFormProps {
  preselectedService?: number | null;
  preselectedBarber?: number | null;
  onComplete?: () => void;
}

export default function AppointmentForm({ 
  preselectedService = null,
  preselectedBarber = null,
  onComplete 
}: AppointmentFormProps) {
  // Estados para tracking del proceso
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingComponent, setLoadingComponent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservaCompletada, setReservaCompletada] = useState(false);

  // Estados de datos
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [serviciosPorCategoria, setServiciosPorCategoria] = useState<Record<string, Servicio[]>>({});
  const [barberosFiltrados, setBarberosFiltrados] = useState<Barbero[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [diasDisponibles, setDiasDisponibles] = useState<Date[]>([]);

  // Estados de selección
  const [selectedSucursal, setSelectedSucursal] = useState<string>("");
  const [selectedBarbero, setSelectedBarbero] = useState<string>("");
  const [selectedServicios, setSelectedServicios] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [duracionTotal, setDuracionTotal] = useState<number>(0);
  const [precioTotal, setPrecioTotal] = useState<number>(0);

  // Estado de datos del cliente
  const [clienteData, setClienteData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
  });

  // Configuración de pasos
  const steps = [
    { id: 1, name: 'Sucursal', description: 'Elige dónde quieres reservar' },
    { id: 2, name: 'Servicios', description: 'Selecciona los servicios que necesitas' },
    { id: 3, name: 'Barbero', description: 'Elige quién te atenderá' },
    { id: 4, name: 'Fecha y Hora', description: 'Selecciona cuándo quieres tu cita' },
    { id: 5, name: 'Tus Datos', description: 'Completa tus datos personales' },
  ];

  // Cargar datos iniciales: sucursales, barberos y servicios
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingComponent(true);
        
        const [sucursalesRes, barberosRes, serviciosRes] = await Promise.all([
          fetch("/api/sucursales"),
          fetch("/api/barberos?incluirSucursales=true"),
          fetch("/api/servicios"),
        ]);

        const sucursalesData = await sucursalesRes.json();
        const barberosData = await barberosRes.json();
        const serviciosData = await serviciosRes.json();

        setSucursales(sucursalesData);
        setBarberos(barberosData);
        
        // Añadir categorías a los servicios si no existen
        const serviciosConCategorias = serviciosData.map((servicio: Servicio) => ({
          ...servicio,
          categoria: servicio.categoria || categorizarServicio(servicio.nombre)
        }));
        
        setServicios(serviciosConCategorias);
        
        // Agrupar servicios por categoría
        const agrupados = serviciosConCategorias.reduce((acc: Record<string, Servicio[]>, servicio: Servicio) => {
          const categoria = servicio.categoria || 'Otros';
          if (!acc[categoria]) {
            acc[categoria] = [];
          }
          acc[categoria].push(servicio);
          return acc;
        }, {});
        
        setServiciosPorCategoria(agrupados);
        
        // Generar días disponibles para los próximos 30 días
        const dias = [];
        for (let i = 0; i < 30; i++) {
          dias.push(addDays(new Date(), i));
        }
        setDiasDisponibles(dias);
        
        // Si tenemos servicio o barbero preseleccionado, lo configuramos
        if (preselectedService) {
          const servicioId = preselectedService.toString();
          setSelectedServicios([servicioId]);
          // Si tenemos un servicio preseleccionado, vamos directamente al paso 2
          setStep(2);
        }
        
        if (preselectedBarber) {
          const barberoId = preselectedBarber.toString();
          setSelectedBarbero(barberoId);
          
          // Encontrar sucursales donde trabaja este barbero
          const barbero = barberosData.find((b: Barbero) => b.id === preselectedBarber);
          if (barbero && barbero.sucursales && barbero.sucursales.length > 0) {
            // Si solo tiene una sucursal, la seleccionamos automáticamente
            if (barbero.sucursales.length === 1) {
              setSelectedSucursal(barbero.sucursales[0].sucursalId.toString());
              // Si tenemos barbero y sucursal, vamos al paso 2 para elegir servicios
              setStep(2);
            }
          }
        }
        
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        setError("No pudimos cargar los datos. Por favor, intenta nuevamente.");
      } finally {
        setLoadingComponent(false);
      }
    };

    fetchData();
  }, [preselectedService, preselectedBarber]);

  // Filtrar barberos por sucursal seleccionada
  useEffect(() => {
    if (selectedSucursal) {
      const sucursalId = parseInt(selectedSucursal);
      
      const filtrados = barberos.filter((barbero) => {
        if (!barbero.sucursales) return false;
        return barbero.sucursales.some((s) => s.sucursalId === sucursalId);
      });

      setBarberosFiltrados(filtrados);

      // Si el barbero seleccionado ya no está disponible, resetear
      if (
        selectedBarbero &&
        !filtrados.some((b) => b.id.toString() === selectedBarbero)
      ) {
        setSelectedBarbero("");
      }
    } else {
      setBarberosFiltrados([]);
      setSelectedBarbero("");
    }
  }, [selectedSucursal, barberos, selectedBarbero]);

  // Calcular duración y precio total al seleccionar servicios
  useEffect(() => {
    if (selectedServicios.length > 0) {
      let duracion = 0;
      let precio = 0;

      selectedServicios.forEach((servicioId) => {
        const servicio = servicios.find((s) => s.id.toString() === servicioId);
        if (servicio) {
          duracion += Number(servicio.duracion);
          precio += Number(servicio.precio);
        }
      });

      setDuracionTotal(duracion);
      setPrecioTotal(precio);
    } else {
      setDuracionTotal(0);
      setPrecioTotal(0);
    }
  }, [selectedServicios, servicios]);

  // Obtener horarios disponibles cuando se han seleccionado fecha, sucursal, servicios y barbero
  useEffect(() => {
    if (selectedDate && selectedSucursal && selectedServicios.length > 0 && selectedBarbero) {
      const fetchTimeSlots = async () => {
        try {
          setLoading(true);
          setTimeSlots([]);
          
          const sucursalId = parseInt(selectedSucursal);
          const barberoId = parseInt(selectedBarbero);
          const serviciosIds = selectedServicios.map((id) => parseInt(id));
          
          console.log("Solicitando disponibilidad para:", {
            fecha: selectedDate.toISOString(),
            sucursalId,
            barberoId,
            servicios: serviciosIds,
            duracion: duracionTotal
          });

          // Construir URL con todos los parámetros necesarios
          const url = `/api/disponibilidad?fecha=${selectedDate.toISOString()}&sucursalId=${sucursalId}&barberoId=${barberoId}&servicios=${serviciosIds.join(",")}&duracion=${duracionTotal}`;
          
          const response = await fetch(url);

          if (!response.ok) {
            // Intentar obtener mensaje de error del servidor
            try {
              const errorData = await response.json();
              console.error("Error de disponibilidad:", errorData);
              setError(errorData.error || "Error al obtener horarios disponibles");
            } catch (jsonError) {
              setError(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            setTimeSlots([]);
            return;
          }

          const data = await response.json();
          console.log("Horarios disponibles recibidos:", data);
          
          // Mapear los slots recibidos
          const slots = data.map((slot) => ({
            ...slot,
            inicio: new Date(slot.inicio),
            fin: new Date(slot.fin)
          }));
          
          setTimeSlots(slots);
          
          // Limpiar la selección de hora si la selección anterior ya no está disponible
          if (selectedTime) {
            const slotSeleccionado = slots.find(
              slot => slot.disponible && 
                     slot.inicio.getTime() === selectedTime.getTime()
            );
            
            if (!slotSeleccionado) {
              console.log("Reseteando selección de hora porque ya no está disponible");
              setSelectedTime(null);
            }
          }
          
          setError(null);
        } catch (error) {
          console.error("Error obteniendo horarios:", error);
          setError("No pudimos obtener los horarios disponibles.");
          setTimeSlots([]);
        } finally {
          setLoading(false);
        }
      };

      fetchTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, selectedSucursal, selectedServicios, selectedBarbero, duracionTotal, selectedTime]);

  // Manejadores de eventos
  const handleServicioToggle = (servicioId: string) => {
    setSelectedServicios((prevSelected) => {
      if (prevSelected.includes(servicioId)) {
        return prevSelected.filter((id) => id !== servicioId);
      } else {
        return [...prevSelected, servicioId];
      }
    });
  };

  // Dentro de AppointmentForm.tsx
// Este código debe reemplazar la sección del handleSubmit en tu componente

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (
    !selectedDate ||
    !selectedTime ||
    !selectedBarbero ||
    selectedServicios.length === 0 ||
    !selectedSucursal
  ) {
    setError("Por favor completa todos los campos requeridos");
    return;
  }

  setLoading(true);
  setError(null);
  
  try {
    // Verificar disponibilidad actual antes de proceder
    console.log("Verificando disponibilidad actual...");
    const verifyUrl = `/api/disponibilidad?fecha=${selectedDate.toISOString()}&sucursalId=${selectedSucursal}&barberoId=${selectedBarbero}&servicios=${selectedServicios.join(",")}&duracion=${duracionTotal}`;
    
    const verifyResponse = await fetch(verifyUrl);
    if (!verifyResponse.ok) {
      throw new Error("Error al verificar disponibilidad");
    }
    
    const slots = await verifyResponse.json();
    console.log("Slots verificados:", slots);
    
    // Convertir el tiempo seleccionado a un formato comparable
    const selectedTimeISOString = selectedTime.toISOString();
    
    // Verificar si hay un slot disponible que coincida con el horario seleccionado
    let slotDisponible = false;
    
    for (const slot of slots) {
      // Comparar directamente los objetos Date convertidos a ISO string
      // para evitar problemas con zonas horarias
      if (new Date(slot.inicio).toISOString() === selectedTimeISOString && slot.disponible) {
        slotDisponible = true;
        console.log("¡Slot disponible encontrado!");
        break;
      }
    }
    
    if (!slotDisponible) {
      throw new Error("El horario seleccionado ya no está disponible. Por favor, selecciona otro horario.");
    }
    
    // Crear un objeto Date en UTC con la fecha y hora seleccionadas
    // para asegurar consistencia en la zona horaria
    const utcDateTime = new Date(Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
      selectedTime.getUTCHours(),
      selectedTime.getUTCMinutes(),
      0,
      0
    ));

    // Preparar datos para enviar
    const dataToSend = {
      fecha: utcDateTime.toISOString(), // Usar la fecha UTC convertida correctamente
      barberoId: parseInt(selectedBarbero),
      serviciosIds: selectedServicios.map((id) => parseInt(id)),
      sucursalId: parseInt(selectedSucursal),
      duracion: duracionTotal,
      clienteData,
      estado: "PENDIENTE",
    };

    console.log("Datos a enviar:", dataToSend);

    const response = await fetch("/api/turnos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al crear el turno");
    }

    const result = await response.json();
    console.log("Respuesta:", result);

    setReservaCompletada(true);
    
    // Si existe onComplete callback, lo ejecutamos
    if (onComplete) {
      setTimeout(onComplete, 3000); // Esperamos 3 segundos para que el usuario vea el mensaje de éxito
    }
  } catch (error: any) {
    console.error("Error:", error);
    setError(error.message || "Error al procesar la solicitud");
  } finally {
    setLoading(false);
  }
};

  const handleNext = () => {
    // Validar que se pueda avanzar al siguiente paso
    if (step === 1 && !selectedSucursal) {
      setError("Por favor selecciona una sucursal para continuar");
      return;
    }
    
    if (step === 2 && selectedServicios.length === 0) {
      setError("Por favor selecciona al menos un servicio para continuar");
      return;
    }
    
    if (step === 3 && !selectedBarbero) {
      setError("Por favor selecciona un barbero para continuar");
      return;
    }
    
    if (step === 4 && (!selectedDate || !selectedTime)) {
      setError("Por favor selecciona fecha y hora para continuar");
      return;
    }
    
    // Si pasa la validación, avanzar al siguiente paso
    setError(null);
    setStep((prevStep) => Math.min(prevStep + 1, steps.length));
  };

  const handleBack = () => {
    setStep((prevStep) => Math.max(prevStep - 1, 1));
    setError(null);
  };

  const resetForm = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedBarbero("");
    setSelectedServicios([]);
    setSelectedSucursal("");
    setClienteData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
    });
    setStep(1);
    setReservaCompletada(false);
  };

  // Función auxiliar para categorizar servicios por nombre
  const categorizarServicio = (nombre: string): string => {
    nombre = nombre.toLowerCase();
    if (nombre.includes('corte')) return 'Cortes';
    if (nombre.includes('barba') || nombre.includes('afeitado')) return 'Barba';
    if (nombre.includes('color') || nombre.includes('tinte')) return 'Color';
    if (nombre.includes('tratamiento') || nombre.includes('mascarilla')) return 'Tratamientos';
    return 'Otros';
  };

  // Función para renderizar las estrellas según la calificación
  const renderEstrellas = (calificacion: number = 0) => {
    const estrellas = [];
    const fullStars = Math.floor(calificacion);
    const hasHalfStar = calificacion % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      estrellas.push(
        <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (hasHalfStar) {
      estrellas.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-yellow-400">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" fill="url(#half-star)" />
          <defs>
            <linearGradient id="half-star" x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#374151" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    
    // Añadir estrellas vacías
    const emptyStars = 5 - estrellas.length;
    for (let i = 0; i < emptyStars; i++) {
      estrellas.push(
        <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    }
    
    return (
      <div className="flex items-center">
        <div className="flex">{estrellas}</div>
        <span className="ml-1 text-gray-400 text-xs">({calificacion.toFixed(1)})</span>
      </div>
    );
  };

  // Componentes para cada paso del proceso
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                  ${step > s.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : step === s.id
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-gray-600 text-gray-500'}
                `}
              >
                {step > s.id ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              <span className={`mt-2 text-xs font-medium ${step === s.id ? 'text-blue-600' : 'text-gray-500'}`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
        
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-700"></div>
          <div 
            className="absolute top-0 left-0 h-0.5 bg-blue-600 transition-all duration-500 ease-in-out" 
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
        
        <h2 className="text-xl font-bold text-white mt-6">{steps[step-1].name}</h2>
        <p className="text-gray-400 text-sm">{steps[step-1].description}</p>
      </div>
    );
  };

  const renderReservaSummary = () => {
    if (!selectedSucursal && !selectedServicios.length && !selectedBarbero && !selectedDate) {
      return null;
    }
    
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-inner">
        <h3 className="text-sm font-medium text-gray-300 mb-3 border-b border-gray-700 pb-2">Resumen de tu reserva</h3>
        
        <div className="space-y-2 text-sm">
          {selectedSucursal && (
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <span className="text-gray-400">Sucursal:</span>
                <span className="ml-1 text-white">
                  {sucursales.find(s => s.id.toString() === selectedSucursal)?.nombre}
                </span>
              </div>
            </div>
          )}
          
          {selectedServicios.length > 0 && (
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <div>
                <span className="text-gray-400">Servicios:</span>
                <span className="ml-1 text-white">
                  {selectedServicios.map(id => 
                    servicios.find(s => s.id.toString() === id)?.nombre
                  ).join(", ")}
                </span>
                <div className="mt-1">
                  <span className="text-gray-400">Duración:</span>
                  <span className="ml-1 text-white">{duracionTotal} min</span>
                  <span className="mx-2 text-gray-600">•</span>
                  <span className="text-gray-400">Precio:</span>
                  <span className="ml-1 text-green-400">${precioTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          
          {selectedBarbero && (
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <span className="text-gray-400">Barbero:</span>
                <span className="ml-1 text-white">
                  {barberos.find(b => b.id.toString() === selectedBarbero)?.nombre} {barberos.find(b => b.id.toString() === selectedBarbero)?.apellido}
                </span>
              </div>
            </div>
          )}
          
          {selectedDate && selectedTime && (
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <span className="text-gray-400">Fecha y hora:</span>
                <span className="ml-1 text-white">
                  {format(selectedDate, 'EEEE d MMMM', { locale: es })} a las {format(selectedTime, 'HH:mm')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSucursalSelector = () => {
    const formatTime = (dateTimeString: string) => {
      try {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('es-CL', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }).padStart(5, '0');
      } catch (error) {
        console.error('Error formatting time:', error);
        return dateTimeString; // Fallback to original string if parsing fails
      }
    };
  
    const formatDays = (diasAtencion: any) => {
      // Verifica si diasAtencion existe y no está vacío
      if (!diasAtencion || (Array.isArray(diasAtencion) && diasAtencion.length === 0)) {
        return 'No hay información de días';
      }
      
      // Handle different possible input formats
      if (Array.isArray(diasAtencion)) {
        // If it's an array of objects with 'nombre' property
        if (diasAtencion[0] && typeof diasAtencion[0] === 'object' && 'nombre' in diasAtencion[0]) {
          return diasAtencion.map(dia => dia.nombre).join(', ');
        }
        // If it's an array of strings
        return diasAtencion.join(', ');
      }
      
      // If it's a comma-separated string
      if (typeof diasAtencion === 'string') {
        return diasAtencion.split(',')
          .map(dia => dia.trim())
          .join(', ');
      }
      
      // Si llegamos aquí, puede ser un tipo de dato no esperado
      return String(diasAtencion);
    };
  
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sucursales.map((sucursal) => (
            <div 
              key={sucursal.id} 
              className={`
                relative p-5 rounded-lg cursor-pointer transition-all duration-300
                border border-gray-700 
                ${selectedSucursal === sucursal.id.toString() 
                  ? 'bg-gradient-to-br from-blue-900 to-blue-800 shadow-lg shadow-blue-900/20 border-blue-600 scale-105' 
                  : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 hover:border-gray-600'}
              `}
              onClick={() => setSelectedSucursal(sucursal.id.toString())}
            >
              {/* Selected indicator */}
              {selectedSucursal === sucursal.id.toString() && (
                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
  
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white mb-2">{sucursal.nombre}</h3>
                
                <div className="flex items-start text-gray-300 space-x-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1 1 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">{sucursal.direccion}</span>
                </div>
                
                <div className="flex items-center text-gray-300 space-x-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">
                    {formatTime(sucursal.horarioInicio)} - {formatTime(sucursal.horarioFin)}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-300 space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">
                    {formatDays(sucursal.diasAtencion)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const renderServiciosSelector = () => {
    return (
      <div className="space-y-6">
        {/* Selector por categorías */}
        {Object.entries(serviciosPorCategoria).map(([categoria, serviciosList]) => (
          <div key={categoria} className="space-y-3">
            <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">
              {categoria}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviciosList.map((servicio) => (
                <div 
                  key={servicio.id}
                  onClick={() => handleServicioToggle(servicio.id.toString())}
                  className={`
                    relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                    ${selectedServicios.includes(servicio.id.toString()) 
                      ? 'bg-gradient-to-br from-blue-900 to-blue-800 shadow-lg shadow-blue-500/20 border border-blue-500 transform scale-105' 
                      : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 border border-gray-700 hover:border-gray-600'}
                  `}
                >
                  <div className="p-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {servicio.nombre}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {servicio.descripcion || 'Servicio profesional de barbería'}
                      </p>
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center text-blue-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {servicio.duracion} min
                        </div>
                        <div className="text-green-300 font-medium">
                          ${servicio.precio}
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      {selectedServicios.includes(servicio.id.toString()) ? (
                        <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-6 w-6 border-2 border-gray-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  {/* Indicador de seleccionado */}
                  {selectedServicios.includes(servicio.id.toString()) && (
                    <div className="absolute top-0 left-0 w-0 h-0 border-t-[20px] border-l-[20px] border-t-blue-600 border-l-transparent z-10"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBarberoSelector = () => {
    return (
      <div className="space-y-4">
        {barberosFiltrados.length === 0 ? (
          <div className="bg-gray-800 p-4 rounded text-center">
            <p className="text-gray-400">No hay barberos disponibles para la sucursal seleccionada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barberosFiltrados.map((barbero) => (
              <div 
                key={barbero.id} 
                className={`
                  bg-gradient-to-br rounded-lg overflow-hidden cursor-pointer transition-all duration-300
                  ${selectedBarbero === barbero.id.toString() 
                    ? 'from-blue-900 to-blue-800 shadow-lg shadow-blue-500/20 border border-blue-500 transform scale-105' 
                    : 'from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 border border-gray-700 hover:border-gray-600'}
                `}
                onClick={() => setSelectedBarbero(barbero.id.toString())}
              >
                {/* Sección superior con foto/avatar */}
                <div className="h-32 bg-gray-700 relative">
                  {barbero.foto ? (
                    <img 
                      src={barbero.foto} 
                      alt={`${barbero.nombre} ${barbero.apellido}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                      <div className="w-16 h-16 rounded-full bg-gray-800 border-4 border-white/20 flex items-center justify-center text-white text-2xl font-bold">
                        {barbero.nombre[0]}{barbero.apellido[0]}
                      </div>
                    </div>
                  )}
                  {/* Gradiente oscuro superpuesto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                  
                  {/* Verificación si es seleccionado */}
                  {selectedBarbero === barbero.id.toString() && (
                    <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1 z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white">{barbero.nombre} {barbero.apellido}</h3>
                  
                  {/* Especialidad y calificación */}
                  <div className="flex flex-col mt-1 mb-2">
                    {barbero.especialidad && (
                      <span className="text-sm text-gray-400 mb-1">{barbero.especialidad}</span>
                    )}
                    {barbero.calificacion && renderEstrellas(barbero.calificacion)}
                  </div>
                  
                  {/* Experiencia */}
                  {barbero.experiencia && (
                    <div className="text-xs text-gray-400 mt-2">
                      <span className="text-blue-400">{barbero.experiencia}</span> años de experiencia
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDateTimeSelector = () => {
    // Agrupar por semanas para mejor visualización
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    diasDisponibles.forEach((day, index) => {
      if (index % 7 === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return (
      <div className="space-y-8">
        {/* Selector de días */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Selecciona una fecha</h3>
          
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const isSelected = selectedDate && isSameDay(selectedDate, day);
                const dayStr = format(day, 'd');
                const isToday = isSameDay(day, new Date());
                
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedTime(null); // Reset time selection when date changes
                    }}
                    className={`
                      py-2 rounded-md text-center transition-colors relative
                      ${isSelected 
                        ? 'bg-blue-600 text-white transform scale-110' 
                        : isToday
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                    `}
                  >
                    <div className="text-xs mb-1 text-gray-400">
                      {format(day, 'EEE', { locale: es })}
                    </div>
                    <div className={isSelected ? 'font-bold' : ''}>
                      {dayStr}
                    </div>
                    {isToday && (
                      <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Selector de horas con marcador de disponibilidad claro */}
        {selectedDate && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">
              Horarios disponibles para el {format(selectedDate, 'EEEE d MMMM', { locale: es })}
            </h3>
            
            {loading ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="inline-block animate-spin w-8 h-8 border-2 border-gray-600 border-t-blue-600 rounded-full mb-2"></div>
                <p className="text-gray-400">Cargando horarios disponibles...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400 mb-1">No hay horarios disponibles para esta fecha</p>
                <p className="text-gray-500 text-sm">Prueba seleccionando otra fecha</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {timeSlots.map((slot, index) => {
                  const isSelected = selectedTime && 
                    selectedTime.getTime() === slot.inicio.getTime();
                  const isDisponible = slot.disponible;
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => isDisponible ? setSelectedTime(slot.inicio) : null}
                      disabled={!isDisponible}
                      aria-disabled={!isDisponible}
                      className={`
                        py-3 text-center rounded-md transition-all relative
                        ${isSelected
                          ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/20 ring-2 ring-blue-400 transform scale-110'
                          : isDisponible
                            ? 'bg-gray-800 text-white hover:bg-gray-700'
                            : 'bg-gray-900/50 text-gray-500 cursor-not-allowed relative'}
                        ${isDisponible ? '' : 'overflow-hidden'}
                      `}
                    >
                      {/* Hora */}
                      {`${slot.inicio.getHours().toString().padStart(2, '0')}:${slot.inicio.getMinutes().toString().padStart(2, '0')}`}
                      
                      {/* Indicador visual de no disponible */}
                      {!isDisponible && (
                        <>
                          <div className="absolute inset-0 bg-red-900/10"></div>
                          <div className="absolute bottom-0 left-0 right-0 bg-red-500/60 text-white text-xs py-0.5">
                            No disponible
                          </div>
                          <div className="absolute inset-0 border border-red-500/30 rounded-md pointer-events-none"></div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Leyenda */}
            <div className="flex items-center space-x-4 mt-4 text-xs text-gray-400">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-800 mr-1.5 rounded"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 mr-1.5 rounded"></div>
                <span>Seleccionado</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-900/50 border border-red-500/30 mr-1.5 rounded"></div>
                <span>No disponible</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClientForm = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">Nombre</label>
            <input
              type="text"
              value={clienteData.nombre}
              onChange={(e) => setClienteData({ ...clienteData, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Tu nombre"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">Apellido</label>
            <input
              type="text"
              value={clienteData.apellido}
              onChange={(e) => setClienteData({ ...clienteData, apellido: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Tu apellido"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">Correo electrónico</label>
          <input
            type="email"
            value={clienteData.email}
            onChange={(e) => setClienteData({ ...clienteData, email: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            placeholder="email@ejemplo.com"
          />
          <p className="text-xs text-gray-400 mt-1">Te enviaremos una confirmación a este correo</p>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">Teléfono</label>
          <input
            type="tel"
            value={clienteData.telefono}
            onChange={(e) => setClienteData({ ...clienteData, telefono: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            placeholder="Tu número de teléfono"
          />
          <p className="text-xs text-gray-400 mt-1">Nos comunicaremos contigo si hay cambios en tu cita</p>
        </div>
      </div>
    );
  };

  const renderCompletedReservation = () => {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">¡Reserva confirmada!</h2>
        <p className="text-gray-300 mb-8">
          Hemos enviado los detalles de tu reserva a {clienteData.email}
        </p>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8 mx-auto max-w-md text-left">
          <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Detalles de tu reserva</h3>
          
          <div className="space-y-3">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <span className="text-gray-400">Fecha y hora:</span>
                <p className="text-white">
                  {selectedDate && selectedTime && format(selectedDate, 'EEEE d MMMM', { locale: es })} a las {selectedTime && format(selectedTime, 'HH:mm')}
                </p>
              </div>
            </div>
            
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <span className="text-gray-400">Barbero:</span>
                <p className="text-white">
                  {barberos.find(b => b.id.toString() === selectedBarbero)?.nombre} {barberos.find(b => b.id.toString() === selectedBarbero)?.apellido}
                </p>
              </div>
            </div>
            
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <span className="text-gray-400">Sucursal:</span>
                <p className="text-white">
                  {sucursales.find(s => s.id.toString() === selectedSucursal)?.nombre}
                </p>
                <p className="text-gray-400 text-sm">
                  {sucursales.find(s => s.id.toString() === selectedSucursal)?.direccion}
                </p>
              </div>
            </div>
            
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <div>
                <span className="text-gray-400">Servicios:</span>
                <ul className="text-white">
                  {selectedServicios.map(id => (
                    <li key={id}>
                      • {servicios.find(s => s.id.toString() === id)?.nombre}</li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Duración total:</span>
                  <span className="font-medium">{duracionTotal} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Precio total:</span>
                  <span className="font-medium text-green-400">${precioTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-x-4">
          <button
            onClick={resetForm}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Nueva Reserva
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  };

  if (loadingComponent) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-white text-lg">Cargando formulario de reserva...</p>
      </div>
    );
  }

  if (reservaCompletada) {
    return renderCompletedReservation();
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-lg p-4 lg:p-6">
      {/* Indicador de pasos */}
      {renderStepIndicator()}
      
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mostrar resumen si no estamos en el paso 1 */}
        {step > 1 && renderReservaSummary()}
        
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-200 rounded-md p-3 text-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        {/* Pasos */}
        <div className="min-h-[300px]">
          {step === 1 && renderSucursalSelector()}
          {step === 2 && renderServiciosSelector()}
          {step === 3 && renderBarberoSelector()}
          {step === 4 && renderDateTimeSelector()}
          {step === 5 && renderClientForm()}
        </div>
        
        {/* Botones de navegación */}
        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Anterior
            </button>
          ) : (
            <div></div> // Espacio vacío para mantener la flexbox alineada
          )}
          
          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center group"
            >
              Siguiente
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center font-medium group"
              disabled={loading}
            >
              {loading ? (
                <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  Confirmar Reserva
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}