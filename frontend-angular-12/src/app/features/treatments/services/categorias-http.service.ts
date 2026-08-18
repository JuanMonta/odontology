import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

export interface Categoria {
  id: string;
  code: string;
  nombre: string;
  activo: boolean;
}

export interface CategoriaDraft {
  nombre: string;
}

/**
 * Consume el backend REST de categorías de tratamiento (spring_backend → /api/v1/categorias).
 * Mantiene el mismo contrato Observable del mock para no tocar las vistas.
 */
@Injectable({ providedIn: 'root' })
export class CategoriasHttpService {
  private readonly subjects = new BehaviorSubject<Categoria[]>([]);

  readonly categorias$: Observable<Categoria[]> = this.subjects.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    status.reconnected$.subscribe(() => this.refresh());
    status.onlineTick$
      .pipe(filter(() => this.subjects.getValue().length === 0))
      .subscribe(() => this.refresh());
  }

  snapshot(): Categoria[] {
    return this.subjects.getValue();
  }

  refresh(): void {
    this.http.get<Categoria[]>(`${API_BASE}/categorias`).subscribe(list => this.subjects.next(list));
  }

  addCategoria(draft: CategoriaDraft): Observable<Categoria> {
    return this.http.post<Categoria>(`${API_BASE}/categorias`, draft).pipe(
      tap(created => this.subjects.next([created, ...this.subjects.getValue()]))
    );
  }

  updateCategoria(item: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${API_BASE}/categorias/${item.code}`, item).pipe(
      tap(updated => this.subjects.next(this.subjects.getValue().map(c => c.code === updated.code ? updated : c)))
    );
  }

  toggleStatus(code: string): Observable<Categoria> {
    return this.http.patch<Categoria>(`${API_BASE}/categorias/${code}/toggle-status`, {}).pipe(
      tap(updated => this.subjects.next(this.subjects.getValue().map(c => c.code === updated.code ? updated : c)))
    );
  }
}
