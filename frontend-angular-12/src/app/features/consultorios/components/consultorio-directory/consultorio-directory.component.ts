import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Consultorio } from '../../../../core/models/consultorio.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';

@Component({
  selector: 'app-consultorio-directory',
  templateUrl: './consultorio-directory.component.html',
  styleUrls: ['./consultorio-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultorioDirectoryComponent extends PaginatedListComponent implements AfterViewInit {
  @Input() consultorios: Consultorio[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Consultorio>();
  @ViewChild('dirList') dirListRef?: ElementRef<HTMLDivElement>;

  protected get totalItems(): number {
    return this.consultorios.length;
  }

  get visibleConsultorios(): Consultorio[] {
    return this.slice(this.consultorios) as Consultorio[];
  }

  /** Personal en turno ahora (uno o más; un consultorio atiende varios a la vez). */
  onTurno(c: Consultorio): string {
    const names = c.staff.filter(s => s.state === 'turno').map(s => s.name);
    if (names.length) {
      return names.join(' · ');
    }
    if (c.staff.length) {
      return 'FUERA DE TURNO';
    }
    return c.status === 'operativo' ? 'DISPONIBLE' : '—';
  }

  hasTurno(c: Consultorio): boolean {
    return c.staff.some(s => s.state === 'turno');
  }

  ngAfterViewInit(): void {
    if (this.persistKey) {
      this.bindScroll(this.dirListRef?.nativeElement ?? null);
    }
  }
}
