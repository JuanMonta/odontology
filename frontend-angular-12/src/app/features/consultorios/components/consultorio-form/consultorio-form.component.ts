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
import { Consultorio, ConsultorioDraft, ConsultorioStatus } from '../../../../core/models/consultorio.model';
import {
  ConsultorioCatalogosService,
  ConsultorioCatalogos,
  ConsultorioEquipoCatalogo
} from '../../services/consultorio-catalogos.service';

const EQUIPO_CATEGORIAS = ['MOBILIARIO', 'DIAGNÓSTICO', 'INSTRUMENTAL', 'CONSUMIBLES'] as const;

@Component({
  selector: 'app-consultorio-form',
  templateUrl: './consultorio-form.component.html',
  styleUrls: ['./consultorio-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultorioFormComponent implements OnChanges, OnDestroy {
  @Input() consultorio: Consultorio | null = null;
  @Output() saved = new EventEmitter<ConsultorioDraft>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('pickerPanel', { static: false }) pickerPanel?: ElementRef<HTMLElement>;

  statuses: ConsultorioStatus[] = ['operativo', 'mantenimiento', 'inactivo'];

  unidades$: Observable<string[]>;
  ubicaciones$: Observable<string[]>;
  equipos$: Observable<ConsultorioEquipoCatalogo[]>;

  name = '';
  unit = '';
  location = '';
  equipment: string[] = [];
  status: ConsultorioStatus = 'operativo';
  error = false;

  pickerOpen = false;
  pickQuery = '';
  pickCategory: string | null = null;

  private syncedId: string | null = null;

  constructor(catalogos: ConsultorioCatalogosService, private readonly cdr: ChangeDetectorRef) {
    this.unidades$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.unidades));
    this.ubicaciones$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.ubicaciones));
    this.equipos$ = catalogos.catalogos$.pipe(map((c: ConsultorioCatalogos) => c.equipos));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.consultorio && this.consultorio && this.consultorio.id !== this.syncedId) {
      this.syncedId = this.consultorio.id;
      this.name = this.consultorio.name;
      this.unit = this.consultorio.unit;
      this.location = this.consultorio.location;
      this.equipment = [...this.consultorio.equipment];
      this.status = this.consultorio.status;
      this.error = false;
    }
  }

  ngOnDestroy(): void {
    if (this.pickerOpen) {
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
    if (this.pickerOpen && event.key === 'Escape') {
      this.closePicker();
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

  onSubmit(): void {
    if (!this.name.trim() || !this.unit || !this.location) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: ConsultorioDraft = {
      name: this.name.trim().toUpperCase(),
      unit: this.unit,
      location: this.location,
      equipment: this.equipment,
      status: this.status
    };
    this.saved.emit(draft);
  }
}
