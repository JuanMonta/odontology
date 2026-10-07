import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { refrescarApiBase } from '../config/api.config';

const STORAGE_KEY = 'saas_api_base';
const DEFAULT_IP = '192.68.1.2';
export const MATRIZ_PUERTOS = [8001,8002,8003,8004,8005,8006,8007,8008,8009,8010,8100,8200,8300,8400,8500,8600,8700,8800,8900];

@Injectable({ providedIn: 'root' })
export class ServerDiscoveryService {
  private apiBase: string | null = null;

  constructor(private http: HttpClient) {
    const qp = new URLSearchParams(window.location.search).get('apiBase');
    if (qp) { this.guardar(qp); this.apiBase = qp; }
    else { this.apiBase = localStorage.getItem(STORAGE_KEY); }
  }

  getApiBase(): string | null { return this.apiBase; }

  guardar(base: string): void {
    localStorage.setItem(STORAGE_KEY, base);
    this.apiBase = base;
    refrescarApiBase();
  }

  olvidar(): void { localStorage.removeItem(STORAGE_KEY); this.apiBase = null; }

  /**
   * 4 canales: 1) memoria (localStorage) -> 2) matriz 8001-8010 + 8100-8900 -> 3) QR (imagen ya generada por servidor) -> 4) manual
   * Retorna el primer base URL que responde /health.
   */
  async descubrir(): Promise<string | null> {
    // Canal 1: memoria
    const mem = localStorage.getItem(STORAGE_KEY);
    if (mem && await this.probar(mem)) return this.usar(mem);

    // Canal 2: matriz por defecto. Se prueban primero los hosts locales: un
    // puerto cerrado responde al instante (ECONNREFUSED) y la IP LAN, al no ser
    // enrutable, agotaria el timeout en cada intento.
    const locales = ['localhost', '127.0.0.1'];
    for (const port of MATRIZ_PUERTOS) {
      for (const host of locales) {
        const cand = `http://${host}:${port}/api/v1`;
        if (await this.probar(cand)) return this.usar(cand);
      }
    }
    // Luego la IP LAN del servidor
    for (const port of MATRIZ_PUERTOS) {
      const cand = `http://${DEFAULT_IP}:${port}/api/v1`;
      if (await this.probar(cand)) return this.usar(cand);
    }
    // Canal 3 y 4 requieren interacción (QR scan / input manual) -> el caller muestra el diálogo
    return null;
  }

  /**
   * Descubre la base ANTES de que la app arranque (APP_INITIALIZER).
   * Presupuesto corto a proposito: un backend caido no debe dejar la pantalla en
   * blanco. Los puertos cerrados en localhost fallan al instante (ECONNREFUSED),
   * asi que con 1.8 s alcanza para un escaneo local completo; si no hay nada, la
   * app arranca igual y queda en offline hasta que reconectar() la reintente.
   */
  async inicializar(presupuestoMs = 1800): Promise<void> {
    if (this.getApiBase()) {
      return; // Ya conocido por ?apiBase= o memoria
    }
    const limite = Date.now() + presupuestoMs;
    const sobraTiempo = () => Date.now() < limite;

    const encontrado = await this.buscar(sobraTiempo);
    if (encontrado) {
      this.guardar(encontrado);
      // Actualiza el live binding de API_BASE para los ~15 servicios que lo
      // importan (si no, quedan clavados en el puerto por defecto)
      refrescarApiBase();
    }
  }

  /**
   * Reintento en segundo plano mientras el backend este caido. Devuelve la base
   * si encontro una (ya persistida y aplicada al live binding), o null si sigue
   * sin servidor. No bloquea la UI: se llama desde AppComponent bajo un timer.
   */
  async reconectar(presupuestoMs = 4000): Promise<string | null> {
    const actual = this.apiBase || localStorage.getItem(STORAGE_KEY);
    // Primero la base que ya tenemos guardada: si el backend volvio en el mismo
    // puerto, este es el camino corto y evita re-escanear la matriz.
    if (actual && (await this.probar(actual, 2500))) {
      return this.usar(actual);
    }
    const limite = Date.now() + presupuestoMs;
    const encontrado = await this.buscar(() => Date.now() < limite);
    if (encontrado) {
      this.guardar(encontrado);
      refrescarApiBase();
      return encontrado;
    }
    return null;
  }

  private async buscar(sobraTiempo: () => boolean): Promise<string | null> {
    // localhost completo ANTES de la IP LAN: un puerto cerrado responde al
    // instante (ECONNREFUSED) y la IP no enrutable agotaria el timeout en cada
    // intento, dejando el presupuesto gastado en los primeros puertos.
    for (const host of ['localhost', '127.0.0.1']) {
      for (const port of MATRIZ_PUERTOS) {
        if (!sobraTiempo()) return null;
        const cand = `http://${host}:${port}/api/v1`;
        if (await this.probar(cand, 900)) return cand;
      }
    }
    for (const port of MATRIZ_PUERTOS) {
      if (!sobraTiempo()) return null;
      const cand = `http://${DEFAULT_IP}:${port}/api/v1`;
      if (await this.probar(cand, 900)) return cand;
    }
    return null;
  }

  private async probar(base: string, ms = 1200): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      const res = await fetch(`${base}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      return res.ok;
    } catch { return false; }
  }

  private usar(base: string): string {
    this.guardar(base);
    return base;
  }

  qrUrl(base?: string): string {
    const b = base || this.apiBase || `http://${DEFAULT_IP}:8001/api/v1`;
    return `${b}/server/qr`;
  }
}
