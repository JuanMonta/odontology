import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Consultorio, ConsultorioDraft, ConsultorioStatus } from '../../../../core/models/consultorio.model';

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
  @Output() saved = new EventEmitter<ConsultorioDraft>();
  @Output() toggle = new EventEmitter<string>();

  editing = false;

  statusLabel = consultorioStatusLabel;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.consultorio || changes.creating) {
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

  onSaved(draft: ConsultorioDraft): void {
    this.editing = false;
    this.saved.emit(draft);
  }
}
