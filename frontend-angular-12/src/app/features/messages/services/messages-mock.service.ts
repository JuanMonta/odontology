import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClinicMessage, MessageChannel, MessageDraft } from '../../../core/models/message.model';

export const MESSAGE_CHANNELS: { id: MessageChannel; label: string }[] = [
  { id: 'consulta', label: 'CONSULTA' },
  { id: 'paciente', label: 'PACIENTE' },
  { id: 'equipo', label: 'EQUIPO' }
];

@Injectable({ providedIn: 'root' })
export class MessagesMockService {
  private readonly subjects = new BehaviorSubject<ClinicMessage[]>(this.build());

  readonly messages$: Observable<ClinicMessage[]> = this.subjects.asObservable();

  readonly unreadCount$: Observable<number> = this.messages$.pipe(
    map(list => list.filter(m => m.status === 'unread').length)
  );

  sendMessage(draft: MessageDraft): ClinicMessage {
    const list = this.subjects.getValue();
    const item: ClinicMessage = {
      id: `MSG-${Date.now()}`,
      subject: draft.subject,
      body: draft.body,
      from: draft.to,
      channel: draft.channel,
      date: this.today(),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      status: 'unread',
      urgent: false
    };
    this.subjects.next([item, ...list]);
    return item;
  }

  markRead(id: string): void {
    const list = this.subjects.getValue();
    this.subjects.next(list.map(m => (m.id === id ? { ...m, status: 'read' as const } : m)));
  }

  markUnread(id: string): void {
    const list = this.subjects.getValue();
    this.subjects.next(list.map(m => (m.id === id ? { ...m, status: 'unread' as const } : m)));
  }

  private today(): string {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  private build(): ClinicMessage[] {
    return [
      {
        id: 'MSG-001',
        subject: 'REPROGRAMACIÓN DE CITA — ROMPEZO EN 14',
        body: 'Estimado Dr. Rivera, el paciente JOSÉ HUAMÁN solicitó reprogramar su cita del 08 AGO (09:00) para el 12 AGO. El nuevo horario queda reservado y pendiente de confirmación. Por favor confirme en su agenda.',
        from: 'RECEPCIÓN',
        channel: 'consulta',
        date: '06 AGO 2026',
        time: '09:12',
        status: 'unread',
        urgent: true
      },
      {
        id: 'MSG-002',
        subject: 'CONSULTA — ALERGIA A SULFAS (HC-0007)',
        body: 'Dra. Cáceres indica alergia a SULFAS registrada en su ficha. Antes de la rehabilitación del 10 AGO verifico el protocolo de antibiótico profiláctico. ¿Autoriza usar clindamicina como alternativa?',
        from: 'DRA. TORRES',
        channel: 'equipo',
        date: '05 AGO 2026',
        time: '17:40',
        status: 'unread',
        urgent: false
      },
      {
        id: 'MSG-003',
        subject: 'PAGO CONFIRMADO — HC-0002 ENDODONCIA',
        body: 'Se registró el abono de $ 600 en la cuenta de JOSÉ HUAMÁN (HC-0002). Método: EFECTIVO. Saldo actualizado a $ 0. Queda la cuenta al día.',
        from: 'FACTURACIÓN',
        channel: 'consulta',
        date: '04 AGO 2026',
        time: '11:05',
        status: 'read',
        urgent: false
      },
      {
        id: 'MSG-004',
        subject: 'URGENCIA — DOLOR EN MOLAR 46 (HC-0004)',
        body: 'El paciente CARLOS MENDOZA reporta dolor agudo en el sector posterior derecho. Pide cita lo antes posible. Propongo acomodarlo mañana 07 AGO a primera hora si hay disponibilidad.',
        from: 'RECEPCIÓN',
        channel: 'consulta',
        date: '03 AGO 2026',
        time: '19:22',
        status: 'read',
        urgent: true
      },
      {
        id: 'MSG-005',
        subject: 'EVALUACIÓN DE IMPLANTE — HC-0006',
        body: 'Confirmo la evaluación de PEDRO SÁNCHEZ para implante. El cone beam queda agendado el 14 AGO. Adjunto la referencia del estudio para su revisión antes de la cirugía.',
        from: 'DR. VEGA',
        channel: 'equipo',
        date: '01 AGO 2026',
        time: '10:00',
        status: 'read',
        urgent: false
      },
      {
        id: 'MSG-006',
        subject: 'RESULTADOS DE LABORATORIO — CARILLA HC-0009',
        body: 'Las carillas de ELENA VARGAS llegaron del laboratorio. La prueba de asentamiento puede agendarse desde el 08 AGO. Coordinamos hora de acuerdo a su agenda.',
        from: 'LABORATORIO',
        channel: 'equipo',
        date: '31 JUL 2026',
        time: '15:30',
        status: 'read',
        urgent: false
      }
    ];
  }
}
