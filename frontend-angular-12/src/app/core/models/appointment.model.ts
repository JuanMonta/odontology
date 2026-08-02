export type AppointmentStatus = 'on-time' | 'boarding' | 'delayed' | 'cancelled' | 'done';

export interface Appointment {
  id: string;
  time: string;            // "08:30"
  patient: string;         // Nombre y apellido
  treatment: string;       // Tratamiento programado
  consultorio: string;     // "CON 01"
  dentist: string;
  status: AppointmentStatus;
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
