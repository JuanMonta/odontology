import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  Consultorio,
  ConsultorioSaveEvent,
  ConsultorioStaff,
  ConsultorioStatus,
  StaffShiftState
} from '../../../../core/models/consultorio.model';

export function consultorioStatusLabel(status: ConsultorioStatus): string {
  switch (status) {
    case 'operativo':
      return 'OPERATIVA';
    case 'mantenimiento':
      return 'EN MANTENIMIENTO';
    case 'inactivo':
      return 'INACTIVA';
  }
}

export function staffStateLabel(state: StaffShiftState): string {
  switch (state) {
    case 'turno':
      return 'EN TURNO';
    case 'descanso':
      return 'EN DESCANSO';
    case 'fuera':
      return 'FUERA DE TURNO';
  }
}

/** Título del turno del catálogo, en mayúsculas para la voz del tablero. */
export function turnoLabel(turno: string): string {
  return turno.toUpperCase();
}

@Component({
  selector: 'app-consultorio-panel',
  templateUrl: './consultorio-panel.component.html',
  styleUrls: ['./consultorio-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultorioPanelComponent implements OnChanges {
  @Input() consultorio: Consultorio | null = null;
  @Input() creating = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ConsultorioSaveEvent>();
  @Output() toggle = new EventEmitter<string>();

  editing = false;

  statusLabel = consultorioStatusLabel;
  staffStateLabel = staffStateLabel;
  turnoLabel = turnoLabel;

  staffCount(c: Consultorio): number {
    return c.staff.length;
  }

  onTurnoCount(c: Consultorio): number {
    return c.staff.filter(s => s.state === 'turno').length;
  }

  staffTrack(_i: number, s: ConsultorioStaff): string {
    return s.code;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const consultorioChange = changes.consultorio;
    const creatingChange = changes.creating;

    if (creatingChange && creatingChange.currentValue) {
      this.editing = false;
      return;
    }

    if (
      consultorioChange &&
      !consultorioChange.isFirstChange() &&
      consultorioChange.previousValue?.id !== consultorioChange.currentValue?.id
    ) {
      this.editing = false;
    }
  }

  startEdit(): void {
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  closeForm(): void {
    if (this.creating) {
      this.cancel.emit();
    } else {
      this.cancelEdit();
    }
  }

  onSaved(ev: ConsultorioSaveEvent): void {
    this.editing = false;
    this.saved.emit(ev);
  }
}
