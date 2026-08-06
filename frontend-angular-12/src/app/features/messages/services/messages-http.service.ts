import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ClinicMessage, MessageChannel, MessageDraft } from '../../../core/models/message.model';
import { API_BASE } from '../../../core/config/api.config';

export const MESSAGE_CHANNELS: { id: MessageChannel; label: string }[] = [
  { id: 'consulta', label: 'CONSULTA' },
  { id: 'paciente', label: 'PACIENTE' },
  { id: 'equipo', label: 'EQUIPO' }
];

/**
 * Consume el backend REST de mensajes (spring_backend → /api/v1/messages).
 * Mantiene el mismo contrato Observable del mock para no tocar las vistas.
 */
@Injectable({ providedIn: 'root' })
export class MessagesHttpService {
  private readonly subjects = new BehaviorSubject<ClinicMessage[]>([]);

  readonly messages$: Observable<ClinicMessage[]> = this.subjects.asObservable();

  readonly unreadCount$: Observable<number> = this.messages$.pipe(
    map(list => list.filter(m => m.status === 'unread').length)
  );

  constructor(private readonly http: HttpClient) {
    this.refresh();
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
