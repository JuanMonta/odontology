export type PatientStatus = 'active' | 'inactive';
export type ToothCondition =
  | 'caries'
  | 'obturado'
  | 'endodoncia'
  | 'endodoncia-realizada'
  | 'corona'
  | 'extraccion'
  | 'sellante-necesario'
  | 'sellante-realizado'
  | 'protesis-fija'
  | 'protesis-removible'
  | 'protesis-total'
  | 'perdida-por-caries'
  | 'perdida-otra-causa';
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
  dentistCode?: string | null; // código del profesional que atendió
  status: 'done' | 'cancelled' | 'scheduled' | 'no-show';
  note?: string;         // nota clínica de la sesión (expediente)
}

export interface AccountEntry {
  id: string;
  date: string;          // "15 JUL 2026"
  concept: string;
  amount: number;
  type: 'charge' | 'payment';
  method?: string;       // EFECTIVO / TARJETA
}

export type ToothFaceName = 'oclusal' | 'mesial' | 'distal' | 'vestibular' | 'lingual';
export type ToothFaceCondition = 'caries' | 'obturado';

export interface ToothFace {
  face: ToothFaceName;
  condition: ToothFaceCondition;
}

export interface Tooth {
  number: number;        // FDI, ej. 18
  conditions: ToothCondition[];      // condiciones de diente completo
  faces?: ToothFace[];              // caries / obturado por cara (5 zonas)
  movilidad?: string;               // 'X' | '1' | '2' | '3' (solo permanentes)
  recesion?: string;                // 'X' | '1' | '2' | '3' (solo permanentes)
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
