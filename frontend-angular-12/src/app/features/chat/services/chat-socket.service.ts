import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ClinicMessage } from '../../../core/models/message.model';
import { ChatMensaje, ChatPresencia } from '../../../core/models/chat.model';

const WS_BASE = 'http://localhost:8000/ws';

interface TypingEvent {
  codigo: string;
  nombre: string;
  typing: boolean;
}

/**
 * Canal STOMP en vivo del chat (SockJS → Spring /ws con handshake JWT por
 * query param). Difunde transmisiones nuevas, el indicador de escritura, la
 * presencia del personal del consultorio y los mensajes de la bandeja
 * (topic {@code /topic/messages}). La persistencia siempre la hace el backend.
 *
 * <p>La conexión es compartida: {@link #conectar()} lleva un contador de
 * clientes para que el shell (main-layout) mantenga el socket vivo mientras
 * las páginas (chat, bandeja) lo conecten y desconecten sin cerrarlo.
 */
@Injectable({ providedIn: 'root' })
export class ChatSocketService implements OnDestroy {
  private readonly client = new Client();
  private readonly connected$ = new BehaviorSubject<boolean>(false);
  private readonly mensajes$ = new Subject<ChatMensaje>();
  private readonly typing$ = new Subject<TypingEvent>();
  private readonly presencia$ = new Subject<ChatPresencia[]>();
  private readonly clinicMessages$ = new Subject<ClinicMessage>();
  private clients = 0;

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

  onClinicMessage(): Subject<ClinicMessage> {
    return this.clinicMessages$;
  }

  conectado(): BehaviorSubject<boolean> {
    return this.connected$;
  }

  conectar(): void {
    this.clients++;
    if (this.clients > 1 || this.client.active || !this.auth.token) {
      return;
    }
    this.client.webSocketFactory = () => new SockJS(`${WS_BASE}?token=${encodeURIComponent(this.auth.token!)}`);
    this.client.onConnect = () => {
      this.connected$.next(true);
      this.client.subscribe('/topic/presencia', (msg: IMessage) => {
        this.presencia$.next(JSON.parse(msg.body) as ChatPresencia[]);
      });
      this.client.subscribe('/topic/messages', (msg: IMessage) => {
        this.clinicMessages$.next(JSON.parse(msg.body) as ClinicMessage);
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
    this.clients = Math.max(0, this.clients - 1);
    if (this.clients > 0) {
      return;
    }
    this.connected$.next(false);
    this.client.deactivate();
  }

  ngOnDestroy(): void {
    this.desconectar();
  }
}
