export type AppointmentStatus =
  | 'on-time'    // programada
  | 'arrived'    // llegó a tiempo (check-in)
  | 'delayed'    // llegó tarde
  | 'boarding'   // en consultorio
  | 'no-show'    // no asistió
  | 'cancelled'  // cancelada
  | 'done';      // atendida

export interface Appointment {
  id: string;
  time: string;            // "08:30"
  patient: string;         // Nombre y apellido
  treatment: string;       // Tratamiento programado
  consultorio: string;     // "CON 01"
  dentist: string;
  status: AppointmentStatus;
  horaFin?: string | null; // fin del bloque, "09:00" (opcional)
}

export interface WaitingPatient {
  id: string;
  ticket: string;          // "A-014"
  patient: string;
  arrivedAt: string;       // "08:05"
  reason: string;
}

export interface BoardTotals {
  total: number;
  waiting: number;
  delayed: number;
  done: number;
}
