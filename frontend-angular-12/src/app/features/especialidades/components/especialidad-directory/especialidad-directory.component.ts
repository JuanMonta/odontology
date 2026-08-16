import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Especialidad } from '../../../../core/models/especialidad.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';

@Component({
  selector: 'app-especialidad-directory',
  templateUrl: './especialidad-directory.component.html',
  styleUrls: ['./especialidad-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EspecialidadDirectoryComponent extends PaginatedListComponent {
  @Input() especialidades: Especialidad[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Especialidad>();

  protected get totalItems(): number {
    return this.especialidades.length;
  }

  get visibleEspecialidades(): Especialidad[] {
    return this.slice(this.especialidades) as Especialidad[];
  }
}
