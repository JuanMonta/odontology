import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import {
  timeout,
  catchError,
  switchMap,
  map,
  distinctUntilChanged,
  pairwise,
  filter
} from 'rxjs/operators';
import { getApiBase } from '../config/api.config';

export type BackendStatus = 'checking' | 'online' | 'offline';

/**
 * Sondea el backend Spring Boot (/api/v1/health) con timeout corto y
 * expone el estado de conexión de la app Angular con el servidor Java.
 * Se evita overlap: si una petición sigue en vuelo se descarta la siguiente.
 */
@Injectable({ providedIn: 'root' })
export class BackendStatusService {
  /**
   * Sondeo frecuente a proposito: cuando el servidor cambia de IP, cada sondeo
   * tarda el timeout TCP de Windows (~20 s) en fallar. Con 4 s y timeout de
   * 3 s la app pasa a "RECONECTANDO" enseguida y `AppComponent` lanza el
   * barrido de subred antes de que el usuario llegue a pulsar Guardar.
   */
  private static readonly POLL_INTERVAL_MS = 4000;
  private static readonly TIMEOUT_MS = 3000;

  private readonly statusSubject = new BehaviorSubject<BackendStatus>('checking');

  readonly status$: Observable<BackendStatus> = this.statusSubject.pipe(distinctUntilChanged());

  /** Emite en cada transición de conexión caída a conexión restablecida (offline → online). */
  readonly reconnected$: Observable<void> = this.status$.pipe(
    pairwise(),
    filter(([prev, curr]) => prev === 'offline' && curr === 'online'),
    map(() => undefined)
  );

  /**
   * Emite en cada sondeo exitoso mientras hay conexión (latido periódico).
   * Los services de datos se suscriben para refrescar automáticamente cuando
   * el backend vuelve a estar operativo y aún no tienen datos en caché.
   */
  readonly onlineTick$: Observable<void> = this.statusSubject.pipe(
    filter(status => status === 'online'),
    map(() => undefined)
  );

  get value(): BackendStatus {
    return this.statusSubject.getValue();
  }

  constructor(private readonly http: HttpClient) {
    this.start();
  }

  start(): void {
    timer(0, BackendStatusService.POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.probe())
      )
      .subscribe(status => this.statusSubject.next(status));
  }

  private probe(): Observable<BackendStatus> {
    // getApiBase() en cada sondeo: si el descubrimiento reubico el servidor
    // (IP nueva), el latido apunta alla sin reiniciar la app.
    return this.http
      .get<{ status: string }>(`${getApiBase()}/health`)
      .pipe(
        timeout(BackendStatusService.TIMEOUT_MS),
        map(body => (body?.status === 'UP' ? 'online' : 'offline')),
        catchError(() => [ 'offline' as BackendStatus ])
      );
  }
}
