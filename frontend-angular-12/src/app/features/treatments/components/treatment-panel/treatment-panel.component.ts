import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Treatment, TreatmentDraft } from '../../../../core/models/treatment.model';

@Component({
  selector: 'app-treatment-panel',
  templateUrl: './treatment-panel.component.html',
  styleUrls: ['./treatment-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentPanelComponent implements OnChanges {
  @Input() treatment: Treatment | null = null;
  @Input() creating = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<TreatmentDraft>();
  @Output() toggle = new EventEmitter<string>();

  editing = false;
  /** Copia local del tratamiento para edición, evita parpadeo por async pipe */
  editingTreatment: Treatment | null = null;

  money(price: number): string {
    return `$ ${price.toLocaleString('en-US')}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const treatmentChange = changes.treatment;
    const creatingChange = changes.creating;

    if (creatingChange && creatingChange.currentValue) {
      this.editing = false;
      this.editingTreatment = null;
      return;
    }

    if (
      treatmentChange &&
      !treatmentChange.isFirstChange() &&
      treatmentChange.previousValue?.id !== treatmentChange.currentValue?.id
    ) {
      this.editing = false;
      this.editingTreatment = null;
    }
  }

  startEdit(): void {
    // Capturar el tratamiento ANTES de activar edición para evitar parpadeo
    this.editingTreatment = this.treatment;
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editingTreatment = null;
  }

  closeForm(): void {
    if (this.creating) {
      this.cancel.emit();
    } else {
      this.cancelEdit();
    }
  }

  onSaved(draft: TreatmentDraft): void {
    this.editing = false;
    this.editingTreatment = null;
    this.saved.emit(draft);
  }
}