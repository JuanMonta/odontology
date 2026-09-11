export type UsuarioRol = string;
export type UsuarioStatus = string;

export interface CatalogoItem {
  codigo: string;
  nombre: string;
}

export interface RolItem {
  id: string;           // "ROL-001"
  code: string;         // "ROL-001"
  nombre: string;       // "administrador"
  activo: boolean;
  sistema?: boolean;    // true = protegido (super-admin)
}

export interface Permiso {
  codigo: string;       // "HC_EDITAR"
  categoria: string;    // "HC033"
  accion: string;       // "EDITAR"
  descripcion: string;
}

export interface RolPermisos {
  rolCode: string;
  permisos: string[];
}

export interface Usuario {
  id: string;           // "usr-1"
  code: string;         // "USR-001"
  username: string;     // "mrivera"
  name: string;         // "MIGUEL RIVERA"
  role: UsuarioRol;     // catálogo usuario_roles
  status: UsuarioStatus;
  lastAccess: string;   // "06 AGO 2026 · 14:32"
  phone: string;        // "+51 987 654 321"
  odontologoCodigo?: string | null; // ficha profesional vinculada (ODO-001)
}

export interface UsuarioDraft {
  username: string;
  name: string;
  role: UsuarioRol;
  status: UsuarioStatus;
  odontologoCodigo?: string | null;
}
