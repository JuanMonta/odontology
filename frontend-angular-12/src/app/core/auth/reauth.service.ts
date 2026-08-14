import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';

export type ReauthResult = 'ok' | 'cancel';

/**
 * Orquesta el reinicio de sesión tras un 401. El interceptor de errores abre
 * el prompt (modal con difuminado) y espera aquí el resultado; la UI sigue viva
 * detrás, sin navegación, para no perder el estado del formulario en curso.
 */
@Injectable({ providedIn: 'root' })
export class ReauthService {
  private readonly visible$ = new BehaviorSubject<boolean>(false);
  private readonly resultado$ = new BehaviorSubject<ReauthResult | null>(null);

  visible(): Observable<boolean> {
    return this.visible$.asObservable();
  }

  iniciar(): void {
    this.resultado$.next(null);
    this.visible$.next(true);
  }

  completado(): void {
    this.resultado$.next('ok');
    this.visible$.next(false);
  }

  cancelar(): void {
    this.resultado$.next('cancel');
    this.visible$.next(false);
  }

  esperarResultado(): Observable<ReauthResult> {
    return this.resultado$.pipe(
      filter((r): r is ReauthResult => r !== null),
      take(1)
    );
  }
}