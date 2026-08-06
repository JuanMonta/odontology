export type OdontologoStatus = 'activo' | 'ausente' | 'inactivo';
export type Turno = 'MAÑANA' | 'TARDE' | 'COMPLETO';

export interface Odontologo {
  id: string;           // "odo-1"
  code: string;         // "ODO-001"
  name: string;         // "DR. RIVERA"
  specialty: string;    // "CIRUGÍA ORAL"
  license: string;      // "COP 12453"
  consultorio: string;  // "CON-001"
  turno: Turno;         // "MAÑANA" | "TARDE" | "COMPLETO"
  status: OdontologoStatus;
  experience: number;   // años de ejercicio
  procedures: number;   // procedimientos del mes
}

export interface OdontologoDraft {
  name: string;
  specialty: string;
  license: string;
  consultorio: string;
  turno: Turno;
  status: OdontologoStatus;
}
