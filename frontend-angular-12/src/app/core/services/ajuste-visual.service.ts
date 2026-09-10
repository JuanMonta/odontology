import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

export type TamanoTexto = 'normal' | 'grande' | 'muy-grande';

const FACTORES: Record<TamanoTexto, number> = {
  normal: 1,
  grande: 1.15,
  'muy-grande': 1.3
};

const CLAVE_BASE = 'saas.clinica.uiscale.';

/**
 * Escala tipográfica por operador. Multiplica la base (15px en body) vía
 * `--uiscale`, así toda la cadena `em` crece pareja sin reescribir componentes.
 * Persiste por código de usuario en localStorage (patrón borradorKey).
 */
@Injectable({ providedIn: 'root' })
export class AjusteVisualService {
  private readonly nivel$ = new BehaviorSubject<TamanoTexto>('normal');
  private codigoUsuario = 'anon';

  readonly nivelActual$: Observable<TamanoTexto> = this.nivel$.asObservable();

  constructor(auth: AuthStore) {
    auth.usuario$().subscribe(u => {
      this.codigoUsuario = u?.code || u?.username || 'anon';
      this.aplicar(this.leer());
    });
    this.aplicar(this.leer());
  }

  get nivel(): TamanoTexto {
    return this.nivel$.getValue();
  }

  fijar(nivel: TamanoTexto): void {
    try {
      localStorage.setItem(CLAVE_BASE + this.codigoUsuario, nivel);
    } catch {
      // almacenamiento no disponible: se aplica solo en memoria
    }
    this.aplicar(nivel);
  }

  private leer(): TamanoTexto {
    try {
      const raw = localStorage.getItem(CLAVE_BASE + this.codigoUsuario);
      if (raw === 'grande' || raw === 'muy-grande' || raw === 'normal') {
        return raw;
      }
    } catch {
      // sin almacenamiento: nivel por defecto
    }
    return 'normal';
  }

  private aplicar(nivel: TamanoTexto): void {
    document.documentElement.style.setProperty('--uiscale', String(FACTORES[nivel]));
    this.nivel$.next(nivel);
  }
}
