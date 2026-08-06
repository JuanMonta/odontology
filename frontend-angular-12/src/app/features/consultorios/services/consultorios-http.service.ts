import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Consultorio, ConsultorioDraft } from '../../../core/models/consultorio.model';
import { API_BASE } from '../../../core/config/api.config';

/**
 * Consume el backend REST de consultorios (spring_backend → /api/v1/consultorios).
 * Mantiene el mismo contrato Observable del mock para no tocar las vistas.
 */
@Injectable({ providedIn: 'root' })
export class ConsultoriosHttpService {
  private readonly subjects = new BehaviorSubject<Consultorio[]>([]);

  readonly consultorios$: Observable<Consultorio[]> = this.subjects.asObservable();

  constructor(private readonly http: HttpClient) {
    this.refresh();
  }

  snapshot(): Consultorio[] {
    return this.subjects.getValue();
  }

  refresh(): void {
    this.http.get<Consultorio[]>(`${API_BASE}/consultorios`).subscribe(list => this.subjects.next(list));
  }

  addConsultorio(draft: ConsultorioDraft): Observable<Consultorio> {
    return this.http.post<Consultorio>(`${API_BASE}/consultorios`, draft).pipe(
      tap(created => this.subjects.next([created, ...this.subjects.getValue()]))
    );
  }

  updateConsultorio(item: Consultorio): void {
    this.http.put<Consultorio>(`${API_BASE}/consultorios/${item.code}`, item).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(c => (c.id === updated.id ? updated : c)));
    });
  }

  toggleStatus(id: string): void {
    this.http.patch<Consultorio>(`${API_BASE}/consultorios/${id}/toggle-status`, null).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(c => (c.id === updated.id ? updated : c)));
    });
  }
}
