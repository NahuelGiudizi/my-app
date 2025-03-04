// src/lib/dateUtils.ts
// Versión mejorada para garantizar una detección de conflictos más robusta

import { format, parseISO, addMinutes, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene slots de tiempo disponibles para una fecha determinada
 */
export function getAvailableTimeSlots(date: Date, duration: number) {
  const timeSlots = [];
  const startHour = 9; // Hora de inicio (9 AM)
  const endHour = 18; // Hora de fin (6 PM)
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = new Date(date);
      time.setUTCHours(hour, minute, 0, 0);
      
      // No agregar slots para tiempo pasado
      if (isAfter(time, new Date())) {
        timeSlots.push(time);
      }
    }
  }
  
  return timeSlots;
}

/**
 * Formatea una fecha ISO manteniendo su valor UTC (sin conversión a local)
 */
export function formatUTCDate(dateString: string, formatString: string = 'dd/MM/yyyy, HH:mm'): string {
  // Parsear la fecha ISO a un objeto Date
  const date = parseISO(dateString);
  
  // Obtener componentes UTC
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  
  // Crear una nueva fecha que preserve los componentes UTC
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  
  // Formatear utilizando date-fns
  return format(utcDate, formatString, { locale: es });
}

/**
 * Ajusta un horario local a UTC para guardarlo consistentemente
 */
export function toUTCDateTime(date: Date, timeString: string): Date {
  // Extraer horas y minutos del string de tiempo (formato: "HH:MM")
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Crear una nueva fecha con el día seleccionado pero con el horario UTC
  const result = new Date(date);
  result.setUTCHours(hours, minutes, 0, 0);
  
  return result;
}

/**
 * Combina una fecha y una hora para crear un objeto Date en UTC
 */
export function combineDateAndTimeToUTC(date: Date, hours: number, minutes: number): Date {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  ));
}

/**
 * Comprueba si dos rangos de tiempo se solapan
 * 
 * @param start1 Inicio del primer rango de tiempo
 * @param end1 Fin del primer rango de tiempo
 * @param start2 Inicio del segundo rango de tiempo
 * @param end2 Fin del segundo rango de tiempo
 * @returns true si hay solapamiento, false en caso contrario
 */
export function checkTimeRangeOverlap(
  start1: Date, 
  end1: Date, 
  start2: Date, 
  end2: Date
): boolean {
  // Convertir todos los tiempos a milisegundos para comparaciones precisas
  const start1Time = start1.getTime();
  const end1Time = end1.getTime();
  const start2Time = start2.getTime();
  const end2Time = end2.getTime();

  // Hay solapamiento si:
  // - El inicio del rango 1 está dentro del rango 2
  // - El fin del rango 1 está dentro del rango 2
  // - El rango 1 engloba completamente al rango 2
  
  const inicio1DentroDeRango2 = start1Time >= start2Time && start1Time < end2Time;
  const fin1DentroDeRango2 = end1Time > start2Time && end1Time <= end2Time;
  const rango1ContieneRango2 = start1Time <= start2Time && end1Time >= end2Time;
  
  // También registramos el tiempo para depuración
  const haySupeposicion = inicio1DentroDeRango2 || fin1DentroDeRango2 || rango1ContieneRango2;
  
  if (haySupeposicion) {
    console.log(`Superposición de tiempo detectada:
      - Rango 1: ${start1.toISOString()} - ${end1.toISOString()}
      - Rango 2: ${start2.toISOString()} - ${end2.toISOString()}
      - Inicio1 dentro de Rango2: ${inicio1DentroDeRango2}
      - Fin1 dentro de Rango2: ${fin1DentroDeRango2}
      - Rango1 contiene Rango2: ${rango1ContieneRango2}
    `);
  }
  
  return haySupeposicion;
}

/**
 * Obtiene el inicio y fin del día en UTC para una fecha dada
 */
export function getUTCDayBounds(date: Date): { start: Date, end: Date } {
  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0
  ));
  
  const end = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23, 59, 59, 999
  ));
  
  return { start, end };
}