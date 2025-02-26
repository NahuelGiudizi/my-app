// src/components/AppointmentForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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
  sucursales: { sucursalId: number }[];
}

interface Servicio {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
}

interface TimeSlot {
  inicio: Date;
  fin: Date;
  disponible: boolean;
}

export default function AppointmentForm() {
  // Estados básicos
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados de datos
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberosFiltrados, setBarberosFiltrados] = useState<Barbero[]>([]);

  // Estados de selección
  const [selectedSucursal, setSelectedSucursal] = useState<string>("");
  const [selectedBarbero, setSelectedBarbero] = useState<string>("");
  const [selectedServicios, setSelectedServicios] = useState<string[]>([]);
  const [duracionTotal, setDuracionTotal] = useState<number>(0);
  const [precioTotal, setPrecioTotal] = useState<number>(0);

  // Estado de datos del cliente
  const [clienteData, setClienteData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
  });

  // Cargar datos iniciales: sucursales, barberos y servicios
  useEffect(() => {
    const fetchData = async () => {
      try {
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
        setServicios(serviciosData);
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      }
    };

    fetchData();
  }, []);

  // Filtrar barberos por sucursal seleccionada
  useEffect(() => {
    if (selectedSucursal) {
      const sucursalId = parseInt(selectedSucursal);
      console.log("Filtrando barberos para sucursal:", sucursalId);
      console.log("Barberos disponibles:", barberos);

      // Filtrado más seguro
      const filtrados = barberos.filter((barbero) => {
        // Verificar que el barbero tenga la propiedad sucursales
        if (!barbero.sucursales) {
          console.log(`Barbero ${barbero.id} no tiene la propiedad sucursales`);
          return false;
        }

        // Verificar que sea un array
        if (!Array.isArray(barbero.sucursales)) {
          console.log(
            `Barbero ${barbero.id} tiene sucursales pero no es un array`
          );
          return false;
        }

        // Buscar si el barbero está en la sucursal seleccionada
        const enSucursal = barbero.sucursales.some((s) => {
          const coincide = s.sucursalId === sucursalId;
          if (coincide)
            console.log(
              `Barbero ${barbero.id} encontrado en sucursal ${sucursalId}`
            );
          return coincide;
        });

        return enSucursal;
      });

      console.log("Barberos filtrados:", filtrados);
      setBarberosFiltrados(filtrados);

      // Verificar y resetear barbero si es necesario
      if (
        selectedBarbero &&
        !filtrados.some((b) => b.id.toString() === selectedBarbero)
      ) {
        console.log("Reseteando selección de barbero");
        setSelectedBarbero("");
      }
    } else {
      setBarberosFiltrados([]);
      setSelectedBarbero("");
    }
  }, [selectedSucursal, barberos, selectedBarbero]);

  // Calcular duración y precio total al seleccionar servicios
  // Calcular duración y precio total al seleccionar servicios
  useEffect(() => {
    if (selectedServicios.length > 0) {
      let duracion = 0;
      let precio = 0;

      selectedServicios.forEach((servicioId) => {
        const servicio = servicios.find((s) => s.id.toString() === servicioId);
        if (servicio) {
          duracion += Number(servicio.duracion);
          precio += Number(servicio.precio); // Asegurarnos que sea un número
        }
      });

      setDuracionTotal(duracion);
      setPrecioTotal(precio);
    } else {
      setDuracionTotal(0);
      setPrecioTotal(0);
    }
  }, [selectedServicios, servicios]);

  // Obtener horarios disponibles cuando se han seleccionado fecha, sucursal, servicios
  useEffect(() => {
    if (selectedDate && selectedSucursal && selectedServicios.length > 0) {
      const fetchTimeSlots = async () => {
        try {
          const sucursalId = parseInt(selectedSucursal);
          const serviciosIds = selectedServicios.map((id) => parseInt(id));

          const response = await fetch(
            `/api/disponibilidad?fecha=${selectedDate.toISOString()}&sucursalId=${sucursalId}&servicios=${serviciosIds.join(
              ","
            )}&duracion=${duracionTotal}`
          );

          if (!response.ok) {
            // En lugar de lanzar error inmediatamente, intenta obtener el mensaje de error del servidor
            try {
              const errorData = await response.json();
              console.error("Respuesta del servidor:", errorData);
              throw new Error(
                errorData.error || "Error al obtener horarios disponibles"
              );
            } catch (jsonError) {
              // Si no se puede parsear la respuesta, muestra el error HTTP
              throw new Error(
                `Error HTTP: ${response.status} - ${response.statusText}`
              );
            }
          }

          const data = await response.json();
          setTimeSlots(
            data.map((slot: any) => ({
              ...slot,
              inicio: new Date(slot.inicio),
              fin: new Date(slot.fin),
            }))
          );
        } catch (error) {
          console.error("Error obteniendo horarios:", error);
          setTimeSlots([]);
        }
      };

      fetchTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, selectedSucursal, selectedServicios, duracionTotal]);

  const handleServicioToggle = (servicioId: string) => {
    setSelectedServicios((prevSelected) => {
      if (prevSelected.includes(servicioId)) {
        return prevSelected.filter((id) => id !== servicioId);
      } else {
        return [...prevSelected, servicioId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Validando formulario:");
    console.log("- selectedDate:", selectedDate);
    console.log("- selectedTime:", selectedTime);
    console.log("- selectedBarbero:", selectedBarbero);
    console.log("- servicios:", selectedServicios);
    console.log("- sucursal:", selectedSucursal);
    console.log("- datos cliente:", clienteData);

    if (
      !selectedDate ||
      !selectedTime ||
      !selectedBarbero ||
      selectedServicios.length === 0 ||
      !selectedSucursal
    ) {
      alert("Por favor complete todos los campos");
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para enviar
      const dataToSend = {
        fecha: selectedTime.toISOString(), // Usamos la hora de inicio seleccionada
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

      alert("Turno reservado exitosamente");
      // Limpiar formulario
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
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-2">
        Reservar Turno
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Paso 1: Selección de Sucursal */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Seleccione una sucursal
          </label>
          <select
            value={selectedSucursal}
            onChange={(e) => setSelectedSucursal(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccione...</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre} - {sucursal.direccion}
              </option>
            ))}
          </select>
        </div>

        {/* Paso 2: Selección de Fecha */}
        {selectedSucursal && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Seleccione la fecha
            </label>
            <input
              type="date"
              value={
                selectedDate ? selectedDate.toISOString().split("T")[0] : ""
              }
              onChange={(e) =>
                setSelectedDate(
                  e.target.value ? new Date(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
        )}

        {/* Paso 3: Selección múltiple de Servicios */}
        {selectedDate && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Seleccione los servicios
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-700 rounded-md p-3 border border-gray-600">
              {servicios.map((servicio) => (
                <div key={servicio.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`servicio-${servicio.id}`}
                    checked={selectedServicios.includes(servicio.id.toString())}
                    onCheckedChange={() =>
                      handleServicioToggle(servicio.id.toString())
                    }
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor={`servicio-${servicio.id}`}
                    className="text-sm text-gray-200 flex-1"
                  >
                    {servicio.nombre} - ${servicio.precio} ({servicio.duracion}{" "}
                    min)
                  </label>
                </div>
              ))}
            </div>

            {selectedServicios.length > 0 && (
              <div className="mt-2 bg-gray-700 p-2 rounded border border-gray-600">
                <p className="text-sm text-gray-200">
                  Duración total:{" "}
                  <span className="font-semibold">{duracionTotal} minutos</span>
                </p>
                <p className="text-sm text-gray-200">
                  Precio total:{" "}
                  <span className="font-semibold">
                    ${precioTotal.toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Paso 4: Selección de Barbero */}
        {selectedServicios.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Seleccione un barbero
            </label>
            <select
              value={selectedBarbero}
              onChange={(e) => setSelectedBarbero(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccione...</option>
              {barberosFiltrados.map((barbero) => (
                <option key={barbero.id} value={barbero.id}>
                  {barbero.nombre} {barbero.apellido}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Paso 5: Selección de Horario */}
        {selectedBarbero && timeSlots.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Seleccione un horario disponible
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto py-2">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={!slot.disponible}
                  onClick={() => {
                    console.log("Seleccionando hora:", slot.inicio);
                    setSelectedTime(slot.inicio);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${
                      selectedTime &&
                      selectedTime.getTime() === slot.inicio.getTime()
                        ? "bg-blue-600 text-white"
                        : slot.disponible
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {slot.inicio.getHours().toString().padStart(2, "0")}:
                  {slot.inicio.getMinutes().toString().padStart(2, "0")} -
                  {slot.fin.getHours().toString().padStart(2, "0")}:
                  {slot.fin.getMinutes().toString().padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 6: Datos del Cliente */}
        {selectedTime && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-200 border-b border-gray-700 pb-2">
              Datos del Cliente
            </h3>

            <Input
              placeholder="Nombre"
              value={clienteData.nombre}
              onChange={(e) =>
                setClienteData({ ...clienteData, nombre: e.target.value })
              }
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
              required
            />

            <Input
              placeholder="Apellido"
              value={clienteData.apellido}
              onChange={(e) =>
                setClienteData({ ...clienteData, apellido: e.target.value })
              }
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
              required
            />

            <Input
              type="email"
              placeholder="Email"
              value={clienteData.email}
              onChange={(e) =>
                setClienteData({ ...clienteData, email: e.target.value })
              }
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
              required
            />

            <Input
              placeholder="Teléfono"
              value={clienteData.telefono}
              onChange={(e) =>
                setClienteData({ ...clienteData, telefono: e.target.value })
              }
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {/* Botón de envío */}
        {selectedTime && (
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Reservar Turno"}
          </Button>
        )}
      </form>
    </div>
  );
}
