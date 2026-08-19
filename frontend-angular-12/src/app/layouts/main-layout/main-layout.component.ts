import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, interval, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { MessagesHttpService } from '../../features/messages/services/messages-http.service';
import { ConfiguracionHttpService } from '../../features/configuracion/services/configuracion-http.service';
import { ChatHttpService } from '../../features/chat/services/chat-http.service';
import { ChatSocketService } from '../../features/chat/services/chat-socket.service';
import { AuthStore } from '../../core/auth/auth.store';
import { Usuario } from '../../core/models/usuario.model';
import { APP_ROUTES, AppRoute } from '../../core/config/app-routes';

interface NavItem {
  label: string;
  route?: AppRoute;
  title?: string;
  active: boolean;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface ToastItem {
  id: string;
  subject: string;
  from: string;
  prioridad: string;
}

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  @ViewChild('drawer') drawer?: ElementRef<HTMLElement>;
  @ViewChild('burger') burger?: ElementRef<HTMLButtonElement>;

  today = '';
  open = false;
  toasts: ToastItem[] = [];
  usuario: Usuario | null = null;

  private readonly navSub: Subscription;
  private readonly msgsSub: Subscription;
  private readonly toastsSub: Subscription;
  private readonly settingsSub: Subscription;
  private readonly userSub: Subscription;
  private chatPollSub?: Subscription;
  private alertasUrgentes = true;
  private readonly toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

  sections: NavSection[] = [
    {
      label: 'OPERACIÓN',
      items: [
        { label: 'AGENDA', route: APP_ROUTES.dashboard, title: 'AGENDA DEL DÍA', active: false },
        { label: 'PACIENTES', route: APP_ROUTES.pacientes, title: 'PACIENTES', active: false },
        { label: 'TRATAMIENTOS', route: APP_ROUTES.tratamientos, title: 'TRATAMIENTOS', active: false }
      ]
    },
    {
      label: 'GESTIÓN',
      items: [
        { label: 'FACTURACIÓN', active: false },
        { label: 'REPORTES', active: false },
        { label: 'CONSULTORIOS', route: APP_ROUTES.consultorios, title: 'MAPEO DE CONSULTORIOS', active: false },
        { label: 'MENSAJES', route: APP_ROUTES.mensajes, title: 'BANDEJA DE MENSAJES', active: false },
        { label: 'CHAT EN VIVO', route: APP_ROUTES.chat, title: 'ESTACIONES Y TRANSMISIONES', active: false }
      ]
    },
    {
      label: 'SISTEMA',
      items: [
        { label: 'PERSONAL CLÍNICO', route: APP_ROUTES.odontologos, title: 'PERSONAL CLÍNICO', active: false },
        { label: 'ESPECIALIDADES', route: APP_ROUTES.especialidades, title: 'ESPECIALIDADES', active: false },
        { label: 'TURNOS Y HORARIOS', route: APP_ROUTES.turnos, title: 'TURNOS Y HORARIOS', active: false },
        { label: 'USUARIOS', route: APP_ROUTES.usuarios, title: 'CONTROL DE USUARIOS', active: false },
        { label: 'CONFIGURACIÓN', route: APP_ROUTES.configuracion, title: 'CONFIGURACIÓN DE LA CLÍNICA', active: false }
      ]
    }
  ];

  get activeItem(): NavItem {
    const items = this.sections.reduce((acc, s) => acc.concat(s.items), [] as NavItem[]);
    return items.find(i => i.active) ?? this.sections[0].items[0];
  }

