import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import {
  ClinicMessage,
  MessageDraft,
  MessagePriority
} from '../../../core/models/message.model';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';
import { ChatSocketService } from '../../chat/services/chat-socket.service';

export const MESSAGE_PRIORITIES: { id: MessagePriority; label: string }[] = [
  { id: 'urgente', label: 'URGENTE' },
  { id: 'importante', label: 'IMPORTANTE' },
  { id: 'informacion', label: 'INFORMACIÓN' }
];

/**
 * Consume el backend REST de mensajes (spring_backend → /api/v1/messages).
 * Los mensajes son internos del consultorio: cada fila define su público
 * objetivo (destino) y su nivel de importancia (prioridad). El backend difunde
 * cada mutación por STOMP ({@code /topic/messages}); aquí se aplican al
 * instante para el badge y las notificaciones, sin polling.
 */
@Injectable({ providedIn: 'root' })
export class MessagesHttpService implements OnDestroy {
  private readonly subjects = new BehaviorSubject<ClinicMessage[]>([]);
  private readonly arrivals = new Subject<ClinicMessage>();
  private readonly socketSub: { unsubscribe: () => void } | undefined;
  private readonly reconnectSub: { unsubscribe: () => void } | undefined;

  readonly messages$: Observable<ClinicMessage[]> = this.subjects.asObservable();

  readonly arrivals$: Observable<ClinicMessage> = this.arrivals.asObservable();

  readonly unreadCount$: Observable<number> = this.messages$.pipe(
    map(list => list.filter(m => m.status === 'unread').length)
  );

  constructor(
    private readonly http: HttpClient,
    status: BackendStatusService,
    private readonly socket: ChatSocketService
  ) {
    this.refresh();
    status.reconnected$.subscribe(() => this.refresh());

    this.socketSub = this.socket.onClinicMessage().subscribe(msg => this.applyLive(msg));
    this.reconnectSub = this.socket
      .conectado()
      .pipe(filter(online => online))
      .subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
    this.reconnectSub?.unsubscribe();
  }

  private applyLive(msg: ClinicMessage): void {
    const current = this.subjects.getValue();
    const index = current.findIndex(m => m.id === msg.id);
    const prev = index >= 0 ? current[index] : undefined;
    const next = index >= 0
      ? current.map((m, i) => (i === index ? msg : m))
      : [msg, ...current];
    this.subjects.next(next);
    if (!prev || (prev.status !== 'unread' && msg.status === 'unread')) {
      this.arrivals.next(msg);
    }
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
