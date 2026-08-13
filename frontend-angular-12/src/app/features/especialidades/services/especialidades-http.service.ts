import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { Especialidad, EspecialidadDraft } from '../../../core/models/especialidad.model';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

/**
 * Consume el backend REST de especialidades (spring_backend → /api/v1/especialidades).
 * Cada especialidad del catálogo se valida contra el roster de odontólogos.
 * Los nombres se almacenan en MAYÚSCULAS (como el catálogo de especialidades).
 */
@Injectable({ providedIn: 'root' })
export class EspecialidadesHttpService {
  private readonly subjects = new BehaviorSubject<Especialidad[]>([]);
  private readonly activasSub = new BehaviorSubject<Especialidad[]>([]);

  readonly especialidades$: Observable<Especialidad[]> = this.subjects.asObservable();
  readonly activas$: Observable<Especialidad[]> = this.activasSub.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    this.refreshActivas();
    status.reconnected$.subscribe(() => {
      this.refresh();
      this.refreshActivas();
    });
    status.onlineTick$
      .pipe(filter(() => this.subjects.getValue().length === 0))
      .subscribe(() => this.refresh());
  }

  snapshot(): Especialidad[] {
    return this.subjects.getValue();
  }

  refresh(): void {
    this.http.get<Especialidad[]>(`${API_BASE}/especialidades`).subscribe(list => this.subjects.next(list));
  }

  refreshActivas(): void {
    this.http.get<Especialidad[]>(`${API_BASE}/especialidades/activas`).subscribe(list => this.activasSub.next(list));
  }

  addEspecialidad(draft: EspecialidadDraft): Observable<Especialidad> {
    return this.http.post<Especialidad>(`${API_BASE}/especialidades`, draft).pipe(
      tap(created =>
        this.subjects.next([...this.subjects.getValue(), created].sort((a, b) => a.code.localeCompare(b.code)))
      )
    );
  }

  updateEspecialidad(item: Especialidad): void {
    this.http.put<Especialidad>(`${API_BASE}/especialidades/${item.code}`, item).subscribe(updated => {
      const list = this.subjects.getValue().map(e => (e.id === updated.id ? updated : e));
      this.subjects.next(list);
    });
  }

  toggleStatus(id: string): void {
    this.http.patch<Especialidad>(`${API_BASE}/especialidades/${id}/toggle-status`, null).subscribe(updated => {
      const list = this.subjects.getValue().map(e => (e.id === updated.id ? updated : e));
      this.subjects.next(list);
    });
  }
}
