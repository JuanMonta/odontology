import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Treatment,
  TreatmentCategory,
  TreatmentDraft
} from '../../../../core/models/treatment.model';
import { TREATMENT_CATEGORIES } from '../../services/treatments-http.service';
import { borradorKey } from '../../../../core/auth/session-local-storage';
import { ConsultoriosHttpService } from '../../../consultorios/services/consultorios-http.service';

const TREATMENT_FORM_DRAFT_KEY = 'saas.clinica.treatment-form.draft';

interface TreatmentFormDraft {
  name: string;
  category: TreatmentCategory;
  durationMin: number;
  price: number;
  description: string;
  active: boolean;
  consultorios: string[];
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

  @ViewChild('consPickerPanel', { static: false }) consPickerPanel?: ElementRef<HTMLElement>;

  categories = TREATMENT_CATEGORIES;

  name = '';
  category: TreatmentCategory = 'PREVENCIÓN';
  durationMin = 30;
  price = 100;
  description = '';
  active = true;
  consultorios: string[] = [];
  error = false;

  consultorios$: Observable<string[]>;
  trtPickerOpen = false;
  trtPickQuery = '';
  trtPickCategory: string | null = null;

  constructor(
    private readonly consultoriosService: ConsultoriosHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.consultorios$ = consultoriosService.consultorios$.pipe(
      map((list: any[]) => list.filter((c: any) => c.status === 'operativo').map((c: any) => c.code))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.treatment && this.treatment) {
      this.name = this.treatment.name;
      this.category = this.treatment.category;
      this.durationMin = this.treatment.durationMin;
      this.price = this.treatment.price;
      this.description = this.treatment.description;
      this.active = this.treatment.active;
      this.consultorios = [...this.treatment.consultorios];
    }
    if (changes.creating && this.creating) {
      const draft = this.readDraft();
      this.name = draft ? draft.name : '';
      this.category = draft ? draft.category : 'PREVENCIÓN';
      this.durationMin = draft ? draft.durationMin : 30;
      this.price = draft ? draft.price : 100;
      this.description = draft ? draft.description : '';
      this.active = draft ? draft.active : true;
      this.consultorios = draft ? draft.consultorios : [];
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
      active: this.active,
      consultorios: this.consultorios
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
      active: this.active,
      consultorios: this.consultorios
    };
    localStorage.setItem(borradorKey(TREATMENT_FORM_DRAFT_KEY), JSON.stringify(draft));
  }

  private readDraft(): TreatmentFormDraft | null {
    const raw = localStorage.getItem(borradorKey(TREATMENT_FORM_DRAFT_KEY));
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
    localStorage.removeItem(borradorKey(TREATMENT_FORM_DRAFT_KEY));
  }

  /* ==================== Picker de consultorios ==================== */

  trtCategorias(consultorios: string[]): { nombre: string; count: number }[] {
    return [{ nombre: 'TODOS', count: consultorios.length }];
  }

  visibleConsultorios(consultorios: string[]): string[] {
    const q = this.trtPickQuery.trim().toUpperCase();
    return consultorios.filter(c => !q || c.includes(q));
  }

  trackConsultorio(_: number, c: string): string {
    return c;
  }

  consSelected(code: string): boolean {
    return this.consultorios.includes(code);
  }

  openTrtPicker(): void {
    this.trtPickerOpen = true;
    this.trtPickQuery = '';
    this.trtPickCategory = null;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.consPickerPanel?.nativeElement.focus(), 0);
  }

  closeTrtPicker(): void {
    if (!this.trtPickerOpen) {
      return;
    }
    this.trtPickerOpen = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  onTrtPickBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeTrtPicker();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.trtPickerOpen) {
        this.closeTrtPicker();
      }
    }
  }

  onTrtPickQuery(): void {
    this.cdr.markForCheck();
  }

  consPickToggle(code: string): void {
    const idx = this.consultorios.indexOf(code);
    if (idx === -1) {
      this.consultorios = [...this.consultorios, code];
    } else {
      this.consultorios = this.consultorios.filter(c => c !== code);
    }
  }

  removeConsultorio(code: string): void {
    this.consultorios = this.consultorios.filter(c => c !== code);
  }
}