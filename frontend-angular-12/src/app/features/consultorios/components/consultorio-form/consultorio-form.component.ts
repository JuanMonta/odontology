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
  TratamientoSimple,
  Unidad,
  Ubicacion
} from '../../services/consultorio-catalogos.service';
import { OdontologosHttpService } from '../../../odontologos/services/odontologos-http.service';
import { ConsultoriosHttpService } from '../../services/consultorios-http.service';

const EQUIPO_CATEGORIAS = ['MOBILIARIO', 'DIAGNÓSTICO', 'INSTRUMENTAL', 'CONSUMIBLES'] as const;
const TRATAMIENTO_CATEGORIAS = ['DIAGNÓSTICO', 'PREVENCIÓN', 'RESTAURADORA', 'ENDODONCIA', 'PERIODONCIA', 'ORTODONCIA', 'CIRUGÍA', 'PRÓTESIS', 'ESTÉTICA', 'EMERGENCIA'] as const;

function unidadTexto(u: Unidad): string {
  return u.nombre + ' · ' + u.tipo;
}

@Component({
  selector: 'app-consultorio-form',
  templateUrl: './consultorio-form.component.html',
  styleUrls: ['./consultorio-form.component.css', '../../../../shared/styles/cat-inline.css'],
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
  unidadesTodos$: Observable<Unidad[]>;
  ubicacionesTodos$: Observable<Ubicacion[]>;

  name = '';
  unit = '';
  location = '';
  equipment: string[] = [];
  tratamientos: string[] = [];
  status: ConsultorioStatus = 'operativo';
  error = false;

  creandoUnidad = false;
  nuevaUnidad = '';
  nuevoTipoUnidad = 'SILLÓN';

  editandoUnidad = false;
  editarUnidadCodigo = '';
  editarUnidadNombre = '';
  editarUnidadTipo = 'SILLÓN';
  editarUnidadActivo = true;
  editarUnidadError = '';
  editarUnidadTextoAnterior = '';

  creandoUbicacion = false;
  nuevaUbicacion = '';

  editandoUbicacion = false;
  editarUbicacionCodigo = '';
  editarUbicacionNombre = '';
  editarUbicacionActivo = true;
  editarUbicacionError = '';
  editarUbicacionNombreAnterior = '';

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

  reassignTarget: Odontologo | null = null;

  private syncedId: string | null = null;
  private catalogosLoaded = false;

  constructor(
    private readonly catalogos: ConsultorioCatalogosService,
    private readonly consultorios: ConsultoriosHttpService,
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
    this.unidadesTodos$ = catalogos.unidades$;
    this.ubicacionesTodos$ = catalogos.ubicaciones$;
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
    if (this.isAssignedElsewhere(o)) {
      this.reassignTarget = o;
      return;
    }
    this.assigned = this.assigned.includes(o.code)
      ? this.assigned.filter(c => c !== o.code)
      : [...this.assigned, o.code];
  }

  isAssignedElsewhere(o: Odontologo): boolean {
    return !!o.consultorio && o.consultorio !== this.consultorio?.code && !this.assigned.includes(o.code);
  }

  consultorioName(code: string): string {
    if (!code) { return '—'; }
    const c = this.consultorios.snapshot().find(x => x.code === code);
    return c ? c.name : code;
  }

  confirmReassign(): void {
    if (!this.reassignTarget) { return; }
    this.assigned = [...this.assigned, this.reassignTarget.code];
    this.reassignTarget = null;
  }

  cancelReassign(): void {
    this.reassignTarget = null;
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

  /* ==================== Catálogo de unidades (CREAR / EDITAR) ==================== */

  toggleCrearUnidad(): void {
    this.creandoUnidad = !this.creandoUnidad;
    if (this.creandoUnidad) {
      this.editandoUnidad = false;
      this.editarUnidadError = '';
    }
    this.cdr.markForCheck();
  }

  onCrearUnidad(): void {
    const nombre = this.nuevaUnidad.trim().toUpperCase();
    if (!nombre) {
      return;
    }
    this.catalogos.addUnidad({ nombre, tipo: this.nuevoTipoUnidad }).subscribe({
      next: creada => {
        this.unit = unidadTexto(creada);
        this.nuevaUnidad = '';
        this.creandoUnidad = false;
        this.cdr.markForCheck();
      }
    });
  }

  onEditarUnidad(): void {
    if (this.editandoUnidad) {
      this.cancelarEdicionUnidad();
      return;
    }
    this.creandoUnidad = false;
    const actual = this.catalogos.snapshotUnidades().find(
      u => unidadTexto(u) === this.unit || u.nombre === this.unit
    );
    if (!actual) {
      this.editarUnidadError = 'SELECCIONA UNA UNIDAD PARA EDITARLA';
      this.editandoUnidad = true;
      this.cdr.markForCheck();
      return;
    }
    this.editarUnidadCodigo = actual.code;
    this.editarUnidadNombre = actual.nombre;
    this.editarUnidadTipo = actual.tipo;
    this.editarUnidadActivo = actual.activo;
    this.editarUnidadTextoAnterior = unidadTexto(actual);
    this.editarUnidadError = '';
    this.editandoUnidad = true;
    this.cdr.markForCheck();
  }

  guardarUnidad(): void {
    const nombre = this.editarUnidadNombre.trim().toUpperCase();
    if (!nombre) {
      this.editarUnidadError = 'EL NOMBRE DE LA UNIDAD ES OBLIGATORIO';
      this.cdr.markForCheck();
      return;
    }
    this.editarUnidadError = '';
    const textoAnterior = this.editarUnidadTextoAnterior;
    this.catalogos.updateUnidad({
      id: this.editarUnidadCodigo,
      code: this.editarUnidadCodigo,
      nombre,
      tipo: this.editarUnidadTipo,
      activo: this.editarUnidadActivo
    }).subscribe({
      next: () => {
        if (textoAnterior && this.unit === textoAnterior) {
          this.unit = unidadTexto({ id: '', code: '', nombre, tipo: this.editarUnidadTipo, activo: this.editarUnidadActivo });
        }
        this.editandoUnidad = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        const body = err as { error?: { message?: string } };
        this.editarUnidadError = body?.error?.message || 'NO SE PUDO ACTUALIZAR LA UNIDAD';
        this.cdr.markForCheck();
      }
    });
  }

  cancelarEdicionUnidad(): void {
    this.editandoUnidad = false;
    this.editarUnidadError = '';
    this.cdr.markForCheck();
  }

  /* ==================== Catálogo de ubicaciones (CREAR / EDITAR) ==================== */

  toggleCrearUbicacion(): void {
    this.creandoUbicacion = !this.creandoUbicacion;
    if (this.creandoUbicacion) {
      this.editandoUbicacion = false;
      this.editarUbicacionError = '';
    }
    this.cdr.markForCheck();
  }

  onCrearUbicacion(): void {
    const nombre = this.nuevaUbicacion.trim().toUpperCase();
    if (!nombre) {
      return;
    }
    this.catalogos.addUbicacion({ nombre }).subscribe({
      next: creada => {
        this.location = creada.nombre;
        this.nuevaUbicacion = '';
        this.creandoUbicacion = false;
        this.cdr.markForCheck();
      }
    });
  }

  onEditarUbicacion(): void {
    if (this.editandoUbicacion) {
      this.cancelarEdicionUbicacion();
      return;
    }
    this.creandoUbicacion = false;
    const actual = this.catalogos.snapshotUbicaciones().find(u => u.nombre === this.location);
    if (!actual) {
      this.editarUbicacionError = 'SELECCIONA UNA UBICACIÓN PARA EDITARLA';
      this.editandoUbicacion = true;
      this.cdr.markForCheck();
      return;
    }
    this.editarUbicacionCodigo = actual.code;
    this.editarUbicacionNombre = actual.nombre;
    this.editarUbicacionActivo = actual.activo;
    this.editarUbicacionNombreAnterior = actual.nombre;
    this.editarUbicacionError = '';
    this.editandoUbicacion = true;
    this.cdr.markForCheck();
  }

  guardarUbicacion(): void {
    const nombre = this.editarUbicacionNombre.trim().toUpperCase();
    if (!nombre) {
      this.editarUbicacionError = 'EL NOMBRE DE LA UBICACIÓN ES OBLIGATORIO';
      this.cdr.markForCheck();
      return;
    }
    this.editarUbicacionError = '';
    const nombreAnterior = this.editarUbicacionNombreAnterior;
    this.catalogos.updateUbicacion({
      id: this.editarUbicacionCodigo,
      code: this.editarUbicacionCodigo,
      nombre,
      activo: this.editarUbicacionActivo
    }).subscribe({
      next: () => {
        if (nombreAnterior && this.location === nombreAnterior) {
          this.location = nombre;
        }
        this.editandoUbicacion = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        const body = err as { error?: { message?: string } };
        this.editarUbicacionError = body?.error?.message || 'NO SE PUDO ACTUALIZAR LA UBICACIÓN';
        this.cdr.markForCheck();
      }
    });
  }

  cancelarEdicionUbicacion(): void {
    this.editandoUbicacion = false;
    this.editarUbicacionError = '';
    this.cdr.markForCheck();
  }
}
