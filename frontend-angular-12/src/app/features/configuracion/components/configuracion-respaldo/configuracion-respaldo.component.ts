import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { RespaldoService, RespaldoJob, RespaldoRequest } from '../../services/respaldo.service';
import { getApiBase } from '../../../../core/config/api.config';

@Component({
  selector: 'app-configuracion-respaldo',
  templateUrl: './configuracion-respaldo.component.html',
  styleUrls: ['./configuracion-respaldo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionRespaldoComponent implements OnDestroy {
  backupUser = '';
  backupPass = '';

  cargando = false;
  job: RespaldoJob | null = null;
  error: string | null = null;
  qrSrc: string | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private respaldo: RespaldoService, private cdr: ChangeDetectorRef) {}

  cargarQr(): void {
    // QR único "Analibio" — URL LAN del servidor para escaneo móvil. La base ya
    // la fijó el descubrimiento en runtime (puerto dinámico).
    const base = getApiBase();
    this.qrSrc = `${base.replace(/\/api\/v1\/?$/, '')}/api/v1/server/qr`;
  }

  ngOnDestroy(): void { this.limpiarPoll(); }

  generar(): void {
    this.cargando = true;
    this.error = null;
    this.job = null;
    this.cdr.markForCheck();
    const body: RespaldoRequest = {};
    if (this.backupUser.trim()) body.username = this.backupUser.trim();
    if (this.backupPass) body.password = this.backupPass;
    this.respaldo.crear(body).subscribe({
      next: (j) => {
        this.job = j;
        this.cdr.markForCheck();
        this.iniciarPoll(j.jobId);
      },
      error: (err) => {
        if (err?.status === 409) {
          this.error = 'Ya hay un respaldo en curso. Espera a que termine antes de iniciar otro.';
        } else {
          this.error = err?.error?.message || err?.message || 'No se pudo iniciar el respaldo';
        }
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  private iniciarPoll(jobId: string): void {
    this.limpiarPoll();
    this.pollTimer = setInterval(() => {
      this.respaldo.estado(jobId).subscribe({
        next: (j) => {
          this.job = j;
          this.cdr.markForCheck();
          if (j.estado === 'COMPLETADO' || j.estado === 'FALLADO') {
            this.limpiarPoll();
            this.cargando = false;
            if (j.estado === 'FALLADO') this.error = j.error || 'Respaldo falló';
            this.cdr.markForCheck();
          }
        },
        error: () => { this.limpiarPoll(); this.cargando = false; this.cdr.markForCheck(); }
      });
    }, 1500);
  }

  private limpiarPoll(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  descargar(): void {
    if (!this.job?.archivo) return;
    window.open(this.respaldo.descargarUrl(this.job.archivo), '_blank');
  }

  get progreso(): number { return this.job?.progreso ?? 0; }
  get mensaje(): string | null { return this.job?.mensaje ?? null; }
}
