import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Odontologo } from '../../../../core/models/odontologo.model';

@Component({
  selector: 'app-odontologo-directory',
  templateUrl: './odontologo-directory.component.html',
  styleUrls: ['./odontologo-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdontologoDirectoryComponent {
  @Input() odontologos: Odontologo[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Odontologo>();
}
