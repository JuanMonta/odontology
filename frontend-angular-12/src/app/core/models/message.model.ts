export type MessageChannel = 'consulta' | 'paciente' | 'equipo';
export type MessageStatus = 'unread' | 'read';

export interface ClinicMessage {
  id: string;            // "MSG-001"
  subject: string;
  body: string;
  from: string;          // remitente visible
  channel: MessageChannel;
  date: string;          // "05 AGO 2026"
  time: string;          // "09:15"
  status: MessageStatus;
  urgent: boolean;
}

export interface MessageDraft {
  subject: string;
  body: string;
  to: string;
  channel: MessageChannel;
}
