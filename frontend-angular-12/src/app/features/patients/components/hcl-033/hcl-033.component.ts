import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Patient, Tooth } from '../../../../core/models/patient.model';
import {
  ANTECEDENTES_033,
  DIENTES_IHOS,
  DIENTES_POR_SEXTANTE,
  Hcl,
  HojaResumen,
  HclSesion,
  REGIONES_ESTOMATOGNATICAS,
  SEXTO_SECTANTES,
  crearHclVacia,
  grupoEtario,
  hclCompleta
} from '../../../../core/models/hcl.model';
import { HclHttpService } from '../../services/hcl-http.service';
import { Form033PdfService } from '../../services/form033-pdf.service';
import { PROCEDIMIENTOS_ODONTOLOGICOS } from '../../../../core/models/procedimientos-odontologicos';
import { ClinicaSettings } from '../../../../core/models/clinica-settings.model';
import { ConfiguracionHttpService } from '../../../configuracion/services/configuracion-http.service';

interface Seccion033 {
  n: number;
  titulo: string;
}

type EstadoGuardado = 'idle' | 'ok' | 'error';

interface ModalAccion {
  accion: 'abrir' | 'nueva';
  hoja: number;
}

@Component({
  selector: 'app-hcl-033',
  templateUrl: './hcl-033.component.html',
  styleUrls: ['./hcl-033.component.css']
})
export class Hcl033Component implements OnInit, OnChanges, OnDestroy {
  Math = Math;
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
  /** Confirmación pendiente por cambios sin guardar. Sustituye al window.confirm
   *  nativo por un modal del sistema con "acción segura primero, destructiva después". */
  modal: ModalAccion | null = null;

  /** Estado persistido de la última carga/guardado: de él derivan los sellos,
   *  no del modelo vivo {@link hc}. Al iniciar el tratamiento (sesión 1 con
   *  datos registrados) se sella la evaluación inicial y la identidad; cada
   *  sesión que ya tiene contenido queda bloqueada. */
  private snapshot: Hcl | null = null;

  get sellada(): boolean {
    const s1 = this.hc?.sesiones?.[0] ?? this.snapshot?.sesiones?.[0];
    return !!s1 && this.sesionTieneDatos(s1);
  }

  sesionBloqueada(n: number): boolean {
    const s = this.snapshot?.sesiones?.find(x => x.sesion === n);
    return !!s && this.sesionTieneDatos(s);
  }

