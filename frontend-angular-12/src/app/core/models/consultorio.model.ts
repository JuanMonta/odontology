export type ConsultorioStatus = 'operativo' | 'mantenimiento' | 'inactivo';

export type StaffShiftState = 'turno' | 'descanso' | 'fuera';

export interface ConsultorioStaff {
  code: string;       // "ODO-001"
  name: string;       // "DR. RIVERA"
  specialty: string;  // "CIRUGÍA ORAL"
  turno: string;      // "completo"
  jornada: string;    // "08:00–18:00"
  state: StaffShiftState; // derivado del turno + reloj
}

export interface Consultorio {
  id: string;                    // "CON-001"
  code: string;                  // "CON-001"
  name: string;                  // "CONSULTORIO 01"
  unit: string;                  // "SILLÓN A"
  staff: ConsultorioStaff[];     // odontólogos asignados (consultorio_codigo) con turno en vivo
  location: string;              // "PISO 1 · ALA ESTE"
  equipment: string[];           // equipos e instrumental
  tratamientos: string[];        // códigos de tratamientos que soporta
  status: ConsultorioStatus;
  lastUse: string;               // "05 AGO 2026"
  procedures: number;            // procedimientos realizados
}

export interface ConsultorioDraft {
  name: string;
  unit: string;
  location: string;
  equipment: string[];
  tratamientos: string[];
  status: ConsultorioStatus;
}

export interface ConsultorioSaveEvent {
  draft: ConsultorioDraft;
  /** Códigos de odontólogos asignados a esta sala (odontologos.consultorio_codigo). */
  assigned: string[];
}
