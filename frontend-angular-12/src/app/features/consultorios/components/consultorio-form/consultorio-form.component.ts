import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Consultorio, ConsultorioDraft, ConsultorioStatus } from '../../../../core/models/consultorio.model';
import { ConsultorioCatalogosService, ConsultorioCatalogos } from '../../services/consultorio-catalogos.service';

@Component({
  selector: 'app-consultorio-form',
  templateUrl: './consultorio-form.component.html',
  styleUrls: ['./consultorio-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultorioFormComponent implements OnChanges {
  @Input() consultorio: Consultorio | null = null;
  @Output() submit = new EventEmitter<ConsultorioDraft>();
  @Output() cancel = new EventEmitter<void>();

  statuses: ConsultorioStatus[] = ['operativo', 'mantenimiento', 'inactivo'];

  unidades$: Observable<string[]>;
  ubicaciones$: Observable<string[]>;
  equipos$: Observable<string[]>;

  name = '';
  unit = '';
  location = '';
  equipment: string[] = [];
  status: ConsultorioStatus = 'operativo';
  error = false;

  private syncedId: string | null = null;

  constructor(catalogos: ConsultorioCatalogosService) {
    this.unidades$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.unidades));
    this.ubicaciones$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.ubicaciones));
    this.equipos$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.equipos));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.consultorio && this.consultorio && this.consultorio.id !== this.syncedId) {
      this.syncedId = this.consultorio.id;
      this.name = this.consultorio.name;
      this.unit = this.consultorio.unit;
      this.location = this.consultorio.location;
      this.equipment = this.consultorio.equipment;
      this.status = this.consultorio.status;
      this.error = false;
    }
  }

  toggleEquipo(equipo: string): void {
    if (this.equipment.includes(equipo)) {
      this.equipment = this.equipment.filter(e => e !== equipo);
    } else {
      this.equipment = [...this.equipment, equipo];
    }
  }

  onSubmit(): void {
    if (!this.name.trim() || !this.unit || !this.location) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: ConsultorioDraft = {
      name: this.name.trim().toUpperCase(),
      unit: this.unit,
      location: this.location,
      equipment: this.equipment,
      status: this.status
    };
    this.submit.emit(draft);
  }
}
