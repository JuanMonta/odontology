export type UsuarioRol = 'administrador' | 'recepción' | 'odontólogo';
export type UsuarioStatus = 'activo' | 'suspendido' | 'inactivo';

export interface Usuario {
  id: string;           // "usr-1"
  code: string;         // "USR-001"
  username: string;     // "mrivera"
  name: string;         // "MIGUEL RIVERA"
  role: UsuarioRol;     // "administrador" | "recepción" | "odontólogo"
  status: UsuarioStatus;
  lastAccess: string;   // "06 AGO 2026 · 14:32"
  phone: string;        // "+51 987 654 321"
}

export interface UsuarioDraft {
  username: string;
  name: string;
  role: UsuarioRol;
  status: UsuarioStatus;
}
