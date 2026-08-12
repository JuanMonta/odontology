export type MessageChannel = 'consulta' | 'paciente' | 'equipo';
export type MessageStatus = 'unread' | 'read';
export type MessageDestino = 'todos' | 'equipo' | 'recepcion' | 'odontologos';
export type MessagePriority = 'urgente' | 'importante' | 'informacion';

export interface ClinicMessage {
  id: string;              // "MSG-001"
  subject: string;
  body: string;
  from: string;            // remitente visible
  channel: MessageChannel;
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
  channel: MessageChannel;
  prioridad: MessagePriority;
}