  sesionTieneDatos(s: HclSesion): boolean {
    const procs = s.procedimientosCodigos?.length || (s.procedimientos && s.procedimientos.trim().length > 0);
    return !!(s.fecha || s.diagnosticos || procs || s.prescripciones || s.proximaCita || s.codigo);
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
  readonly dientesPorSextante = DIENTES_POR_SEXTANTE;
  readonly procedimientosOdontologicos = PROCEDIMIENTOS_ODONTOLOGICOS;

  /** Texto temporal del input del selector de procedimientos. */
  procInput = '';

  onProcInput(e: Event): void {
    this.procInput = (e.target as HTMLInputElement).value;
  }

  /** Descripción corta de un código CDT (viventa en el catálogo). */
  descripcionProcedimiento(codigo: string): string {
    const p = this.procedimientosOdontologicos.find(x => x.codigo === codigo.toUpperCase());
    return p ? p.descripcion : '';
  }

  /** Agrega un procedimiento a la sesión desde el texto elegido (código o "código · descripción"). */
  agregarProcedimientoPorTexto(s: HclSesion, e: Event): void {
    e.preventDefault();
    const texto = (this.procInput || '').trim();
    if (!texto) { return; }
    const codigo = this.normalizarCodigoProcedimiento(texto);
    if (!codigo) { return; }
    const lista = s.procedimientosCodigos || (s.procedimientosCodigos = []);
    if (!lista.includes(codigo)) {
      lista.push(codigo);
    }
    s.procedimientosCodigos = [...lista];
    s.procedimientos = lista.map(c => c + (this.descripcionProcedimiento(c) ? ' · ' + this.descripcionProcedimiento(c) : '')).join('\n');
    this.procInput = '';
  }

  quitarProcedimiento(s: HclSesion, codigo: string): void {
    const lista = (s.procedimientosCodigos || []).filter(c => c !== codigo);
    s.procedimientosCodigos = lista;
    s.procedimientos = lista.map(c => c + (this.descripcionProcedimiento(c) ? ' · ' + this.descripcionProcedimiento(c) : '')).join('\n');
    this.procInput = '';
  }

  private normalizarCodigoProcedimiento(texto: string): string {
    const t = texto.trim();
    const m = t.match(/^([D]\d{4})/i);
    if (m) { return m[1].toUpperCase(); }
    const p = this.procedimientosOdontologicos.find(x => t.toUpperCase().includes(x.codigo));
    return p ? p.codigo : '';
  }


  settings: ClinicaSettings | null = null;

  private readonly sub = new Subscription();

  constructor(
    private readonly hclService: HclHttpService,
    private readonly cdr: ChangeDetectorRef,
    private readonly settingsService: ConfiguracionHttpService,
    private readonly pdfService: Form033PdfService
  ) {}

  ngOnInit(): void {
    if (this.patient) {
      this.cargar();
    }
    this.sub.add(
      this.settingsService.settings$.subscribe(s => {
        this.settings = s;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnChanges(): void {
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
    if (this.tieneContenido(this.hc) && this.estado !== 'ok') {
      this.modal = { accion: 'abrir', hoja: n };
      return;
    }
    this.ejecutarAbrirHoja(n);
  }

  private ejecutarAbrirHoja(n: number): void {
    if (!this.patient) { return; }
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
    if (this.tieneContenido(this.hc) && this.estado !== 'ok') {
      this.modal = { accion: 'nueva', hoja: this.hc.hoja + 1 };
      return;
    }
    this.ejecutarNuevaHoja();
  }

  private ejecutarNuevaHoja(): void {
    if (!this.patient) { return; }
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

  /** Acción segura del modal: guarda antes de continuar (abrir/nueva hoja). */
  modalGuardar(): void {
    const accion = this.modal;
    if (!accion) { return; }
    this.modal = null;
    this.guardarAhora(() => {
      if (accion.accion === 'abrir') { this.ejecutarAbrirHoja(accion.hoja); }
      else { this.ejecutarNuevaHoja(); }
    });
  }

  /** Acción destructiva del modal: descarta los cambios no guardados y continúa. */
  modalDescartar(): void {
    const accion = this.modal;
    if (!accion) { return; }
    this.modal = null;
    this.estado = 'idle';
    this.mensaje = null;
    if (accion.accion === 'abrir') { this.ejecutarAbrirHoja(accion.hoja); }
    else { this.ejecutarNuevaHoja(); }
  }

  modalCancelar(): void {
    this.modal = null;
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
      hc.planEducacional || hc.profesionalNombre || hc.profesionalCodigo || hc.profesionalFirma ||
      hc.sesiones.some(s => !!(s.fecha || s.diagnosticos || s.procedimientos || s.prescripciones || s.proximaCita || s.codigo)) ||
      (hc.examenRegiones ?? []).some(r => !!r.descripcion) ||
      (hc.diagnosticosCie ?? []).some(d => !!d.codigo) ||
      (hc.higieneSextantes ?? []).some(h => h.d1_evaluado || h.d2_evaluado || h.d3_evaluado || h.placa !== null || h.calculo !== null || h.gingivitis !== null) ||
      (hc.indicesCpo?.c_perma !== null && hc.indicesCpo?.c_perma !== undefined) ||
      (hc.indicesCpo?.p_perma !== null && hc.indicesCpo?.p_perma !== undefined) ||
      (hc.indicesCpo?.o_perma !== null && hc.indicesCpo?.o_perma !== undefined) ||
      (hc.indicesCpo?.c_deci !== null && hc.indicesCpo?.c_deci !== undefined) ||
      (hc.indicesCpo?.e_deci !== null && hc.indicesCpo?.e_deci !== undefined) ||
      (hc.indicesCpo?.o_deci !== null && hc.indicesCpo?.o_deci !== undefined)
    );
  }

  guardar(): void {
    this.guardarAhora();
  }

  private guardarAhora(continuar?: () => void): void {
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
          if (continuar) { continuar(); }
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

  ihosTotales(): { placa: string; calculo: string; gingivitis: string } {
    const sumPlaca = (): string => {
      let t = 0;
      for (const h of this.hc.higieneSextantes) { if (h.placa != null && h.placa >= 0 && h.placa <= 3) t += h.placa; }
      return String(t);
    };
    const sumCalculo = (): string => {
      let t = 0;
      for (const h of this.hc.higieneSextantes) { if (h.calculo != null && h.calculo >= 0 && h.calculo <= 3) t += h.calculo; }
      return String(t);
    };
    const sumGing = (): string => {
      let t = 0;
      for (const h of this.hc.higieneSextantes) { if (h.gingivitis === 0 || h.gingivitis === 1) t += h.gingivitis; }
      return String(t);
    };
    return { placa: sumPlaca(), calculo: sumCalculo(), gingivitis: sumGing() };
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

  /** Totales del índice CPO-ceo (2 filas: D y d). */
  cpoTotales(): { perma: number; deci: number } {
    const cpo = this.hc.indicesCpo;
    return {
      perma: (cpo?.c_perma ?? 0) + (cpo?.p_perma ?? 0) + (cpo?.o_perma ?? 0),
      deci: (cpo?.c_deci ?? 0) + (cpo?.e_deci ?? 0) + (cpo?.o_deci ?? 0)
    };
  }

  // ============ Impresión del Formulario 033 (imagen + superposición) ============

  imprimir(): void {
    if (!this.patient) { return; }
    this.mensaje = 'GENERANDO PDF…';
    this.cdr.markForCheck();
    this.pdfService.generate(this.hc, this.patient, this.settings, this.teeth).then(pdfBytes => {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      this.mensaje = 'PDF GENERADO';
      this.estado = 'ok';
      this.cdr.markForCheck();
    }).catch(err => {
      console.error('Error generando PDF:', err);
      this.mensaje = 'ERROR AL GENERAR PDF';
      this.estado = 'error';
      this.cdr.markForCheck();
    });
  }

  hoyPrint(): string {
    const d = new Date();
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  /** Grupo etario según la edad del paciente (para la fila de checkboxes del Form 033). */
  ageGroup(): string {
    const age = this.patient?.age ?? 0;
    if (age < 1) { return 'menor1'; }
    if (age <= 4) { return '1a4'; }
    if (age <= 9) { return '5a9'; }
    if (age <= 14) { return '10a14'; }
    if (age <= 19) { return '15a19'; }
    return 'mayor20';
  }

  /** Nombre y apellido separados para el encabezado del Form 033. */
  nombreSplit(): { nombre: string; apellido: string } {
    const p = this.patient;
    if (!p) { return { nombre: '—', apellido: '—' }; }
    if (p.nombre || p.apellido) {
      return { nombre: p.nombre || '—', apellido: p.apellido || '—' };
    }
    const full = p.name?.trim() ?? '';
    if (!full) { return { nombre: '—', apellido: '—' }; }
    const parts = full.split(/\s+/);
    if (parts.length === 1) { return { nombre: parts[0], apellido: '—' }; }
    return { nombre: parts[0], apellido: parts.slice(1).join(' ') };
  }
}