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
  adjunto: ChatAdjunto | null;
}

export type ChatAdjuntoCategoria = 'imagen' | 'documento' | 'solicitud' | 'audio';

export interface ChatAdjunto {
  id: number;
  conversacionId: number;
  subidoPor: string;
  nombre: string;
  categoria: ChatAdjuntoCategoria;
  tipo: string;
  tamano: number;
  fechaHora: string;
  url: string;
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
