import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, Subject } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import {
  ClinicMessage,
  MessageChannel,
  MessageDestino,
  MessageDraft,
  MessagePriority
} from '../../../core/models/message.model';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

export const MESSAGE_CHANNELS: { id: MessageChannel; label: string }[] = [
  { id: 'consulta', label: 'CONSULTA' },
  { id: 'paciente', label: 'PACIENTE' },
  { id: 'equipo', label: 'EQUIPO' }
];

export const MESSAGE_DESTINOS: { id: MessageDestino; label: string }[] = [
  { id: 'todos', label: 'TODOS' },
  { id: 'equipo', label: 'EQUIPO' },
  { id: 'recepcion', label: 'RECEPCIÓN' },
  { id: 'odontologos', label: 'ODONTÓLOGOS' }
];

export const MESSAGE_PRIORITIES: { id: MessagePriority; label: string }[] = [
  { id: 'urgente', label: 'URGENTE' },
  { id: 'importante', label: 'IMPORTANTE' },
  { id: 'informacion', label: 'INFORMACIÓN' }
];

const POLL_INTERVAL_MS = 8000;

/**
 * Consume el backend REST de mensajes (spring_backend → /api/v1/messages).
 * Los mensajes son internos del consultorio: cada fila define su público
 * objetivo (destino) y su nivel de importancia (prioridad). Un polling cada
 * 8s refresca la bandeja y emite los mensajes nuevos por `arrivals$` para que
 * el shell muestre la notificación en la app (sin depender de APIs externas).
 */
@Injectable({ providedIn: 'root' })
export class MessagesHttpService {
  private readonly subjects = new BehaviorSubject<ClinicMessage[]>([]);
  private readonly arrivals = new Subject<ClinicMessage>();

  readonly messages$: Observable<ClinicMessage[]> = this.subjects.asObservable();

  readonly arrivals$: Observable<ClinicMessage> = this.arrivals.asObservable();

  readonly unreadCount$: Observable<number> = this.messages$.pipe(
    map(list => list.filter(m => m.status === 'unread').length)
  );

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    status.reconnected$.subscribe(() => this.refresh());
    status.onlineTick$
      .pipe(filter(() => this.subjects.getValue().length === 0))
      .subscribe(() => this.refresh());

    interval(POLL_INTERVAL_MS)
      .pipe(switchMap(() => this.http.get<ClinicMessage[]>(`${API_BASE}/messages`)))
      .subscribe(list => {
        const prevIds = new Set(this.subjects.getValue().map(m => m.id));
        const freshUnread = list.filter(m => !prevIds.has(m.id) && m.status === 'unread');
        this.subjects.next(list);
        freshUnread.forEach(m => this.arrivals.next(m));
      });
  }

  refresh(): void {
    this.http.get<ClinicMessage[]>(`${API_BASE}/messages`).subscribe(list => this.subjects.next(list));
  }

  sendMessage(draft: MessageDraft): Observable<ClinicMessage> {
    return this.http.post<ClinicMessage>(`${API_BASE}/messages`, draft).pipe(
      tap(created => this.subjects.next([created, ...this.subjects.getValue()]))
    );
  }

  markRead(id: string): void {
    this.http.patch<ClinicMessage>(`${API_BASE}/messages/${id}/read`, null).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(m => (m.id === updated.id ? updated : m)));
    });
  }

  markUnread(id: string): void {
    this.http.patch<ClinicMessage>(`${API_BASE}/messages/${id}/unread`, null).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(m => (m.id === updated.id ? updated : m)));
    });
  }
}
