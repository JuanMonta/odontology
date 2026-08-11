import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Consultorio, ConsultorioDraft, ConsultorioStatus } from '../../../../core/models/consultorio.model';

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

  name = '';
  unit = '';
  location = '';
  equipment = '';
  status: ConsultorioStatus = 'operativo';
  error = false;

  private syncedId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.consultorio && this.consultorio && this.consultorio.id !== this.syncedId) {
      this.syncedId = this.consultorio.id;
      this.name = this.consultorio.name;
      this.unit = this.consultorio.unit;
      this.location = this.consultorio.location;
      this.equipment = this.consultorio.equipment.join(' · ');
      this.status = this.consultorio.status;
      this.error = false;
    }
  }

  onSubmit(): void {
    if (!this.name.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: ConsultorioDraft = {
      name: this.name.trim().toUpperCase(),
      unit: this.unit.trim().toUpperCase(),
      location: this.location.trim().toUpperCase(),
      equipment: this.equipment
        .split(/[·,]/)
        .map(s => s.trim().toUpperCase())
        .filter(Boolean),
      status: this.status
    };
    this.submit.emit(draft);
  }
}
