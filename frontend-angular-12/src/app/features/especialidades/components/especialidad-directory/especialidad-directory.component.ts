import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Especialidad } from '../../../../core/models/especialidad.model';

@Component({
  selector: 'app-especialidad-directory',
  templateUrl: './especialidad-directory.component.html',
  styleUrls: ['./especialidad-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EspecialidadDirectoryComponent {
  @Input() especialidades: Especialidad[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Especialidad>();
}
