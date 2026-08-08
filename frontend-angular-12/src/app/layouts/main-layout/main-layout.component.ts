import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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

  private readonly navSub: Subscription;

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
        { label: 'MENSAJES', route: '/mensajes', title: 'BANDEJA DE MENSAJES', active: false, badge: 3 }
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

  constructor(private readonly router: Router) {
    this.today = this.formatToday(new Date());
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.syncActiveFromRoute());
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
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
