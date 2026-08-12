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
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MessagesHttpService } from '../../features/messages/services/messages-http.service';
import { ConfiguracionHttpService } from '../../features/configuracion/services/configuracion-http.service';

interface NavItem {
  label: string;
  route?: string;
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

  private readonly navSub: Subscription;
  private readonly msgsSub: Subscription;
  private readonly toastsSub: Subscription;
  private readonly settingsSub: Subscription;
  private alertasUrgentes = true;

  sections: NavSection[] = [
    {
      label: 'OPERACIÓN',
      items: [
        { label: 'AGENDA', route: '/', title: 'AGENDA DEL DÍA', active: false },
        { label: 'PACIENTES', route: '/pacientes', title: 'PACIENTES', active: false },
        { label: 'TRATAMIENTOS', route: '/tratamientos', title: 'TRATAMIENTOS', active: false }
      ]
    },
    {
      label: 'GESTIÓN',
      items: [
        { label: 'FACTURACIÓN', active: false },
        { label: 'REPORTES', active: false },
        { label: 'CONSULTORIOS', route: '/consultorios', title: 'MAPEO DE CONSULTORIOS', active: false },
        { label: 'MENSAJES', route: '/mensajes', title: 'BANDEJA DE MENSAJES', active: false }
      ]
    },
    {
      label: 'SISTEMA',
      items: [
        { label: 'ODONTÓLOGOS', route: '/odontologos', title: 'ROSTER DE ODONTÓLOGOS', active: false },
        { label: 'USUARIOS', route: '/usuarios', title: 'CONTROL DE USUARIOS', active: false },
        { label: 'CONFIGURACIÓN', route: '/configuracion', title: 'CONFIGURACIÓN DE LA CLÍNICA', active: false }
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
    private readonly settings: ConfiguracionHttpService
  ) {
    this.today = this.formatToday(new Date());
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.syncActiveFromRoute());

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
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.markForCheck();
  }

  goToMessages(): void {
    this.close();
    this.router.navigate(['/mensajes']);
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
    setTimeout(() => this.dismissToast(msg.id), 9000);
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
    this.open = false;
    setTimeout(() => this.burger?.nativeElement.focus());
  }

  private formatToday(d: Date): string {
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${dias[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }
}
