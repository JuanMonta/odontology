export type PatientStatus = 'active' | 'inactive';
export type ToothStatus = 'healthy' | 'caries' | 'treatment' | 'missing';
export type PatientAlertType = 'birthday' | 'debt' | 'followup';

export interface Patient {
  id: string;            // "HC-0001" historia clínica
  name: string;
  age: number;
  phone: string;
  email: string;
  address: string;
  allergies: string;
  status: PatientStatus;
  treatment: string;     // tratamiento principal / actual
  lastVisit: string;     // "28 JUL 2026"
  birthday: string;      // "12/08" para alertas
  debt: number;          // derivado de cuentas por cobrar
}

export interface PatientAppointment {
  id: string;
  date: string;          // "28 JUL 2026"
  time: string;          // "09:00"
  treatment: string;
  dentist: string;
  status: 'done' | 'cancelled' | 'scheduled' | 'no-show';
}

export interface AccountEntry {
  id: string;
  date: string;          // "15 JUL 2026"
  concept: string;
  amount: number;
  type: 'charge' | 'payment';
  method?: string;       // EFECTIVO / TARJETA
}

export interface Tooth {
  number: number;        // FDI, ej. 18
  status: ToothStatus;
}

export interface PatientAlert {
  id: string;
  type: PatientAlertType;
  patientId: string;
  label: string;
  handled: boolean;
}

export type PatientDraft = Omit<Patient, 'id' | 'debt'>;

export interface PatientDetail {
  appointments: PatientAppointment[];
  account: AccountEntry[];
  teeth: Tooth[];
}
