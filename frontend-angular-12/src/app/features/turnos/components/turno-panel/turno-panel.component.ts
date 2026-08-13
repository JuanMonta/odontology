import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Turno, TurnoDraft } from '../../../../core/models/turno.model';

@Component({
  selector: 'app-turno-panel',
  templateUrl: './turno-panel.component.html',
  styleUrls: ['./turno-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurnoPanelComponent implements OnChanges {
  @Input() turno: Turno | null = null;
  @Input() creating = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<TurnoDraft>();
  @Output() toggle = new EventEmitter<string>();

  editing = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.turno || changes.creating) {
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

  onSaved(draft: TurnoDraft): void {
    this.editing = false;
    this.saved.emit(draft);
  }

  jornada(): string {
    if (!this.turno) {
      return '';
    }
    return `${this.turno.horaInicio} – ${this.turno.horaFin}`;
  }

  descanso(): string {
    if (!this.turno || !this.turno.descansoInicio || !this.turno.descansoFin) {
      return 'SIN PAUSA';
    }
    return `${this.turno.descansoInicio} – ${this.turno.descansoFin}`;
  }
}
