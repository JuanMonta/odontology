import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Consultorio } from '../../../../core/models/consultorio.model';

@Component({
  selector: 'app-consultorio-directory',
  templateUrl: './consultorio-directory.component.html',
  styleUrls: ['./consultorio-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultorioDirectoryComponent {
  @Input() consultorios: Consultorio[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Consultorio>();

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
}
