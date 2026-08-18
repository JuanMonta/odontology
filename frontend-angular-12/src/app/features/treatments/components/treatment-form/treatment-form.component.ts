import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Treatment,
  TreatmentCategory,
  TreatmentDraft
} from '../../../../core/models/treatment.model';
import { Consultorio } from '../../../../core/models/consultorio.model';
import { CategoriasHttpService, Categoria } from '../../services/categorias-http.service';
import { borradorKey } from '../../../../core/auth/session-local-storage';
import { ConsultoriosHttpService } from '../../../consultorios/services/consultorios-http.service';

const TREATMENT_FORM_DRAFT_KEY = 'saas.clinica.treatment-form.draft';

interface TreatmentFormDraft {
  name: string;
  categoryCode: string;
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

  creandoCategoria = false;
  nuevaCategoria = '';

  editandoCategoria = false;
  editarCodigo = '';
  editarNombre = '';
  editarActivo = true;
  editarError = '';

  name = '';
  categoryCode = '';
  durationMin = 30;
  price = 100;
  description = '';
  active = true;
  consultorios: string[] = [];
  error = false;

  consultorios$: Observable<Consultorio[]>;
  trtPickerOpen = false;
  trtPickQuery = '';
  trtPickCategory: string | null = null;

  categories$: Observable<Categoria[]>;

  constructor(
    private readonly consultoriosService: ConsultoriosHttpService,
    private readonly categoriasService: CategoriasHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.categories$ = categoriasService.categorias$.pipe(
      map(list => list.filter(c => c.activo))
    );
    this.consultorios$ = consultoriosService.consultorios$.pipe(
      map((list: Consultorio[]) =>
        list
          .filter((c: Consultorio) => c.status !== 'inactivo')
          .sort((a: Consultorio, b: Consultorio) => a.name.localeCompare(b.name))
      )
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.treatment && this.treatment) {
      this.name = this.treatment.name;
      this.categoryCode = this.treatment.categoryCode;
      this.durationMin = this.treatment.durationMin;
      this.price = this.treatment.price;
      this.description = this.treatment.description;
      this.active = this.treatment.active;
      this.consultorios = [...this.treatment.consultorios];
    }
    if (changes.creating && this.creating) {
      const draft = this.readDraft();
      this.name = draft ? draft.name : '';
      this.categoryCode = draft ? draft.categoryCode : '';
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
      categoryCode: this.categoryCode,
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
      categoryCode: this.categoryCode,
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
      return parsed.categoryCode &&
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

  onCrearCategoria(): void {
    const nombre = this.nuevaCategoria.trim().toUpperCase();
    if (!nombre) {
      return;
    }
    this.categoriasService.addCategoria({ nombre }).subscribe({
      next: (creada) => {
        this.categoryCode = creada.code;
        this.nuevaCategoria = '';
        this.creandoCategoria = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleCrearCategoria(): void {
    this.creandoCategoria = !this.creandoCategoria;
    if (this.creandoCategoria) {
      this.editandoCategoria = false;
      this.editarError = '';
    }
    this.cdr.markForCheck();
  }

  onEditarCategoria(): void {
    if (this.editandoCategoria) {
      this.cancelarEdicion();
      return;
    }
    this.creandoCategoria = false;
    const actual = this.categoriasService.snapshot().find(c => c.code === this.categoryCode);
    if (!actual) {
      this.editarError = 'SELECCIONA UNA CATEGORÍA PARA EDITARLA';
      this.editandoCategoria = true;
      this.cdr.markForCheck();
      return;
    }
    this.editarCodigo = actual.code;
    this.editarNombre = actual.nombre;
    this.editarActivo = actual.activo;
    this.editarError = '';
    this.editandoCategoria = true;
    this.cdr.markForCheck();
  }

  guardarCategoria(): void {
    const nombre = this.editarNombre.trim().toUpperCase();
    if (!nombre) {
      this.editarError = 'EL NOMBRE DE LA CATEGORÍA ES OBLIGATORIO';
      this.cdr.markForCheck();
      return;
    }
    this.editarError = '';
    this.categoriasService.updateCategoria({
      id: this.editarCodigo,
      code: this.editarCodigo,
      nombre,
      activo: this.editarActivo
    }).subscribe({
      next: () => {
        this.editandoCategoria = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        const body = err as { error?: { message?: string } };
        this.editarError = body?.error?.message || 'NO SE PUDO ACTUALIZAR LA CATEGORÍA';
        this.cdr.markForCheck();
      }
    });
  }

  cancelarEdicion(): void {
    this.editandoCategoria = false;
    this.editarError = '';
    this.cdr.markForCheck();
  }

  /* ==================== Picker de consultorios ==================== */

  visibleConsultorios(consultorios: Consultorio[]): Consultorio[] {
    const q = this.trtPickQuery.trim().toUpperCase();
    return consultorios.filter(c => !q || c.name.toUpperCase().includes(q) || c.code.toUpperCase().includes(q));
  }

  trackConsultorio(_: number, c: Consultorio): string {
    return c.code;
  }

  consSelected(code: string): boolean {
    return this.consultorios.includes(code);
  }

  assignedConsultorios(consultorios: Consultorio[]): Consultorio[] {
    return consultorios.filter(c => this.consultorios.includes(c.code));
  }

  openTrtPicker(): void {
    this.consultoriosService.refresh();
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

  consPickToggle(c: Consultorio): void {
    const idx = this.consultorios.indexOf(c.code);
    if (idx === -1) {
      this.consultorios = [...this.consultorios, c.code];
    } else {
      this.consultorios = this.consultorios.filter(x => x !== c.code);
    }
  }

  removeConsultorio(code: string): void {
    this.consultorios = this.consultorios.filter(x => x !== code);
  }
}