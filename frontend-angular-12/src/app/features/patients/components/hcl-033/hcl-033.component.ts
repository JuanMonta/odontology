import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Patient, Tooth } from '../../../../core/models/patient.model';
import {
  ANTECEDENTES_033,
  DIENTES_IHOS,
  Hcl,
  HclDiagnosticoCie,
  HclRegionExamen,
  HclSesion,
  HojaResumen,
  REGIONES_ESTOMATOGNATICAS,
  SEXTO_SECTANTES,
  crearHclVacia,
  grupoEtario,
  hclCompleta
} from '../../../../core/models/hcl.model';
import { HclHttpService } from '../../services/hcl-http.service';
import { PROCEDIMIENTOS_ODONTOLOGICOS } from '../../../../core/models/procedimientos-odontologicos';

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
  hojas: HojaResumen[] = [];
  seccion = 1;
  cargando = false;
  guardando = false;
  estado: EstadoGuardado = 'idle';
  mensaje: string | null = null;

  /** Estado persistido de la última carga/guardado: de él derivan los sellos,
   *  no del modelo vivo {@link hc}. Al iniciar el tratamiento (sesión 1 con
   *  datos registrados) se sella la evaluación inicial y la identidad; cada
   *  sesión que ya tiene contenido queda bloqueada. */
  private snapshot: Hcl | null = null;

  get sellada(): boolean {
    const s1 = this.snapshot?.sesiones?.[0];
    return !!s1 && this.sesionTieneDatos(s1);
  }

  sesionBloqueada(n: number): boolean {
    const s = this.snapshot?.sesiones?.find(x => x.sesion === n);
    return !!s && this.sesionTieneDatos(s);
  }

  sesionTieneDatos(s: HclSesion): boolean {
    return !!(s.fecha || s.diagnosticos || s.procedimientos || s.prescripciones || s.proximaCita || s.codigo);
  }

  get hojasSelector(): HojaResumen[] {
    const lista = this.hojas.length
      ? this.hojas
      : [{ hoja: 1, fechaApertura: null, fechaControl: null, actualizadaEn: null }];
    if (!lista.some(h => h.hoja === this.hc.hoja)) {
      return [...lista, { hoja: this.hc.hoja, fechaApertura: null, fechaControl: null, actualizadaEn: null }]
        .sort((a, b) => a.hoja - b.hoja);
    }
    return lista;
  }

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

  readonly regiones = REGIONES_ESTOMATOGNATICAS;
  readonly antecedentes = ANTECEDENTES_033;
  readonly sextantes = SEXTO_SECTANTES;
  readonly dientesIhos = DIENTES_IHOS;
  readonly procedimientosOdontologicos = PROCEDIMIENTOS_ODONTOLOGICOS;

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
      forkJoin({
        hc: this.hclService.get(this.patient.id),
        hojas: this.hclService.listarHojas(this.patient.id).pipe(
          catchError(() => of<HojaResumen[]>([]))
        )
      }).subscribe({
        next: r => {
          this.hc = hclCompleta(this.patient?.id ?? '', r.hc);
          this.snapshot = hclCompleta(this.patient?.id ?? '', r.hc);
          this.hojas = r.hojas ?? [];
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.hc = crearHclVacia(this.patient?.id ?? '');
          this.snapshot = null;
          this.hojas = [];
          this.cargando = false;
          this.estado = 'error';
          this.mensaje = 'NO SE PUDO CARGAR LA HISTORIA CLÍNICA';
          this.cdr.markForCheck();
        }
      })
    );
  }

  abrirHoja(n: number): void {
    if (!this.patient || n === this.hc.hoja || this.cargando || this.guardando) {
      return;
    }
    if (this.tieneContenido(this.hc) && this.estado !== 'ok' &&
        !window.confirm('La hoja actual tiene datos sin guardar. ¿Cambiar de hoja? Los cambios no guardados se perderán.')) {
      return;
    }
    this.cargando = true;
    this.mensaje = null;
    this.sub.add(
      this.hclService.getHoja(this.patient.id, n).subscribe({
        next: hc => {
          this.hc = hclCompleta(this.patient?.id ?? '', hc);
          this.snapshot = hclCompleta(this.patient?.id ?? '', hc);
          this.cargando = false;
          this.estado = 'idle';
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.estado = 'error';
          this.mensaje = 'NO SE PUDO CARGAR LA HOJA ' + n;
          this.cdr.markForCheck();
        }
      })
    );
  }

  nuevaHoja(): void {
    if (!this.patient || this.cargando || this.guardando) {
      return;
    }
    if (this.tieneContenido(this.hc) && this.estado !== 'ok' &&
        !window.confirm('La hoja actual tiene datos sin guardar. ¿Abrir una nueva hoja? Los cambios no guardados se perderán.')) {
      return;
    }
    const siguiente = Math.max(1, ...this.hojas.map(h => h.hoja), this.hc.hoja) + 1;
    this.hc = crearHclVacia(this.patient.id, siguiente);
    this.snapshot = null;
    if (!this.hojas.some(h => h.hoja === siguiente)) {
      this.hojas = [
        ...this.hojas,
        { hoja: siguiente, fechaApertura: null, fechaControl: null, actualizadaEn: null }
      ];
    }
    this.estado = 'idle';
    this.mensaje = null;
    this.cdr.markForCheck();
  }

  sesionNueveLlena(): boolean {
    const s = this.hc.sesiones[8];
    return !!s && !!(s.fecha || s.diagnosticos || s.procedimientos || s.prescripciones || s.proximaCita || s.codigo);
  }

  private refrescarHojas(): void {
    if (!this.patient) {
      return;
    }
    this.sub.add(
      this.hclService.listarHojas(this.patient.id).subscribe({
        next: h => {
          this.hojas = h ?? [];
          this.cdr.markForCheck();
        },
        error: () => {}
      })
    );
  }

  /** Extrae el mensaje del backend cuando el guardado choca con un campo sellado. */
  private conflictoMensaje(err: unknown): string | null {
    const status = (err as { status?: number })?.status;
    const body = (err as { error?: unknown })?.error;
    if (status === 409) {
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      const message = (body as { message?: unknown })?.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return null;
  }

  private tieneContenido(hc: Hcl): boolean {
    return !!(
      hc.establecimiento || hc.parentesco || hc.motivoConsulta || hc.problemaActual ||
      hc.otroAntecedenteTexto || hc.presionArterial || hc.frecuenciaCardiaca || hc.temperatura ||
      hc.frecuenciaRespiratoria || hc.enfermedadPeriodontal || hc.higienePlaca || hc.higieneCalculo ||
      hc.gingivitis || hc.malOclusion || hc.fluorosis || hc.planOtrosTexto || hc.planTerapeutico ||
      hc.planEducacional || hc.profesionalNombre || hc.profesionalFecha || hc.profesionalFirma ||
      hc.sesiones.some(s => !!(s.fecha || s.diagnosticos || s.procedimientos || s.prescripciones || s.proximaCita || s.codigo)) ||
      (hc.examenRegiones ?? []).some(r => !!r.descripcion) ||
      (hc.diagnosticosCie ?? []).some(d => !!d.codigo) ||
      (hc.higieneSextantes ?? []).some(h => h.placa !== null || h.calculo !== null || h.gingivitis !== null) ||
      (hc.indicesCpo?.permanente ?? []).some(i => i.c !== null || i.p !== null || i.o !== null) ||
      (hc.indicesCpo?.deciduo ?? []).some(i => i.c !== null || i.e !== null || i.o !== null)
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
          this.snapshot = hclCompleta(this.patient?.id ?? '', hc);
          this.guardando = false;
          this.estado = 'ok';
          this.mensaje = 'HISTORIA CLÍNICA GUARDADA';
          this.refrescarHojas();
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.guardando = false;
          this.estado = 'error';
          this.mensaje = this.conflictoMensaje(err) ?? 'NO SE PUDO GUARDAR — REVISE LA CONEXIÓN';
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

  antVal(key: string): boolean {
    return (this.hc as unknown as Record<string, boolean>)[key] ?? false;
  }

  toggleAnt(key: string): void {
    const target = this.hc as unknown as Record<string, boolean>;
    target[key] = !(target[key] ?? false);
  }

  algunaAntecedente(): boolean {
    return this.antecedentes.some(a => a.key !== 'otroAntecedente' && this.antVal(a.key));
  }

  ihosPromedios(): { placa: string; calculo: string; gingivitis: string } {
    const prom = (vals: (number | null)[]): string => {
      const n = vals.filter((v): v is number => v !== null && v !== undefined);
      if (!n.length) {
        return '—';
      }
      return (n.reduce((s, v) => s + v, 0) / n.length).toFixed(1);
    };
    return {
      placa: prom(this.hc.higieneSextantes.map(h => h.placa)),
      calculo: prom(this.hc.higieneSextantes.map(h => h.calculo)),
      gingivitis: prom(this.hc.higieneSextantes.map(h => h.gingivitis))
    };
  }

  grupo(): string {
    return grupoEtario(this.patient?.age ?? 0);
  }

  /** ISO (yyyy-MM-dd) del backend DATE → DD/MM/AAAA para presentación. */
  fmtFecha(iso: string | null | undefined): string {
    if (!iso) {
      return '';
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
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