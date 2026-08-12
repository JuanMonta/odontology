import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import {
  ChatCanalDraft,
  ChatConversacion,
  ChatMensaje,
  ChatParticipante,
  ChatPresencia
} from '../../../core/models/chat.model';

/**
 * API REST del chat (protegida por JWT vía {@link JwtInterceptor}). Lo efímero
 * (typing, push en vivo) va por STOMP; lo durable — historial, membresías,
 * lectura — vive aquí.
 */
@Injectable({ providedIn: 'root' })
export class ChatHttpService {
  constructor(private readonly http: HttpClient) {}

  conversaciones(): Observable<ChatConversacion[]> {
    return this.http.get<ChatConversacion[]>(`${API_BASE}/chat/conversaciones`);
  }

  historial(conversacionId: number): Observable<ChatMensaje[]> {
    return this.http.get<ChatMensaje[]>(`${API_BASE}/chat/conversaciones/${conversacionId}/mensajes`);
  }

  abrirDm(otroCodigo: string): Observable<ChatConversacion> {
    return this.http.post<ChatConversacion>(`${API_BASE}/chat/conversaciones/dm/${otroCodigo}`, {});
  }

  crearCanal(draft: ChatCanalDraft): Observable<ChatConversacion> {
    return this.http.post<ChatConversacion>(`${API_BASE}/chat/conversaciones`, draft);
  }

  agregarMiembro(conversacionId: number, usuarioCodigo: string): Observable<ChatConversacion> {
    return this.http.post<ChatConversacion>(
      `${API_BASE}/chat/conversaciones/${conversacionId}/miembros/${usuarioCodigo}`,
      {}
    );
  }

  quitarMiembro(conversacionId: number, usuarioCodigo: string): Observable<ChatConversacion> {
    return this.http.delete<ChatConversacion>(
      `${API_BASE}/chat/conversaciones/${conversacionId}/miembros/${usuarioCodigo}`
    );
  }

  marcarLeido(conversacionId: number): Observable<void> {
    return this.http.patch<void>(`${API_BASE}/chat/conversaciones/${conversacionId}/leer`, {});
  }

  noLeidos(): Observable<number> {
    return this.http.get<number>(`${API_BASE}/chat/no-leidos`);
  }

  presencia(): Observable<ChatPresencia[]> {
    return this.http.get<ChatPresencia[]>(`${API_BASE}/chat/presencia`);
  }

  usuariosActivos(): Observable<ChatParticipante[]> {
    return this.http.get<ChatParticipante[]>(`${API_BASE}/chat/usuarios-activos`);
  }
}
