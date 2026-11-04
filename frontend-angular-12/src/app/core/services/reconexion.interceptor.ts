import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { getApiBase } from '../config/api.config';
import { ServerDiscoveryService } from './server-discovery.service';

/**
 * Cabecera que marca la peticion ya reintentada. Evita bucles: un reintento
 * que vuelve a fallar sale como error normal y la UI decide.
 */
export const CABECERA_REINTENTO = 'X-SaaS-Reintento';

/**
 * Espera minima entre barridos disparados por peticiones fallidas. El sondeo
 * periodico de AppComponent sigue su propio ritmo; esto solo evita que 20
 * peticiones que fallan a la vez encolen 20 barridos de la LAN.
 */
const ENFRIAMIENTO_MS = 4000;

/**
 * Si el servidor cambia de IP (DHCP) a mitad de jornada, toda peticion en vuelo
 * falla con `status === 0` (sin respuesta). Este interceptor:
 *
 *  1. Dispara el descubrimiento (barrido de subred) UNA sola vez, compartido
 *     entre todas las peticiones que fallan en ese instante.
 *  2. Reescribe la URL de la peticion con la base nueva.
 *  3. La reintenta UNA sola vez, marcada con {@link CABECERA_REINTENTO}.
 *
 * No recarga la pagina: el formulario que el usuario este llenando sigue vivo y
 * su "Guardar" se completa solo.
 *
 * Solo se reintenta cuando la base CAMBIO. Si el descubrimiento devuelve la
 * misma base, la peticion pudo haber llegado al servidor (respuesta perdida) y
 * reintentar un POST duplicaria el registro: en ese caso se propaga el error.
 */
@Injectable()
export class ReconexionInterceptor implements HttpInterceptor {
  /** Barrido en curso, compartido por todas las peticiones que fallan. */
  private enCurso: Promise<string | null> | null = null;
  private ultimoIntento = 0;

  constructor(private readonly descubrimiento: ServerDiscoveryService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.headers.has(CABECERA_REINTENTO) || !this.esReintentable(req.url)) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // status 0 = error de red: la IP vieja no respondio. Un 4xx/5xx ya
        // llego al servidor y reintentarlo no arregla nada.
        if (err.status !== 0) {
          return throwError(err);
        }
        return from(this.buscarBase()).pipe(
          mergeMap(base => {
            const url = this.reubicar(req.url, base);
            if (!url) {
              return throwError(err);
            }
            return next.handle(
              req.clone({
                url,
                setHeaders: { [CABECERA_REINTENTO]: '1' }
              })
            );
          })
        );
      })
    );
  }

  /**
   * Devuelve la base vigente tras un barrido. Si ya hay uno en vuelo lo
   * reutiliza; si el anterior fue hace menos de {@link ENFRIAMIENTO_MS} no
   * arranca otro (evita martillar la LAN cuando el servidor esta apagado).
   */
  private buscarBase(): Promise<string | null> {
    if (this.enCurso) {
      return this.enCurso;
    }
    const ahora = Date.now();
    if (ahora - this.ultimoIntento < ENFRIAMIENTO_MS) {
      return Promise.resolve(null);
    }
    this.ultimoIntento = ahora;
    this.enCurso = this.descubrimiento.reconectar(4500).then(
      base => { this.enCurso = null; return base; },
      () => { this.enCurso = null; return null; }
    );
    return this.enCurso;
  }

  /**
   * Cambia el prefijo de la URL por la base nueva. Devuelve `null` cuando no
   * hay nada que reescribir o cuando la base no cambio (no se reintenta).
   */
  private reubicar(url: string, base: string | null): string | null {
    if (!base) return null;
    const marca = '/api/v1';
    const corte = url.indexOf(marca);
    const corteBase = base.indexOf(marca);
    if (corte < 0 || corteBase < 0) return null;

    // `prefijo` es solo host:puerto; `/api/v1...` se conserva tal cual.
    const prefijoActual = url.slice(0, corte);
    const prefijoNuevo = base.slice(0, corteBase);
    if (prefijoActual === prefijoNuevo) return null;

    return prefijoNuevo + url.slice(corte);
  }

  /** Solo peticiones REST al backend; el sondeo de /health ya tiene su reintento. */
  private esReintentable(url: string): boolean {
    if (url.includes('/health')) return false;
    return url.startsWith(getApiBase()) || url.includes('/api/v1');
  }
}
