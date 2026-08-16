import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Turno } from '../../../../core/models/turno.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';

@Component({
  selector: 'app-turno-directory',
  templateUrl: './turno-directory.component.html',
  styleUrls: ['./turno-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurnoDirectoryComponent extends PaginatedListComponent {
  @Input() turnos: Turno[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Turno>();

  protected get totalItems(): number {
    return this.turnos.length;
  }

  get visibleTurnos(): Turno[] {
    return this.slice(this.turnos) as Turno[];
  }

  jornada(t: Turno): string {
    return `${t.horaInicio} – ${t.horaFin}`;
  }

  descanso(t: Turno): string {
    return t.descansoInicio && t.descansoFin ? `${t.descansoInicio} – ${t.descansoFin}` : '—';
  }
}
