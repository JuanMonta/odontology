import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { AuthStore } from '../../../../core/auth/auth.store';
import {
  ChatCanalDraft,
  ChatConversacion,
  ChatMensaje,
  ChatParticipante,
  ChatPresencia
} from '../../../../core/models/chat.model';
import { ChatHttpService } from '../../services/chat-http.service';
import { ChatSocketService } from '../../services/chat-socket.service';

type PresenciaEstacion = 'online' | 'mixta' | 'offline';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatPageComponent implements OnInit, OnDestroy {
  @ViewChild('feed') feed?: ElementRef<HTMLElement>;

  conversaciones: ChatConversacion[] = [];
  mensajes: ChatMensaje[] = [];
  activa: ChatConversacion | null = null;
  presencia: ChatPresencia[] = [];
  usuarios: ChatParticipante[] = [];

  miCodigo = '';
  esAdmin = false;
  conectado = false;
  typingNombre: string | null = null;

  dmOpen = false;
  canalOpen = false;
  dmSeleccion: string | null = null;
  canalNombre = '';
  canalMiembros: string[] = [];

  nuevoMensaje = '';

  private readonly suscritas = new Set<number>();
  private readonly destroy$ = new Subject<void>();
  private readonly input$ = new Subject<string>();
  private readonly typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly typingPorCodigo = new Map<string, string>();
  private typingNotificado = false;
  private composerConvId: number | null = null;

  constructor(
    private readonly chat: ChatHttpService,
    private readonly socket: ChatSocketService,
    private readonly auth: AuthStore,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.miCodigo = this.auth.usuario?.code ?? '';
  }

  get enLinea(): number {
    return this.presencia.filter(p => p.online).length;
  }

  ngOnInit(): void {
    this.auth
      .esAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(admin => {
        this.esAdmin = admin;
        this.cdr.markForCheck();
      });

    this.socket
      .conectado()
      .pipe(takeUntil(this.destroy$))
      .subscribe(on => {
        this.conectado = on;
        this.cdr.markForCheck();
      });

    this.socket
      .onMensaje()
      .pipe(takeUntil(this.destroy$))
      .subscribe(msg => this.onMensajeLlega(msg));

    this.socket
      .onTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ev => this.onTypingLlega(ev));

    this.socket
      .onPresencia()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lista => {
        this.presencia = lista;
        this.cdr.markForCheck();
      });

    this.input$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(text => {
        if (!this.composerConvId) {
          return;
        }
        if (text.trim()) {
          this.socket.notificarEscritura(this.composerConvId, true);
          this.typingNotificado = true;
        } else if (this.typingNotificado) {
          this.socket.notificarEscritura(this.composerConvId, false);
          this.typingNotificado = false;
        }
      });

    this.socket.conectar();
    this.cargarConversaciones();
    this.chat.presencia().subscribe(lista => {
      this.presencia = lista;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.typingNotificado && this.composerConvId != null) {
      this.socket.notificarEscritura(this.composerConvId, false);
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.socket.desconectar();
  }

  tituloDe(conv: ChatConversacion): string {
    if (conv.tipo === 'canal') {
      return '# ' + (conv.nombre ?? 'CANAL');
    }
    const otro = conv.participantes.find(p => p.codigo !== this.miCodigo);
    return otro ? otro.nombre : (conv.nombre ?? 'DM');
  }

  presenciaDe(conv: ChatConversacion): PresenciaEstacion {
    const mapa = new Map(this.presencia.map(p => [p.codigo, p.online] as const));
    const estados = conv.participantes
      .filter(p => p.codigo !== this.miCodigo)
      .map(p => mapa.get(p.codigo) ?? false);
    if (!estados.length) {
      return 'offline';
    }
    const online = estados.filter(Boolean).length;
    if (online === estados.length) {
      return 'online';
    }
    return online > 0 ? 'mixta' : 'offline';
  }

  seleccionar(conv: ChatConversacion): void {
    if (this.typingNotificado && this.composerConvId != null) {
      this.socket.notificarEscritura(this.composerConvId, false);
      this.typingNotificado = false;
    }
    this.composerConvId = null;
    this.nuevoMensaje = '';
    this.activa = conv;
    this.mensajes = [];
    this.typingNombre = null;
    this.cdr.markForCheck();

    if (!this.suscritas.has(conv.id)) {
      this.suscritas.add(conv.id);
      this.socket.suscribirConversacion(conv.id);
    }

    this.chat.historial(conv.id).subscribe(msgs => {
      this.mensajes = msgs;
      this.cdr.markForCheck();
      setTimeout(() => this.scrollToBottom(), 0);
    });

    this.chat.marcarLeido(conv.id).subscribe(() => {
      conv.noLeidos = 0;
      this.cdr.markForCheck();
    });
  }

  abrirEstacion(conv: ChatConversacion): void {
    const idx = this.conversaciones.findIndex(c => c.id === conv.id);
    if (idx >= 0) {
      this.conversaciones[idx] = conv;
    } else {
      this.conversaciones = [...this.conversaciones, conv];
    }
    this.cdr.markForCheck();
    this.seleccionar(conv);
  }

  abrirDmModal(): void {
    this.dmSeleccion = null;
    this.chat.usuariosActivos().subscribe(lista => {
      this.usuarios = lista;
      this.dmOpen = true;
      this.cdr.markForCheck();
    });
  }

  elegirDm(codigo: string): void {
    this.chat.abrirDm(codigo).subscribe(conv => {
      this.dmOpen = false;
      this.cdr.markForCheck();
      this.abrirEstacion(conv);
    });
  }

  cerrarDm(): void {
    this.dmOpen = false;
  }

  abrirCanalModal(): void {
    this.canalNombre = '';
    this.canalMiembros = [];
    this.chat.usuariosActivos().subscribe(lista => {
      this.usuarios = lista;
      this.canalOpen = true;
      this.cdr.markForCheck();
    });
  }

  toggleMiembro(codigo: string): void {
    const idx = this.canalMiembros.indexOf(codigo);
    if (idx >= 0) {
      this.canalMiembros.splice(idx, 1);
    } else {
      this.canalMiembros.push(codigo);
    }
  }

  crearCanal(): void {
    const nombre = this.canalNombre.trim();
    if (!nombre) {
      return;
    }
    const draft: ChatCanalDraft = { nombre, miembros: [...this.canalMiembros] };
    this.chat.crearCanal(draft).subscribe(conv => {
      this.canalOpen = false;
      this.cdr.markForCheck();
      this.abrirEstacion(conv);
    });
  }

  cerrarCanal(): void {
    this.canalOpen = false;
  }

  onComposerInput(value: string): void {
    if (this.composerConvId !== (this.activa?.id ?? null)) {
      this.composerConvId = this.activa?.id ?? null;
    }
    this.input$.next(value);
  }

  onBlurComposer(): void {
    if (this.typingNotificado && this.composerConvId != null) {
      this.socket.notificarEscritura(this.composerConvId, false);
      this.typingNotificado = false;
    }
    this.composerConvId = null;
  }

  enviarMensaje(): void {
    const cuerpo = this.nuevoMensaje.trim();
    if (!this.activa || !cuerpo) {
      return;
    }
    this.socket.enviar(this.activa.id, cuerpo);
    this.nuevoMensaje = '';
    if (this.typingNotificado && this.composerConvId != null) {
      this.socket.notificarEscritura(this.composerConvId, false);
      this.typingNotificado = false;
    }
    this.composerConvId = null;
    this.cdr.markForCheck();
  }

  trackPorId(index: number, item: { id: number }): number {
    return item.id;
  }

  trackPorCodigo(index: number, item: { codigo: string }): string {
    return item.codigo;
  }

  private cargarConversaciones(): void {
    this.chat.conversaciones().subscribe(lista => {
      this.conversaciones = lista;
      this.cdr.markForCheck();
    });
  }

  private onMensajeLlega(msg: ChatMensaje): void {
    const conv = this.conversaciones.find(c => c.id === msg.conversacionId);
    if (conv) {
      conv.ultimoMensaje = msg.cuerpo;
      conv.ultimoMensajeHora = msg.fechaHora;
    }
    if (this.activa && msg.conversacionId === this.activa.id) {
      this.mensajes = [...this.mensajes, msg];
      this.chat.marcarLeido(msg.conversacionId).subscribe(() => {
        this.activa!.noLeidos = 0;
        this.cdr.markForCheck();
      });
      setTimeout(() => this.scrollToBottom(), 0);
    } else if (conv) {
      conv.noLeidos += 1;
    }
    this.cdr.markForCheck();
  }

  private onTypingLlega(ev: { codigo: string; nombre: string; typing: boolean }): void {
    if (ev.codigo === this.miCodigo) {
      return;
    }
    const timer = this.typingTimers.get(ev.codigo);
    if (timer) {
      clearTimeout(timer);
    }
    if (ev.typing) {
      this.typingPorCodigo.set(ev.codigo, ev.nombre);
      this.typingTimers.set(
        ev.codigo,
        setTimeout(() => {
          this.typingPorCodigo.delete(ev.codigo);
          this.typingTimers.delete(ev.codigo);
          this.recalcularTyping();
        }, 3000)
      );
    } else {
      this.typingPorCodigo.delete(ev.codigo);
      this.typingTimers.delete(ev.codigo);
    }
    this.recalcularTyping();
  }

  private recalcularTyping(): void {
    let nombre: string | null = null;
    if (this.activa) {
      const tripulacion = this.activa.participantes.map(p => p.codigo);
      this.typingPorCodigo.forEach((n, codigo) => {
        if (tripulacion.includes(codigo)) {
          nombre = n;
        }
      });
    }
    this.typingNombre = nombre;
    this.cdr.markForCheck();
  }

  private scrollToBottom(): void {
    const el = this.feed?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
