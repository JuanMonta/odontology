import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  Treatment,
  TreatmentCategory,
  TreatmentDraft
} from '../../../../core/models/treatment.model';
import { TREATMENT_CATEGORIES } from '../../services/treatments-http.service';

const TREATMENT_FORM_DRAFT_KEY = 'saas.clinica.treatment-form.draft';

interface TreatmentFormDraft {
  name: string;
  category: TreatmentCategory;
  durationMin: number;
  price: number;
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-treatment-form',
  templateUrl: './treatment-form.component.html',
  styleUrls: ['./treatment-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentFormComponent implements OnChanges {
  @Input() treatment: Treatment | null = null;
  @Input() creating = false;
  @Output() saved = new EventEmitter<TreatmentDraft>();
  @Output() cancel = new EventEmitter<void>();

  categories = TREATMENT_CATEGORIES;

  name = '';
  category: TreatmentCategory = 'PREVENCIÓN';
  durationMin = 30;
  price = 100;
  description = '';
  active = true;
  error = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.treatment && this.treatment) {
      this.name = this.treatment.name;
      this.category = this.treatment.category;
      this.durationMin = this.treatment.durationMin;
      this.price = this.treatment.price;
      this.description = this.treatment.description;
      this.active = this.treatment.active;
    }
    if (changes.creating && this.creating) {
      const draft = this.readDraft();
      this.name = draft ? draft.name : '';
      this.category = draft ? draft.category : 'PREVENCIÓN';
      this.durationMin = draft ? draft.durationMin : 30;
      this.price = draft ? draft.price : 100;
      this.description = draft ? draft.description : '';
      this.active = draft ? draft.active : true;
    }
    if (changes.treatment || changes.creating) {
      this.error = false;
    }
  }

  onSubmit(): void {
    if (!this.name.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    if (this.creating && !this.treatment) {
      this.clearDraft();
    }
    const draft: TreatmentDraft = {
      name: this.name.trim().toUpperCase(),
      category: this.category,
      durationMin: Math.max(5, Math.round(this.durationMin || 0)),
      price: Math.max(0, Math.round(this.price || 0)),
      description: this.description.trim().toUpperCase(),
      active: this.active
    };
    this.saved.emit(draft);
  }

  onCancel(): void {
    if (this.creating && !this.treatment) {
      this.clearDraft();
    }
    this.cancel.emit();
  }

  persistDraft(): void {
    if (!this.creating || !!this.treatment) {
      return;
    }
    const draft: TreatmentFormDraft = {
      name: this.name,
      category: this.category,
      durationMin: this.durationMin,
      price: this.price,
      description: this.description,
      active: this.active
    };
    localStorage.setItem(TREATMENT_FORM_DRAFT_KEY, JSON.stringify(draft));
  }

  private readDraft(): TreatmentFormDraft | null {
    const raw = localStorage.getItem(TREATMENT_FORM_DRAFT_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as TreatmentFormDraft;
      return parsed.category &&
        TREATMENT_CATEGORIES.includes(parsed.category) &&
        typeof parsed.durationMin === 'number' &&
        typeof parsed.price === 'number'
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  private clearDraft(): void {
    localStorage.removeItem(TREATMENT_FORM_DRAFT_KEY);
  }
}
