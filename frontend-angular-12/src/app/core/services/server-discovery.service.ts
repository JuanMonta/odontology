import { Injectable } from '@angular/core';
import { refrescarApiBase, MATRIZ_PUERTOS, IP_SIMULADA } from '../config/api.config';

const STORAGE_KEY = 'saas_api_base';

/**
 * Concurrencia y timeout del barrido de subred: 254 equipos con 48 sondeos en
 * vuelo tardan ~1 s cuando el servidor esta; un equipo apagado no debe frenar
 * al resto.
 */
const BARRIDO_CONCURRENCIA = 48;
const BARRIDO_TIMEOUT_MS = 300;

@Injectable({ providedIn: 'root' })
export class ServerDiscoveryService {
  private apiBase: string | null = null;

  /**
   * Un solo escaneo a la vez. El reintento periodico (AppComponent) y los
   * reintentos de peticiones fallidas (ReconexionInterceptor) comparten este
   * promise en vez de barrer la LAN por duplicado.
   */
  private enCurso: Promise<string | null> | null = null;

  constructor() {
    const qp = new URLSearchParams(window.location.search).get('apiBase');
    if (qp) { this.guardar(qp); this.apiBase = qp; }
    else { this.apiBase = localStorage.getItem(STORAGE_KEY); }
  }

  getApiBase(): string | null { return this.apiBase; }

  guardar(base: string): void {
    localStorage.setItem(STORAGE_KEY, base);
    this.apiBase = base;
    refrescarApiBase();
    this.sincronizarUrl(base);
  }

  olvidar(): void { localStorage.removeItem(STORAGE_KEY); this.apiBase = null; }

  /**
   * Si la estacion abrio la app con `?apiBase=<ip vieja>`, una recarga manual
   * volveria a inyectar la direccion muerta. Se reescribe la barra (sin navegar,
   * sin recargar) para que la proxima carga nazca con la base buena.
   */
  private sincronizarUrl(base: string): void {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('apiBase') === base) return;
      url.searchParams.set('apiBase', base);
      window.history.replaceState(window.history.state, '', url.toString());
    } catch { /* URL rara: no es critico */ }
  }

  /**
   * 4 canales: 1) memoria (localStorage) -> 2) matriz 8001-8010 + 8100-8900
   * (+ barrido de la subred conocida) -> 3) QR (imagen ya generada por servidor)
   * -> 4) manual. Retorna el primer base URL que responde /health.
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
    // Canal 2b: la subred de la ultima base conocida. Cubre el cambio de IP del
    // servidor (DHCP) sin reiniciar la estacion.
    const subred = await this.barrerSubred(this.baseConocida(), () => true);
    if (subred) return this.usar(subred);
    // Canal 2c: la IP LAN simulada de desarrollo
    for (const port of MATRIZ_PUERTOS) {
      const cand = `http://${IP_SIMULADA}:${port}/api/v1`;
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
   * sin servidor. No bloquea la UI ni recarga la pagina: el formulario que el
   * usuario este llenando se queda como esta.
   */
  reconectar(presupuestoMs = 4000): Promise<string | null> {
    if (this.enCurso) {
      return this.enCurso;
    }
    this.enCurso = this.reconectarAhora(presupuestoMs).then(
      valor => { this.enCurso = null; return valor; },
      error => { this.enCurso = null; throw error; }
    );
    return this.enCurso;
  }

  private async reconectarAhora(presupuestoMs: number): Promise<string | null> {
    const actual = this.baseConocida();
    // Primero la base que ya tenemos guardada: si el backend volvio en el mismo
    // puerto, este es el camino corto y evita re-escanear la matriz. Timeout
    // corto a proposito: un servidor sano responde /health en milisegundos y,
    // si la IP esta muerta, cada segundo aqui se le roba al barrido de subred.
    if (actual && (await this.probar(actual, 1200))) {
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
    // localhost completo ANTES de la LAN: un puerto cerrado responde al
    // instante (ECONNREFUSED) y la IP no enrutable agotaria el timeout en cada
    // intento, dejando el presupuesto gastado en los primeros puertos.
    for (const host of ['localhost', '127.0.0.1']) {
      for (const port of MATRIZ_PUERTOS) {
        if (!sobraTiempo()) return null;
        const cand = `http://${host}:${port}/api/v1`;
        if (await this.probar(cand, 900)) return cand;
      }
    }
    // Subred de la base conocida: aqui cae el escenario de la IP que cambio.
    const subred = await this.barrerSubred(this.baseConocida(), sobraTiempo);
    if (subred) return subred;

    for (const port of MATRIZ_PUERTOS) {
      if (!sobraTiempo()) return null;
      const cand = `http://${IP_SIMULADA}:${port}/api/v1`;
      if (await this.probar(cand, 900)) return cand;
    }
    return null;
  }

  /** Base vigente: la de memoria o la persistida. */
  private baseConocida(): string | null {
    return this.apiBase || localStorage.getItem(STORAGE_KEY);
  }

  /**
   * Barre la subred /24 de la ultima base conocida. Cuando el servidor cambia de
   * IP por DHCP conserva su puerto, asi que se prueba primero ese puerto y solo
   * despues el resto de la matriz (el servidor pudo reiniciarse y elegir otro).
   */
  private async barrerSubred(
    baseVieja: string | null,
    sobraTiempo: () => boolean
  ): Promise<string | null> {
    const partes = /^https?:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3}):(\d+)\/api\/v1\/?$/i
      .exec(baseVieja || '');
    if (!partes) return null; // loopback o base no basada en IPv4: nada que barrer

    const prefijo = `${partes[1]}.`;
    const puerto = Number(partes[3]);

    const mismoPuerto = await this.barrer(prefijo, [puerto], sobraTiempo);
    if (mismoPuerto) return mismoPuerto;
    if (!sobraTiempo()) return null;

    const otros = MATRIZ_PUERTOS.filter(p => p !== puerto);
    return this.barrer(prefijo, otros, sobraTiempo);
  }

  private async barrer(
    prefijo: string,
    puertos: number[],
    sobraTiempo: () => boolean
  ): Promise<string | null> {
    const hosts: number[] = [];
    for (let ultimo = 1; ultimo <= 254; ultimo++) {
      hosts.push(ultimo);
    }

    let encontrado: string | null = null;
    let siguiente = 0;

    const trabajador = async (): Promise<void> => {
      while (!encontrado && sobraTiempo()) {
        const indice = siguiente++;
        if (indice >= hosts.length) return;
        for (const puerto of puertos) {
          if (!sobraTiempo()) return;
          const candidata = `http://${prefijo}${hosts[indice]}:${puerto}/api/v1`;
          if (await this.probar(candidata, BARRIDO_TIMEOUT_MS)) {
            encontrado = candidata;
            return;
          }
        }
      }
    };

    const trabajadores: Array<Promise<void>> = [];
    for (let i = 0; i < BARRIDO_CONCURRENCIA; i++) {
      trabajadores.push(trabajador());
    }
    await Promise.all(trabajadores);
    return encontrado;
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
    const b = base || this.apiBase || `http://${IP_SIMULADA}:${MATRIZ_PUERTOS[0]}/api/v1`;
    return `${b}/server/qr`;
  }
}
