import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { Odontologo, OdontologoDraft } from '../../../core/models/odontologo.model';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

export const SPECIALTIES: string[] = [
  'CIRUGÍA ORAL',
  'ORTODONCIA',
  'PERIODONCIA',
  'ENDODONCIA',
  'ODONTOPEDIATRÍA',
  'REHABILITACIÓN ORAL'
];

/**
 * Consume el backend REST de odontólogos (spring_backend → /api/v1/odontologos).
 * Mantiene el mismo contrato Observable del mock para no tocar las vistas.
 */
@Injectable({ providedIn: 'root' })
export class OdontologosHttpService {
  private readonly subjects = new BehaviorSubject<Odontologo[]>([]);

  readonly odontologos$: Observable<Odontologo[]> = this.subjects.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    status.reconnected$.subscribe(() => this.refresh());
    status.onlineTick$
      .pipe(filter(() => this.subjects.getValue().length === 0))
      .subscribe(() => this.refresh());
  }

  snapshot(): Odontologo[] {
    return this.subjects.getValue();
  }

  refresh(): void {
    this.http.get<Odontologo[]>(`${API_BASE}/odontologos`).subscribe(list => this.subjects.next(list));
  }

  addOdontologo(draft: OdontologoDraft): Observable<Odontologo> {
    return this.http.post<Odontologo>(`${API_BASE}/odontologos`, draft).pipe(
      tap(created => this.subjects.next([created, ...this.subjects.getValue()]))
    );
  }

  updateOdontologo(item: Odontologo): void {
    this.http.put<Odontologo>(`${API_BASE}/odontologos/${item.code}`, item).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(o => (o.id === updated.id ? updated : o)));
    });
  }

  toggleStatus(id: string): void {
    this.http.patch<Odontologo>(`${API_BASE}/odontologos/${id}/toggle-status`, null).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(o => (o.id === updated.id ? updated : o)));
    });
  }
}
