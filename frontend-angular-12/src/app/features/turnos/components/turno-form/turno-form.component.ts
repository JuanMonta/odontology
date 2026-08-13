import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Turno, TurnoDraft } from '../../../../core/models/turno.model';

@Component({
  selector: 'app-turno-form',
  templateUrl: './turno-form.component.html',
  styleUrls: ['./turno-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurnoFormComponent implements OnChanges {
  @Input() turno: Turno | null = null;
  @Output() saved = new EventEmitter<TurnoDraft>();
  @Output() cancel = new EventEmitter<void>();

  nombre = '';
  horaInicio = '';
  horaFin = '';
  descansoInicio = '';
  descansoFin = '';
  error = false;
  errorMsg = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.turno && this.turno) {
      this.nombre = this.turno.nombre;
      this.horaInicio = this.turno.horaInicio;
      this.horaFin = this.turno.horaFin;
      this.descansoInicio = this.turno.descansoInicio ?? '';
      this.descansoFin = this.turno.descansoFin ?? '';
      this.error = false;
      this.errorMsg = '';
    }
  }

  onSubmit(): void {
    if (!this.nombre.trim()) {
      this.error = true;
      this.errorMsg = 'EL NOMBRE DEL TURNO ES OBLIGATORIO';
      return;
    }
    if (!this.horaInicio || !this.horaFin) {
      this.error = true;
      this.errorMsg = 'LAS HORAS DE INICIO Y FIN SON OBLIGATORIAS';
      return;
    }
    if (this.horaInicio >= this.horaFin) {
      this.error = true;
      this.errorMsg = 'LA HORA DE INICIO DEBE SER ANTERIOR A LA DE FIN';
      return;
    }
    if (this.descansoInicio || this.descansoFin) {
      if (!this.descansoInicio || !this.descansoFin) {
        this.error = true;
        this.errorMsg = 'EL DESCANSO REQUIERE HORA DE INICIO Y DE FIN';
        return;
      }
      if (this.descansoInicio >= this.descansoFin) {
        this.error = true;
        this.errorMsg = 'EL DESCANSO DEBE TENER INICIO ANTERIOR A SU FIN';
        return;
      }
      if (this.descansoInicio < this.horaInicio || this.descansoFin > this.horaFin) {
        this.error = true;
        this.errorMsg = 'EL DESCANSO DEBE ESTAR DENTRO DE LA JORNADA LABORAL';
        return;
      }
    }
    this.error = false;
    this.errorMsg = '';
    const draft: TurnoDraft = {
      nombre: this.nombre.trim().toLowerCase(),
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      descansoInicio: this.descansoInicio || null,
      descansoFin: this.descansoFin || null
    };
    this.saved.emit(draft);
  }
}
