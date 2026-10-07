import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AjusteVisualService } from './core/services/ajuste-visual.service';
import { BackendStatusService } from './core/services/backend-status.service';
import { ServerDiscoveryService } from './core/services/server-discovery.service';

const INTERVALO_REINTENTO_MS = 15000;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'sas-odontology';

  private readonly subs = new Subscription();
  private reintento: ReturnType<typeof setTimeout> | null = null;
  private escaneando = false;

  constructor(
    ajusteVisual: AjusteVisualService,
    private readonly estado: BackendStatusService,
    private readonly descubrimiento: ServerDiscoveryService
  ) {
    void ajusteVisual;
  }

  ngOnInit(): void {
    // La app arranca aunque el backend este caido: mientras siga en offline
    // reintentamos encontrarlo para poder conectarnos en cuanto suba. Si la base
    // guardada es la correcta, reconectar() la confirma al instante y el proximo
    // sondeo de BackendStatusService conmuta a online solo.
    this.subs.add(
      this.estado.status$.subscribe(status => {
        if (status === 'offline') {
          this.programarReintento();
        } else {
          this.cancelarReintento();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.cancelarReintento();
  }

  private programarReintento(): void {
    if (this.reintento !== null) {
      return;
    }
    this.reintento = setTimeout(() => {
      this.reintento = null;
      void this.reintentar();
    }, INTERVALO_REINTENTO_MS);
  }

  private async reintentar(): Promise<void> {
    // Si un escaneo sigue en vuelo no lo solapamos: dejamos otro para despues.
    if (this.escaneando) {
      this.programarReintento();
      return;
    }
    this.escaneando = true;
    try {
      const base = await this.descubrimiento.reconectar();
      if (!base) {
        this.programarReintento();
      }
    } catch {
      this.programarReintento();
    } finally {
      this.escaneando = false;
    }
  }

  private cancelarReintento(): void {
    if (this.reintento !== null) {
      clearTimeout(this.reintento);
      this.reintento = null;
    }
  }
}
