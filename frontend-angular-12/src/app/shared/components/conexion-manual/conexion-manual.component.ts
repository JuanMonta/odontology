import { ChangeDetectionStrategy, Component } from '@angular/core';
import { getApiBase, setApiBase, MATRIZ_PUERTOS, IP_SIMULADA } from '../../../core/config/api.config';

@Component({
  selector: 'app-conexion-manual',
  templateUrl: './conexion-manual.component.html',
  styleUrls: ['./conexion-manual.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConexionManualComponent {
  ip = IP_SIMULADA;
  puerto = '8001';
  probando = false;
  mensaje: string | null = null;
  qrUrl: string | null = null;

  get apiPreview(): string { return `http://${this.ip}:${this.puerto}/api/v1`; }

  async probar(): Promise<void> {
    this.probando = true;
    this.mensaje = null;
    const base = this.apiPreview;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(`${base}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) {
        setApiBase(base);
        this.mensaje = `Conectado a ${base} — guardado para próximas veces. Recarga la página.`;
        this.qrUrl = `${base}/server/qr`;
      } else {
        this.mensaje = `No responde (${res.status}) en ${base}`;
      }
    } catch {
      this.mensaje = `No se pudo conectar a ${base}. Verifica IP/puerto y que el servidor esté encendido.`;
    } finally { this.probando = false; }
  }

  guardar(): void {
    setApiBase(this.apiPreview);
    location.reload();
  }

  async escanearMatriz(): Promise<void> {
    this.probando = true;
    this.mensaje = 'Escaneando matriz 8001-8010 + 8100-8900...';
    for (const p of MATRIZ_PUERTOS) {
      for (const host of [IP_SIMULADA, 'localhost', '127.0.0.1']) {
        const cand = `http://${host}:${p}/api/v1`;
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 900);
          const res = await fetch(`${cand}/health`, { signal: ctrl.signal });
          clearTimeout(t);
          if (res.ok) {
            setApiBase(cand);
            this.ip = host;
            this.puerto = String(p);
            this.mensaje = `Encontrado en ${cand} — guardado.`;
            this.qrUrl = `${cand}/server/qr`;
            this.probando = false;
            return;
          }
        } catch {}
      }
    }
    this.mensaje = 'Ningún puerto de la matriz respondió. Usa conexión manual.';
    this.probando = false;
  }
}
