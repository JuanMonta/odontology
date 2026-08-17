import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Consultorio,
  ConsultorioSaveEvent,
  ConsultorioStaff,
  ConsultorioStatus,
  StaffShiftState
} from '../../../../core/models/consultorio.model';
import { Treatment } from '../../../../core/models/treatment.model';
import { TreatmentsHttpService } from '../../../treatments/services/treatments-http.service';

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
export class ConsultorioPanelComponent implements OnInit, OnChanges {
  @Input() consultorio: Consultorio | null = null;
  @Input() creating = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ConsultorioSaveEvent>();
  @Output() toggle = new EventEmitter<string>();

  editing = false;
  /** Copia local del consultorio para edición, evita parpadeo por async pipe */
  editingConsultorio: Consultorio | null = null;

  tratamientos$: Observable<Treatment[]>;

  statusLabel = consultorioStatusLabel;
  staffStateLabel = staffStateLabel;
  turnoLabel = turnoLabel;

  constructor(private readonly treatmentsService: TreatmentsHttpService) {
    this.tratamientos$ = treatmentsService.treatments$.pipe(
      map((list: Treatment[]) => list.sort((a, b) => a.name.localeCompare(b.name)))
    );
  }

  ngOnInit(): void {
    this.treatmentsService.refresh();
  }

  /** Tratamientos soportados por la sala, resueltos desde el catálogo por su código. */
  tratamientosDeLaSala(tratamientos: Treatment[]): Treatment[] {
    const codes = this.consultorio?.tratamientos ?? [];
    return codes
      .map(code => tratamientos.find(t => t.code === code))
      .filter((t): t is Treatment => !!t);
  }

  tratTrack(_i: number, t: Treatment): string {
    return t.code;
  }

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
      this.editingConsultorio = null;
      return;
    }

    if (
      consultorioChange &&
      !consultorioChange.isFirstChange() &&
      consultorioChange.previousValue?.id !== consultorioChange.currentValue?.id
    ) {
      this.editing = false;
      this.editingConsultorio = null;
    }
  }

  startEdit(): void {
    // Capturar el consultorio ANTES de activar edición para evitar parpadeo
    this.editingConsultorio = this.consultorio;
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editingConsultorio = null;
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
    this.editingConsultorio = null;
    this.saved.emit(ev);
  }
}
