export type ChatConversacionTipo = 'dm' | 'canal';

export interface ChatParticipante {
  codigo: string;
  nombre: string;
  rol: string;
  esAdmin: boolean;
}

export interface ChatConversacion {
  id: number;
  tipo: ChatConversacionTipo;
  nombre: string | null;
  ultimoMensaje: string;
  ultimoMensajeHora: string;
  noLeidos: number;
  esAdmin: boolean;
  participantes: ChatParticipante[];
}

export interface ChatMensaje {
  id: number;
  conversacionId: number;
  remitente: string;
  remitenteNombre: string;
  cuerpo: string;
  fechaHora: string;
}

export interface ChatCanalDraft {
  nombre: string;
  miembros: string[];
}

export interface ChatPresencia {
  codigo: string;
  nombre: string;
  rol: string;
  online: boolean;
}
