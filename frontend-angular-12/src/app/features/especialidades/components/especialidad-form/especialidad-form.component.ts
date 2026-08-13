import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Especialidad, EspecialidadDraft } from '../../../../core/models/especialidad.model';

@Component({
  selector: 'app-especialidad-form',
  templateUrl: './especialidad-form.component.html',
  styleUrls: ['./especialidad-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EspecialidadFormComponent implements OnChanges {
  @Input() especialidad: Especialidad | null = null;
  @Output() saved = new EventEmitter<EspecialidadDraft>();
  @Output() cancel = new EventEmitter<void>();

  nombre = '';
  error = false;
  errorMsg = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.especialidad && this.especialidad) {
      this.nombre = this.especialidad.nombre;
      this.error = false;
      this.errorMsg = '';
    }
  }

  onSubmit(): void {
    if (!this.nombre.trim()) {
      this.error = true;
      this.errorMsg = 'EL NOMBRE DE LA ESPECIALIDAD ES OBLIGATORIO';
      return;
    }
    this.error = false;
    this.errorMsg = '';
    this.saved.emit({ nombre: this.nombre.trim().toUpperCase() });
  }
}
