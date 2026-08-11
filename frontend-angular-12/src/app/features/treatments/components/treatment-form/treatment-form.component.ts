import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  Treatment,
  TreatmentCategory,
  TreatmentDraft
} from '../../../../core/models/treatment.model';
import { TREATMENT_CATEGORIES } from '../../services/treatments-http.service';

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
      this.name = '';
      this.category = 'PREVENCIÓN';
      this.durationMin = 30;
      this.price = 100;
      this.description = '';
      this.active = true;
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
}
