import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';

interface NavItem {
  label: string;
  route?: string;
  title?: string;
  action?: string;
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

  sections: NavSection[] = [
    {
      label: 'OPERACIÓN',
      items: [
        { label: 'AGENDA', title: 'AGENDA DEL DÍA', action: 'NUEVA CITA', active: true },
        { label: 'PACIENTES', route: '/pacientes', title: 'PACIENTES', action: 'NUEVO PACIENTE', active: false },
        { label: 'HISTORIAS', active: false },
        { label: 'TRATAMIENTOS', route: '/tratamientos', title: 'TRATAMIENTOS', action: 'NUEVO TRATAMIENTO', active: false }
      ]
    },
    {
      label: 'GESTIÓN',
      items: [
        { label: 'FACTURACIÓN', active: false },
        { label: 'REPORTES', active: false },
        { label: 'CONSULTORIOS', active: false },
        { label: 'MENSAJES', active: false, badge: 3 }
      ]
    },
    {
      label: 'SISTEMA',
      items: [
        { label: 'ODONTÓLOGOS', active: false },
        { label: 'USUARIOS', active: false },
        { label: 'CONFIGURACIÓN', active: false }
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

  get activeAction(): string | undefined {
    return this.activeItem.action;
  }

  constructor(private router: Router) {
    this.today = this.formatToday(new Date());
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

  onAction(): void {
    const item = this.activeItem;
    if (item.route) {
      this.router.navigate([item.route], { queryParams: { nuevo: true } });
    }
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
