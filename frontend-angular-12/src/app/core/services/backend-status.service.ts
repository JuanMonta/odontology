import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { timeout, catchError, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { API_BASE } from '../config/api.config';

export type BackendStatus = 'checking' | 'online' | 'offline';

/**
 * Sondea el backend Spring Boot (/api/v1/health) con timeout corto y
 * expone el estado de conexión de la app Angular con el servidor Java.
 * Se evita overlap: si una petición sigue en vuelo se descarta la siguiente.
 */
@Injectable({ providedIn: 'root' })
export class BackendStatusService {
  private static readonly POLL_INTERVAL_MS = 8000;
  private static readonly TIMEOUT_MS = 3500;

  private readonly statusSubject = new BehaviorSubject<BackendStatus>('checking');

  readonly status$: Observable<BackendStatus> = this.statusSubject.pipe(distinctUntilChanged());

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
    return this.http
      .get<{ status: string }>(`${API_BASE}/health`)
      .pipe(
        timeout(BackendStatusService.TIMEOUT_MS),
        map(body => (body?.status === 'UP' ? 'online' : 'offline')),
        catchError(() => [ 'offline' as BackendStatus ])
      );
  }
}
