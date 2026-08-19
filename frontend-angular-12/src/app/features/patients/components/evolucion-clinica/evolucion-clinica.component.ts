import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Patient } from '../../../../core/models/patient.model';
import {
  Evolucion,
  EvolucionDraft,
  crearEvolucionVacia
} from '../../../../core/models/hcl.model';
import { HclHttpService } from '../../services/hcl-http.service';

@Component({
  selector: 'app-evolucion-clinica',
  templateUrl: './evolucion-clinica.component.html',
  styleUrls: ['./evolucion-clinica.component.css']
})
export class EvolucionClinicaComponent implements OnChanges, OnDestroy {
  @Input() patient: Patient | null = null;

  lista: Evolucion[] = [];
  cargando = false;
  guardando = false;
  formularioAbierto = false;
  draft: EvolucionDraft = crearEvolucionVacia();
  mensaje: string | null = null;

  private readonly sub = new Subscription();

  constructor(
    private readonly hclService: HclHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    this.lista = [];
    this.mensaje = null;
    this.cargar();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
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
    this.formularioAbierto = true;
    this.mensaje = null;
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
        error: () => {
          this.guardando = false;
          this.mensaje = 'NO SE PUDO REGISTRAR — REVISE LA CONEXIÓN';
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