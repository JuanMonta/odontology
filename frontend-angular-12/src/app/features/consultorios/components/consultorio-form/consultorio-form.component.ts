import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Consultorio,
  ConsultorioSaveEvent,
  ConsultorioStatus
} from '../../../../core/models/consultorio.model';
import { Odontologo } from '../../../../core/models/odontologo.model';
import {
  ConsultorioCatalogosService,
  ConsultorioCatalogos,
  ConsultorioEquipoCatalogo,
  TratamientoSimple
} from '../../services/consultorio-catalogos.service';
import { OdontologosHttpService } from '../../../odontologos/services/odontologos-http.service';

const EQUIPO_CATEGORIAS = ['MOBILIARIO', 'DIAGNÓSTICO', 'INSTRUMENTAL', 'CONSUMIBLES'] as const;
const TRATAMIENTO_CATEGORIAS = ['DIAGNÓSTICO', 'PREVENCIÓN', 'RESTAURADORA', 'ENDODONCIA', 'PERIODONCIA', 'ORTODONCIA', 'CIRUGÍA', 'PRÓTESIS', 'ESTÉTICA', 'EMERGENCIA'] as const;

@Component({
  selector: 'app-consultorio-form',
  templateUrl: './consultorio-form.component.html',
  styleUrls: ['./consultorio-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultorioFormComponent implements OnChanges, OnDestroy {
  @Input() consultorio: Consultorio | null = null;
  @Output() saved = new EventEmitter<ConsultorioSaveEvent>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('pickerPanel', { static: false }) pickerPanel?: ElementRef<HTMLElement>;
  @ViewChild('staffPickerPanel', { static: false }) staffPickerPanel?: ElementRef<HTMLElement>;
  @ViewChild('trtPickerPanel', { static: false }) trtPickerPanel?: ElementRef<HTMLElement>;

  statuses: ConsultorioStatus[] = ['operativo', 'mantenimiento', 'inactivo'];

  unidades$: Observable<string[]>;
  ubicaciones$: Observable<string[]>;
  equipos$: Observable<ConsultorioEquipoCatalogo[]>;
  tratamientos$: Observable<TratamientoSimple[]>;
  odontologos$: Observable<Odontologo[]>;

  name = '';
  unit = '';
  location = '';
  equipment: string[] = [];
  tratamientos: string[] = [];
  status: ConsultorioStatus = 'operativo';
  error = false;

  /** Códigos de odontólogos asignados a esta sala. */
  assigned: string[] = [];

  pickerOpen = false;
  pickQuery = '';
  pickCategory: string | null = null;

  staffPickerOpen = false;
  staffQuery = '';
  staffCategory: string | null = null;

  trtPickerOpen = false;
  trtPickQuery = '';
  trtPickCategory: string | null = null;

  private syncedId: string | null = null;
  private catalogosLoaded = false;

  constructor(
    private readonly catalogos: ConsultorioCatalogosService,
    odontologos: OdontologosHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.unidades$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.unidades));
    this.ubicaciones$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.ubicaciones));
    this.equipos$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.equipos));
    this.tratamientos$ = catalogos.catalogos$.pipe(
      map((c: ConsultorioCatalogos) => {
        this.catalogosLoaded = c.tratamientos.length > 0;
        return c.tratamientos;
      })
    );
    this.odontologos$ = odontologos.odontologos$.pipe(
      map(list => list.filter(o => o.status !== 'inactivo'))
    );
  }

  ngOnInit(): void {
    // Fuerza refresh si los catálogos no tienen tratamientos (ej. backend tardó en arrancar)
    if (!this.catalogosLoaded) {
      console.log('[ConsultorioForm] Catálogos vacíos, forzando refresh...');
      this.catalogos.refresh();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.consultorio && this.consultorio && this.consultorio.id !== this.syncedId) {
      this.syncedId = this.consultorio.id;
      this.name = this.consultorio.name;
      this.unit = this.consultorio.unit;
      this.location = this.consultorio.location;
      this.equipment = [...this.consultorio.equipment];
      this.tratamientos = [...this.consultorio.tratamientos];
      this.status = this.consultorio.status;
      this.assigned = this.consultorio.staff.map(s => s.code);
      this.error = false;
    }
  }

  ngOnDestroy(): void {
    if (this.pickerOpen || this.staffPickerOpen) {
      document.body.style.overflow = '';
    }
  }

  categorias(equipos: ConsultorioEquipoCatalogo[]): { nombre: string; count: number }[] {
    const presentes = new Map<string, number>();
    for (const e of equipos) {
      presentes.set(e.categoria, (presentes.get(e.categoria) ?? 0) + 1);
    }
    return EQUIPO_CATEGORIAS
      .filter(c => presentes.has(c))
      .map(c => ({ nombre: c, count: presentes.get(c) ?? 0 }));
  }

  visibleEquipos(equipos: ConsultorioEquipoCatalogo[]): ConsultorioEquipoCatalogo[] {
    const q = this.pickQuery.trim().toUpperCase();
    return equipos.filter(e => {
      const matchesCategoria = !this.pickCategory || e.categoria === this.pickCategory;
      const matchesBusqueda = !q || e.nombre.toUpperCase().includes(q);
      return matchesCategoria && matchesBusqueda;
    });
  }

  trackEquipo(_: number, item: ConsultorioEquipoCatalogo): string {
    return item.codigo;
  }

  selected(nombre: string): boolean {
    return this.equipment.includes(nombre);
  }

  openPicker(): void {
    this.pickerOpen = true;
    this.pickQuery = '';
    this.pickCategory = null;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.pickerPanel?.nativeElement.focus(), 0);
  }

  closePicker(): void {
    if (!this.pickerOpen) {
      return;
    }
    this.pickerOpen = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  onPickBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closePicker();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.staffPickerOpen) {
        this.closeStaffPicker();
      } else if (this.pickerOpen) {
        this.closePicker();
      }
    }
  }

  onPickQuery(): void {
    this.cdr.markForCheck();
  }

  pickToggle(item: ConsultorioEquipoCatalogo): void {
    const idx = this.equipment.indexOf(item.nombre);
    if (idx === -1) {
      this.equipment = [...this.equipment, item.nombre];
    } else {
      this.equipment = this.equipment.filter(n => n !== item.nombre);
    }
  }

  removeEquipo(nombre: string): void {
    this.equipment = this.equipment.filter(n => n !== nombre);
  }

  /* ==================== Picker de tratamientos ==================== */

  trtCategorias(tratamientos: TratamientoSimple[]): { nombre: string; count: number }[] {
    const presentes = new Map<string, number>();
    for (const t of tratamientos) {
      presentes.set(t.category, (presentes.get(t.category) ?? 0) + 1);
    }
    return TRATAMIENTO_CATEGORIAS
      .filter(c => presentes.has(c))
      .map(c => ({ nombre: c, count: presentes.get(c) ?? 0 }));
  }

  visibleTratamientos(tratamientos: TratamientoSimple[]): TratamientoSimple[] {
    const q = this.trtPickQuery.trim().toUpperCase();
    return tratamientos.filter(t => {
      const matchesCategoria = !this.trtPickCategory || t.category === this.trtPickCategory;
      const matchesBusqueda = !q || t.name.toUpperCase().includes(q) || t.code.toUpperCase().includes(q);
      return matchesCategoria && matchesBusqueda;
    });
  }

  trackTratamiento(_: number, t: TratamientoSimple): string {
    return t.code;
  }

  trtSelected(code: string): boolean {
    return this.tratamientos.includes(code);
  }

  assignedTratamientos(tratamientos: TratamientoSimple[]): TratamientoSimple[] {
    return tratamientos.filter(t => this.tratamientos.includes(t.code));
  }

  openTrtPicker(): void {
    this.trtPickerOpen = true;
    this.trtPickQuery = '';
    this.trtPickCategory = null;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.trtPickerPanel?.nativeElement.focus(), 0);
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

  onTrtPickQuery(): void {
    this.cdr.markForCheck();
  }

  trtPickToggle(t: TratamientoSimple): void {
    const idx = this.tratamientos.indexOf(t.code);
    if (idx === -1) {
      this.tratamientos = [...this.tratamientos, t.code];
    } else {
      this.tratamientos = this.tratamientos.filter(c => c !== t.code);
    }
  }

  removeTratamiento(code: string): void {
    this.tratamientos = this.tratamientos.filter(c => c !== code);
  }

  /* ==================== Picker de profesionales ==================== */

  staffCategorias(odontologos: Odontologo[]): { nombre: string; count: number }[] {
    const presentes = new Map<string, number>();
    for (const o of odontologos) {
      presentes.set(o.specialty, (presentes.get(o.specialty) ?? 0) + 1);
    }
    return [...presentes.entries()].map(([nombre, count]) => ({ nombre, count }));
  }

  visibleStaff(odontologos: Odontologo[]): Odontologo[] {
    const q = this.staffQuery.trim().toUpperCase();
    return odontologos.filter(o => {
      const matchesCategoria = !this.staffCategory || o.specialty === this.staffCategory;
      const matchesBusqueda = !q || o.name.toUpperCase().includes(q) || o.code.toUpperCase().includes(q);
      return matchesCategoria && matchesBusqueda;
    });
  }

  assignedStaff(odontologos: Odontologo[]): Odontologo[] {
    return odontologos.filter(o => this.assigned.includes(o.code));
  }

  isAssigned(code: string): boolean {
    return this.assigned.includes(code);
  }

  trackOdontologo(_: number, o: Odontologo): string {
    return o.code;
  }

  openStaffPicker(): void {
    this.staffPickerOpen = true;
    this.staffQuery = '';
    this.staffCategory = null;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.staffPickerPanel?.nativeElement.focus(), 0);
  }

  closeStaffPicker(): void {
    if (!this.staffPickerOpen) {
      return;
    }
    this.staffPickerOpen = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  onStaffPickBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeStaffPicker();
    }
  }

  onStaffQuery(): void {
    this.cdr.markForCheck();
  }

  staffToggle(o: Odontologo): void {
    this.assigned = this.assigned.includes(o.code)
      ? this.assigned.filter(c => c !== o.code)
      : [...this.assigned, o.code];
  }

  removeStaff(code: string): void {
    this.assigned = this.assigned.filter(c => c !== code);
  }

  onSubmit(): void {
    if (!this.name.trim() || !this.unit || !this.location) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft = {
      name: this.name.trim().toUpperCase(),
      unit: this.unit,
      location: this.location,
      equipment: this.equipment,
      tratamientos: this.tratamientos,
      status: this.status
    };
    this.saved.emit({ draft, assigned: [...this.assigned] });
  }
}
