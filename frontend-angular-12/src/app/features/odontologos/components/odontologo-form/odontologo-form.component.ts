import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Odontologo,
  OdontologoDraft,
  OdontologoStatus
} from '../../../../core/models/odontologo.model';
import { ConsultoriosHttpService } from '../../../consultorios/services/consultorios-http.service';
import { TurnosHttpService } from '../../../turnos/services/turnos-http.service';
import { EspecialidadesHttpService } from '../../../especialidades/services/especialidades-http.service';

@Component({
  selector: 'app-odontologo-form',
  templateUrl: './odontologo-form.component.html',
  styleUrls: ['./odontologo-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdontologoFormComponent implements OnChanges {
  @Input() odontologo: Odontologo | null = null;
  @Output() saved = new EventEmitter<OdontologoDraft>();
  @Output() cancel = new EventEmitter<void>();

  statuses: OdontologoStatus[] = ['activo', 'ausente', 'inactivo'];

  consultorioOptions$: Observable<string[]>;
  turnoOptions$: Observable<string[]>;
  especialidadOptions$: Observable<string[]>;

  constructor(
    consultorios: ConsultoriosHttpService,
    turnos: TurnosHttpService,
    especialidades: EspecialidadesHttpService
  ) {
    this.consultorioOptions$ = consultorios.consultorios$.pipe(map(list => list.map(c => c.code)));
    this.turnoOptions$ = turnos.activos$.pipe(map(list => list.map(t => t.nombre)));
    this.especialidadOptions$ = especialidades.activas$.pipe(map(list => list.map(e => e.nombre)));
  }

  name = '';
  specialty = '';
  license = '';
  consultorio = '';
  turno = '';
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
    this.saved.emit(draft);
  }
}
