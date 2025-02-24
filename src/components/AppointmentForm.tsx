// src/components/AppointmentForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Barbero {
  id: number;
  nombre: string;
  apellido: string;
}

interface Servicio {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
}

export default function AppointmentForm() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<Date[]>([]);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [selectedBarbero, setSelectedBarbero] = useState<string>("");
  const [selectedServicio, setSelectedServicio] = useState<string>("");
  const [clienteData, setClienteData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar barberos y servicios al montar el componente
    const fetchData = async () => {
      try {
        const [barberosRes, serviciosRes] = await Promise.all([
          fetch("/api/barberos"),
          fetch("/api/servicios"),
        ]);

        const barberosData = await barberosRes.json();
        const serviciosData = await serviciosRes.json();

        setBarberos(barberosData);
        setServicios(serviciosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    fetchData();
  }, []);

  // Generar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate) {
      // Generar horarios cada 30 minutos entre 9:00 y 18:00
      const slots = [];
      const date = new Date(selectedDate);
      
      for (let hour = 9; hour < 18; hour++) {
        for (let minute of [0, 30]) {
          const time = new Date(date);
          time.setHours(hour, minute, 0, 0);
          
          // Solo incluir horarios futuros si es hoy
          const now = new Date();
          if (date.toDateString() !== now.toDateString() || 
              (time.getHours() > now.getHours() || 
               (time.getHours() === now.getHours() && time.getMinutes() > now.getMinutes()))) {
            slots.push(time);
          }
        }
      }
      
      setTimeSlots(slots);
    }
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedBarbero || !selectedServicio) {
      alert("Por favor complete todos los campos");
      return;
    }

    setLoading(true);
    try {
      // Combinar fecha y hora seleccionadas
      const fechaTurno = new Date(selectedDate);
      fechaTurno.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0
      );

      const dataToSend = {
        fecha: fechaTurno.toISOString(),
        barberoId: parseInt(selectedBarbero),
        servicioId: parseInt(selectedServicio),
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
      setSelectedServicio("");
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
        {/* Selección de Barbero */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Seleccione un barbero
          </label>
          <select
            value={selectedBarbero}
            onChange={(e) => setSelectedBarbero(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccione...</option>
            {barberos.map((barbero) => (
              <option key={barbero.id} value={barbero.id}>
                {barbero.nombre} {barbero.apellido}
              </option>
            ))}
          </select>
        </div>

        {/* Selección de Servicio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Seleccione un servicio
          </label>
          <select
            value={selectedServicio}
            onChange={(e) => setSelectedServicio(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccione...</option>
            {servicios.map((servicio) => (
              <option key={servicio.id} value={servicio.id}>
                {servicio.nombre} - ${servicio.precio} ({servicio.duracion} min)
              </option>
            ))}
          </select>
        </div>

        {/* Fecha y Hora */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Fecha
          </label>
          <input
            type="date"
            value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={new Date().toISOString().split('T')[0]}
          />

          {/* Selección de horarios */}
          {selectedDate && timeSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mt-4 mb-2">
                Hora
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${selectedTime && selectedTime.getTime() === time.getTime()
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      }`}
                  >
                    {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Datos del Cliente */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">Datos del Cliente</h3>
          
          <Input
            placeholder="Nombre"
            value={clienteData.nombre}
            onChange={(e) => setClienteData({...clienteData, nombre: e.target.value})}
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
            required
          />
          
          <Input
            placeholder="Apellido"
            value={clienteData.apellido}
            onChange={(e) => setClienteData({...clienteData, apellido: e.target.value})}
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
            required
          />
          
          <Input
            type="email"
            placeholder="Email"
            value={clienteData.email}
            onChange={(e) => setClienteData({...clienteData, email: e.target.value})}
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
            required
          />
          
          <Input
            placeholder="Teléfono"
            value={clienteData.telefono}
            onChange={(e) => setClienteData({...clienteData, telefono: e.target.value})}
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
          disabled={loading}
        >
          {loading ? "Procesando..." : "Reservar Turno"}
        </Button>
      </form>
    </div>
  );
}