import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ChatMensaje, ChatPresencia } from '../../../core/models/chat.model';

const WS_BASE = 'http://localhost:8000/ws';

interface TypingEvent {
  codigo: string;
  nombre: string;
  typing: boolean;
}

/**
 * Canal STOMP en vivo del chat (SockJS → Spring /ws con handshake JWT por
 * query param). Difunde transmisiones nuevas, el indicador de escritura y la
 * presencia del personal del consultorio. La persistencia siempre la hace el backend.
 */
@Injectable({ providedIn: 'root' })
export class ChatSocketService implements OnDestroy {
  private readonly client = new Client();
  private readonly connected$ = new BehaviorSubject<boolean>(false);
  private readonly mensajes$ = new Subject<ChatMensaje>();
  private readonly typing$ = new Subject<TypingEvent>();
  private readonly presencia$ = new Subject<ChatPresencia[]>();

  constructor(private readonly auth: AuthStore) {}

  onMensaje(): Subject<ChatMensaje> {
    return this.mensajes$;
  }

  onTyping(): Subject<TypingEvent> {
    return this.typing$;
  }

  onPresencia(): Subject<ChatPresencia[]> {
    return this.presencia$;
  }

  conectado(): BehaviorSubject<boolean> {
    return this.connected$;
  }

  conectar(): void {
    if (this.client.active || !this.auth.token) {
      return;
    }
    this.client.webSocketFactory = () => new SockJS(`${WS_BASE}?token=${encodeURIComponent(this.auth.token!)}`);
    this.client.onConnect = () => {
      this.connected$.next(true);
      this.client.subscribe('/topic/presencia', (msg: IMessage) => {
        this.presencia$.next(JSON.parse(msg.body) as ChatPresencia[]);
      });
    };
    this.client.onWebSocketClose = () => this.connected$.next(false);
    this.client.onStompError = () => this.connected$.next(false);
    this.client.activate();
  }

  suscribirConversacion(conversacionId: number): void {
    if (!this.client.active) {
      return;
    }
    this.client.subscribe(`/topic/chat/${conversacionId}`, (msg: IMessage) => {
      this.mensajes$.next(JSON.parse(msg.body) as ChatMensaje);
    });
    this.client.subscribe(`/topic/chat/${conversacionId}/typing`, (msg: IMessage) => {
      this.typing$.next(JSON.parse(msg.body) as TypingEvent);
    });
  }

  enviar(conversacionId: number, cuerpo: string): void {
    if (!this.client.active) {
      return;
    }
    this.client.publish({
      destination: '/app/chat.enviar',
      body: JSON.stringify({ conversacionId, cuerpo })
    });
  }

  notificarEscritura(conversacionId: number, typing: boolean): void {
    if (!this.client.active) {
      return;
    }
    this.client.publish({
      destination: '/app/chat.escribiendo',
      body: JSON.stringify({ conversacionId, typing })
    });
  }

  desconectar(): void {
    this.connected$.next(false);
    this.client.deactivate();
  }

  ngOnDestroy(): void {
    this.desconectar();
  }
}
