import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  Odontologo,
  OdontologoDraft,
  OdontologoStatus,
  Turno
} from '../../../../core/models/odontologo.model';
import { SPECIALTIES } from '../../services/odontologos-mock.service';

@Component({
  selector: 'app-odontologo-form',
  templateUrl: './odontologo-form.component.html',
  styleUrls: ['./odontologo-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdontologoFormComponent implements OnChanges {
  @Input() odontologo: Odontologo | null = null;
  @Output() submit = new EventEmitter<OdontologoDraft>();
  @Output() cancel = new EventEmitter<void>();

  specialties = SPECIALTIES;
  statuses: OdontologoStatus[] = ['activo', 'ausente', 'inactivo'];
  turnos: Turno[] = ['MAÑANA', 'TARDE', 'COMPLETO'];

  name = '';
  specialty: string = SPECIALTIES[0];
  license = '';
  consultorio = '';
  turno: Turno = 'MAÑANA';
  status: OdontologoStatus = 'activo';
  error = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.odontologo && this.odontologo) {
      this.name = this.odontologo.name;
      this.specialty = this.odontologo.specialty;
      this.license = this.odontologo.license;
      this.consultorio = this.odontologo.consultorio;
      this.turno = this.odontologo.turno;
      this.status = this.odontologo.status;
      this.error = false;
    }
  }

  onSubmit(): void {
    if (!this.name.trim() || !this.license.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: OdontologoDraft = {
      name: this.name.trim().toUpperCase(),
      specialty: this.specialty,
      license: this.license.trim().toUpperCase(),
      consultorio: this.consultorio.trim().toUpperCase(),
      turno: this.turno,
      status: this.status
    };
    this.submit.emit(draft);
  }
}
