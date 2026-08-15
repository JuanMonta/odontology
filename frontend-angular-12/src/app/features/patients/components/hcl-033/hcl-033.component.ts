import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { Patient, Tooth } from '../../../../core/models/patient.model';
import {
  ANTECEDENTES_033,
  DIENTES_IHOS,
  Hcl,
  HclDiagnosticoCie,
  HclRegionExamen,
  HclSesion,
  REGIONES_ESTOMATOGNATICAS,
  SEXTO_SECTANTES,
  crearHclVacia,
  grupoEtario,
  hclCompleta
} from '../../../../core/models/hcl.model';
import { HclHttpService } from '../../services/hcl-http.service';

interface Seccion033 {
  n: number;
  titulo: string;
}

type EstadoGuardado = 'idle' | 'ok' | 'error';

@Component({
  selector: 'app-hcl-033',
  templateUrl: './hcl-033.component.html',
  styleUrls: ['./hcl-033.component.css']
})
export class Hcl033Component implements OnInit, OnDestroy {
  @Input() patient: Patient | null = null;
  @Input() teeth: Tooth[] = [];
  @Output() toothChange = new EventEmitter<Tooth[]>();

  hc: Hcl = crearHclVacia('');
  seccion = 1;
  cargando = false;
  guardando = false;
  estado: EstadoGuardado = 'idle';
  mensaje: string | null = null;

  readonly secciones: Seccion033[] = [
    { n: 1, titulo: 'MOTIVO DE CONSULTA' },
    { n: 2, titulo: 'PROBLEMA ACTUAL' },
    { n: 3, titulo: 'ANTECEDENTES' },
    { n: 4, titulo: 'SIGNOS VITALES' },
    { n: 5, titulo: 'EXAMEN ESTOMATOGNÁTICO' },
    { n: 6, titulo: 'ODONTOGRAMA' },
    { n: 7, titulo: 'SALUD BUCAL' },
    { n: 8, titulo: 'ÍNDICES CPO-ceo' },
    { n: 10, titulo: 'PLANES' },
    { n: 11, titulo: 'DIAGNÓSTICO CIE' },
    { n: 12, titulo: 'TRATAMIENTO' }
  ];

  /** El form033 imprime hasta 9 filas de sesiones; el botón no agrega más allá. */
  readonly maxSesiones = 9;

  readonly regiones = REGIONES_ESTOMATOGNATICAS;
  readonly antecedentes = ANTECEDENTES_033;
  readonly sextantes = SEXTO_SECTANTES;
  readonly dientesIhos = DIENTES_IHOS;

  private readonly sub = new Subscription();

  constructor(
    private readonly hclService: HclHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.patient) {
      this.cargar();
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private cargar(): void {
    if (!this.patient) {
      return;
    }
    this.cargando = true;
    this.mensaje = null;
    this.sub.add(
      this.hclService.get(this.patient.id).subscribe({
        next: hc => {
          this.hc = hclCompleta(this.patient?.id ?? '', hc);
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.hc = crearHclVacia(this.patient?.id ?? '');
          this.cargando = false;
          this.estado = 'error';
          this.mensaje = 'NO SE PUDO CARGAR LA HISTORIA CLÍNICA';
          this.cdr.markForCheck();
        }
      })
    );
  }

  guardar(): void {
    if (!this.patient || this.guardando) {
      return;
    }
    this.guardando = true;
    this.estado = 'idle';
    this.mensaje = null;
    this.sub.add(
      this.hclService.save(this.patient.id, this.hc).subscribe({
        next: hc => {
          this.hc = hclCompleta(this.patient?.id ?? '', hc);
          this.guardando = false;
          this.estado = 'ok';
          this.mensaje = 'HISTORIA CLÍNICA GUARDADA';
          this.cdr.markForCheck();
        },
        error: () => {
          this.guardando = false;
          this.estado = 'error';
          this.mensaje = 'NO SE PUDO GUARDAR — REVISE LA CONEXIÓN';
          this.cdr.markForCheck();
        }
      })
    );
  }

  onTooth(teeth: Tooth[]): void {
    this.toothChange.emit(teeth);
  }

  cambiarSeccion(n: number): void {
    this.seccion = n;
  }

  agregarSesion(): void {
    if (this.hc.sesiones.length >= this.maxSesiones) {
      return;
    }
    const prox = this.hc.sesiones.reduce((m, s) => Math.max(m, s.sesion || 0), 0) + 1;
    this.hc.sesiones = [
      ...this.hc.sesiones,
      {
        sesion: prox,
        fecha: '',
        diagnosticos: '',
        procedimientos: '',
        prescripciones: '',
        codigo: ''
      }
    ];
  }

  quitarSesion(i: number): void {
    if (this.hc.sesiones.length <= 1) {
      return;
    }
    this.hc.sesiones = this.hc.sesiones.filter((_, idx) => idx !== i);
  }

  antVal(key: string): boolean {
    return (this.hc as unknown as Record<string, boolean>)[key] ?? false;
  }

  toggleAnt(key: string): void {
    const target = this.hc as unknown as Record<string, boolean>;
    target[key] = !(target[key] ?? false);
  }

  grupo(): string {
    return grupoEtario(this.patient?.age ?? 0);
  }

  /** Totales por columna del índice CPO-ceo. */
  cpoTotales(): { c: number; p: number; o: number; ce: number; ee: number; oe: number } {
    const suma = (arr: (number | null)[]): number => arr.reduce<number>((s, v) => s + (v ?? 0), 0);
    const perm = this.hc.indicesCpo?.permanente ?? [];
    const dec = this.hc.indicesCpo?.deciduo ?? [];
    return {
      c: suma(perm.map(i => i.c)),
      p: suma(perm.map(i => i.p)),
      o: suma(perm.map(i => i.o)),
      ce: suma(dec.map(i => i.c)),
      ee: suma(dec.map(i => i.e)),
      oe: suma(dec.map(i => i.o))
    };
  }
}