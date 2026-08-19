import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Patient, PatientAppointment } from '../../../../core/models/patient.model';
import { Odontologo } from '../../../../core/models/odontologo.model';
import {
  Evolucion,
  EvolucionDraft,
  crearEvolucionVacia
} from '../../../../core/models/hcl.model';
import { HclHttpService } from '../../services/hcl-http.service';
import { OdontologosHttpService } from '../../../odontologos/services/odontologos-http.service';

@Component({
  selector: 'app-evolucion-clinica',
  templateUrl: './evolucion-clinica.component.html',
  styleUrls: ['./evolucion-clinica.component.css']
})
export class EvolucionClinicaComponent implements OnInit, OnChanges, OnDestroy {
  @Input() patient: Patient | null = null;
  /** Última cita ATENDIDA del paciente: pre-carga el borrador con su contexto. */
  @Input() contexto: PatientAppointment | null = null;

  lista: Evolucion[] = [];
  odontologos: Odontologo[] = [];
  cargando = false;
  guardando = false;
  formularioAbierto = false;
  draft: EvolucionDraft = crearEvolucionVacia();
  /** Código del profesional que atendió la última cita (bloquea el campo). */
  contextoCodigo: string | null = null;
  mensaje: string | null = null;

  private static readonly MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'] as const;

  private readonly sub = new Subscription();

  constructor(
    private readonly hclService: HclHttpService,
    private readonly odontologosService: OdontologosHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.odontologosService.odontologos$.subscribe(list => {
        this.odontologos = list ?? [];
        this.actualizarContextoCodigo();
        this.cdr.markForCheck();
      })
    );
  }

  ngOnChanges(): void {
    this.lista = [];
    this.mensaje = null;
    this.actualizarContextoCodigo();
    this.cargar();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /** True cuando el contexto de la cita fija al odontólogo (no editable). */
  get bloqueado(): boolean {
    return !!this.contexto && !!this.contextoCodigo;
  }

  /** Opciones del dropdown: activos + el fijado por la cita aunque esté ausente. */
  get odontologosDisponibles(): Odontologo[] {
    const activos = this.odontologos.filter(o => o.status === 'activo');
    if (this.contextoCodigo && !activos.some(o => o.code === this.contextoCodigo)) {
      const fijado = this.odontologos.find(o => o.code === this.contextoCodigo);
      if (fijado) {
        activos.push(fijado);
      }
    }
    return activos;
  }

  private actualizarContextoCodigo(): void {
    if (!this.contexto) {
      this.contextoCodigo = null;
      return;
    }
    if (this.contexto.dentistCode) {
      this.contextoCodigo = this.contexto.dentistCode;
      return;
    }
    const nombre = (this.contexto.dentist ?? '').trim().toUpperCase();
    const o = this.odontologos.find(x => x.name.trim().toUpperCase() === nombre);
    this.contextoCodigo = o ? o.code : null;
  }

  private cargar(): void {
    if (!this.patient) {
      this.cargando = false;
      return;
    }
    this.cargando = true;
    this.sub.add(
      this.hclService.listarEvolucion(this.patient.id).subscribe({
        next: l => {
          this.lista = l ?? [];
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.lista = [];
          this.cargando = false;
          this.cdr.markForCheck();
        }
      })
    );
  }

  abrirFormulario(): void {
    this.draft = crearEvolucionVacia();
    if (this.contexto) {
      const iso = this.citaFechaAISO(this.contexto.date);
      if (iso) {
        this.draft.fecha = iso;
      }
      this.draft.hora = this.contexto.time || null;
      this.draft.odontologoCodigo = this.contextoCodigo;
      this.draft.motivo = this.contexto.treatment ? `ATENCIÓN — ${this.contexto.treatment}` : null;
    }
    this.formularioAbierto = true;
    this.mensaje = null;
  }

  /** "28 JUL 2026" (formato de presentación del detalle) → "2026-07-28" (ISO). */
  citaFechaAISO(f: string | null | undefined): string {
    const m = /^(\d{2}) ([A-Z]{3}) (\d{4})$/.exec((f ?? '').trim());
    if (!m) {
      return '';
    }
    const idx = EvolucionClinicaComponent.MESES.indexOf(m[2] as never);
    if (idx < 0) {
      return '';
    }
    return `${m[3]}-${String(idx + 1).padStart(2, '0')}-${m[1]}`;
  }

  cancelar(): void {
    this.formularioAbierto = false;
    this.mensaje = null;
  }

  guardar(): void {
    if (!this.patient || this.guardando) {
      return;
    }
    this.guardando = true;
    this.mensaje = null;
    this.sub.add(
      this.hclService.guardarEvolucion(this.patient.id, this.draft).subscribe({
        next: () => {
          this.guardando = false;
          this.formularioAbierto = false;
          this.mensaje = 'EVOLUCIÓN REGISTRADA';
          this.cargar();
          this.cdr.markForCheck();
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.guardando = false;
          this.mensaje =
            err?.status === 401
              ? 'NO SE PUDO REGISTRAR — INICIE SESIÓN'
              : err?.error?.message || 'NO SE PUDO REGISTRAR — REVISE LA CONEXIÓN';
          this.cdr.markForCheck();
        }
      })
    );
  }

  /** ISO (yyyy-MM-dd) del backend DATE → DD/MM/AAAA para presentación. */
  fmtFecha(iso: string | null | undefined): string {
    if (!iso) {
      return '';
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  }

  fmtHora(h: string | null | undefined): string {
    if (!h) {
      return '';
    }
    return h.slice(0, 5);
  }
}