  get activeTitle(): string {
    return this.activeItem.title ?? this.activeItem.label;
  }

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly messages: MessagesHttpService,
    private readonly settings: ConfiguracionHttpService,
    private readonly chat: ChatHttpService,
    private readonly socket: ChatSocketService,
    private readonly auth: AuthStore
  ) {
    this.today = this.formatToday(new Date());
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.syncActiveFromRoute());

    this.userSub = this.auth.usuario$().subscribe(u => {
      this.usuario = u;
      if (u) {
        this.socket.conectar();
        this.startChatPoll();
      } else {
        this.socket.desconectar();
        this.stopChatPoll();
        this.setChatBadge(undefined);
      }
      this.cdr.markForCheck();
    });

    this.msgsSub = this.messages.unreadCount$.subscribe(count => {
      const item = this.sections[1].items.find(i => i.label === 'MENSAJES');
      if (item) {
        item.badge = count > 0 ? count : undefined;
      }
      this.cdr.markForCheck();
    });

    this.toastsSub = this.messages.arrivals$.subscribe(msg => {
      if (!msg) {
        return;
      }
      const urgent = msg.prioridad === 'urgente' || msg.prioridad === 'importante';
      if (urgent && !this.alertasUrgentes) {
        return;
      }
      this.pushToast(msg);
    });

    this.settingsSub = this.settings.settings$.subscribe(settings => {
      this.alertasUrgentes = settings?.notificacionUrgente ?? true;
    });
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
    this.msgsSub.unsubscribe();
    this.toastsSub.unsubscribe();
    this.settingsSub.unsubscribe();
    this.userSub.unsubscribe();
    this.stopChatPoll();
    this.toastTimers.forEach(timer => clearTimeout(timer));
    this.toastTimers.clear();
  }

  private syncActiveFromRoute(): void {
    const url = this.router.url;
    this.sections.forEach(section =>
      section.items.forEach(item => (item.active = !!item.route && url === item.route))
    );
  }

  toggle(): void {
    if (this.open) {
      this.close();
    } else {
      this.openDrawer();
    }
  }

  onNavigate(event: Event, item: NavItem): void {
    this.sections.forEach(section =>
      section.items.forEach(i => (i.active = i === item))
    );
    if (!item.route) {
      event.preventDefault();
    }
    this.close();
  }

  onLogout(): void {
    this.close();
    this.auth.logout();
    // Recarga completa: descarta las cachés de los servicios singleton y cierra el WebSocket.
    window.location.assign(APP_ROUTES.login);
  }

  private startChatPoll(): void {
    this.stopChatPoll();
    this.chatPollSub = interval(15000)
      .pipe(switchMap(() => (this.auth.isLoggedIn() ? this.chat.noLeidos() : of(0))))
      .subscribe(count => {
        this.setChatBadge(count > 0 ? count : undefined);
        this.cdr.markForCheck();
      });
  }

  private stopChatPoll(): void {
    if (this.chatPollSub) {
      this.chatPollSub.unsubscribe();
      this.chatPollSub = undefined;
    }
  }

  private setChatBadge(badge: number | undefined): void {
    const item = this.sections[1].items.find(i => i.label === 'CHAT EN VIVO');
    if (item) {
      item.badge = badge;
    }
  }

  dismissToast(id: string): void {
    const timer = this.toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.toastTimers.delete(id);
    }
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.markForCheck();
  }

  goToMessages(): void {
    this.close();
    this.router.navigate([APP_ROUTES.mensajes]);
  }

  private pushToast(msg: { id: string; subject: string; from: string; prioridad: string }): void {
    const toast: ToastItem = {
      id: msg.id,
      subject: msg.subject,
      from: msg.from,
      prioridad: msg.prioridad
    };
    this.toasts = [toast, ...this.toasts].slice(0, 3);
    this.cdr.markForCheck();
    const timer = setTimeout(() => this.dismissToast(toast.id), 9000);
    this.toastTimers.set(toast.id, timer);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.close();
    }
  }

  private openDrawer(): void {
    this.open = true;
    setTimeout(() => {
      const first = this.drawer?.nativeElement.querySelector<HTMLElement>(
        '.drawer-close, a[href], button'
      );
      first?.focus();
    });
  }

  close(): void {
    const activo = document.activeElement as HTMLElement | null;
    if (activo && this.drawer?.nativeElement.contains(activo)) {
      activo.blur();
    }
    this.open = false;
    setTimeout(() => this.burger?.nativeElement.focus());
  }

  private formatToday(d: Date): string {
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${dias[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }
}
