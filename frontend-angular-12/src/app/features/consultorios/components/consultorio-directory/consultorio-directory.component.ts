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
}
