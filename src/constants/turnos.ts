// src/constants/turnos.ts
export const ESTADOS_TURNO = {
    PENDIENTE: 'PENDIENTE',
    CONFIRMADO: 'CONFIRMADO',
    CANCELADO: 'CANCELADO',
    COMPLETADO: 'COMPLETADO'
  } as const;
  
  export type EstadoTurno = typeof ESTADOS_TURNO[keyof typeof ESTADOS_TURNO];