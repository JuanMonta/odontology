import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { Turno, TurnoDraft } from '../../../core/models/turno.model';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

/**
 * Consume el backend REST de turnos (spring_backend → /api/v1/turnos).
 * Cada turno define la jornada laboral (inicio/fin) y la pausa de almuerzo.
 * El backend expone las horas como "HH:MM:SS"; aquí se normalizan a "HH:MM".
 */
@Injectable({ providedIn: 'root' })
export class TurnosHttpService {
  private readonly subjects = new BehaviorSubject<Turno[]>([]);
  private readonly activosSub = new BehaviorSubject<Turno[]>([]);

  readonly turnos$: Observable<Turno[]> = this.subjects.asObservable();
  readonly activos$: Observable<Turno[]> = this.activosSub.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    this.refreshActivos();
    status.reconnected$.subscribe(() => {
      this.refresh();
      this.refreshActivos();
    });
    status.onlineTick$
      .pipe(filter(() => this.subjects.getValue().length === 0))
      .subscribe(() => this.refresh());
  }

  snapshot(): Turno[] {
    return this.subjects.getValue();
  }

  refresh(): void {
    this.http
      .get<Turno[]>(`${API_BASE}/turnos`)
      .pipe(map(list => list.map(normalizar)))
      .subscribe(list => this.subjects.next(list));
  }

  refreshActivos(): void {
    this.http
      .get<Turno[]>(`${API_BASE}/turnos/activos`)
      .pipe(map(list => list.map(normalizar)))
      .subscribe(list => this.activosSub.next(list));
  }

  addTurno(draft: TurnoDraft): Observable<Turno> {
    return this.http.post<Turno>(`${API_BASE}/turnos`, draft).pipe(
      tap(created => this.subjects.next([...this.subjects.getValue(), normalizar(created)].sort((a, b) => a.code.localeCompare(b.code))))
    );
  }

  updateTurno(item: Turno): void {
    this.http.put<Turno>(`${API_BASE}/turnos/${item.code}`, item).subscribe(updated => {
      const list = this.subjects.getValue().map(t => (t.id === updated.id ? normalizar(updated) : t));
      this.subjects.next(list);
    });
  }

  toggleStatus(id: string): void {
    this.http.patch<Turno>(`${API_BASE}/turnos/${id}/toggle-status`, null).subscribe(updated => {
      const list = this.subjects.getValue().map(t => (t.id === updated.id ? normalizar(updated) : t));
      this.subjects.next(list);
    });
  }
}

function normalizar(t: Turno): Turno {
  return {
    ...t,
    horaInicio: t.horaInicio.slice(0, 5),
    horaFin: t.horaFin.slice(0, 5),
    descansoInicio: t.descansoInicio ? t.descansoInicio.slice(0, 5) : null,
    descansoFin: t.descansoFin ? t.descansoFin.slice(0, 5) : null
  };
}
