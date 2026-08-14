export type MessageStatus = 'unread' | 'read';
/** Destino = 'todos' o un rol del catálogo usuario_roles (texto libre). */
export type MessageDestino = string;
export type MessagePriority = 'urgente' | 'importante' | 'informacion';

export interface ClinicMessage {
  id: string;              // "MSG-001"
  subject: string;
  body: string;
  from: string;            // remitente visible
  date: string;            // "05 AGO 2026"
  time: string;            // "09:15"
  status: MessageStatus;
  destino: MessageDestino;
  prioridad: MessagePriority;
}

export interface MessageDraft {
  subject: string;
  body: string;
  remitente: string;
  destino: MessageDestino;
  prioridad: MessagePriority;
}
