export type ConsultorioStatus = 'operativo' | 'mantenimiento' | 'inactivo';

export interface Consultorio {
  id: string;                    // "CON-001"
  code: string;                  // "CON-001"
  name: string;                  // "CONSULTORIO 01"
  unit: string;                  // "SILLÓN A"
  currentDentist?: string | null; // odontólogo en turno hoy (por agenda) o null
  location: string;              // "PISO 1 · ALA ESTE"
  equipment: string[];           // equipos e instrumental
  status: ConsultorioStatus;
  lastUse: string;               // "05 AGO 2026"
  procedures: number;            // procedimientos realizados
}

export interface ConsultorioDraft {
  name: string;
  unit: string;
  location: string;
  equipment: string[];
  status: ConsultorioStatus;
}
