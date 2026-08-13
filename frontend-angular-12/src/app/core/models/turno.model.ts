export interface Turno {
  id: string;            // "tur-1"
  code: string;          // "TUR-001"
  nombre: string;        // "mañana"
  horaInicio: string;    // "08:00"
  horaFin: string;       // "15:00"
  descansoInicio: string | null; // "12:00" | null
  descansoFin: string | null;    // "13:00" | null
  activo: boolean;
}

export interface TurnoDraft {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  descansoInicio: string | null;
  descansoFin: string | null;
}
