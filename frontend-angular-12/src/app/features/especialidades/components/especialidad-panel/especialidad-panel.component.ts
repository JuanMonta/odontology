import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Especialidad, EspecialidadDraft } from '../../../../core/models/especialidad.model';

@Component({
  selector: 'app-especialidad-panel',
  templateUrl: './especialidad-panel.component.html',
  styleUrls: ['./especialidad-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EspecialidadPanelComponent implements OnChanges {
  @Input() especialidad: Especialidad | null = null;
  @Input() creating = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EspecialidadDraft>();
  @Output() toggle = new EventEmitter<string>();

  editing = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.especialidad || changes.creating) {
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

  onSaved(draft: EspecialidadDraft): void {
    this.editing = false;
    this.saved.emit(draft);
  }
}
