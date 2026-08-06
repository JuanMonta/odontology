import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Treatment, TreatmentCategory, TreatmentDraft } from '../../../core/models/treatment.model';
import { API_BASE } from '../../../core/config/api.config';

export const TREATMENT_CATEGORIES: TreatmentCategory[] = [
  'DIAGNÓSTICO',
  'PREVENCIÓN',
  'RESTAURADORA',
  'ENDODONCIA',
  'PERIODONCIA',
  'ORTODONCIA',
  'CIRUGÍA',
  'PRÓTESIS',
  'ESTÉTICA',
  'EMERGENCIA'
];

/**
 * Consume el backend REST de tratamientos (spring_backend → /api/v1/tratamientos).
 * Mantiene el mismo contrato Observable del mock para no tocar las vistas.
 */
@Injectable({ providedIn: 'root' })
export class TreatmentsHttpService {
  private readonly subjects = new BehaviorSubject<Treatment[]>([]);

  readonly treatments$: Observable<Treatment[]> = this.subjects.asObservable();

  constructor(private readonly http: HttpClient) {
    this.refresh();
  }

  refresh(): void {
    this.http.get<Treatment[]>(`${API_BASE}/tratamientos`).subscribe(list => this.subjects.next(list));
  }

  addTreatment(draft: TreatmentDraft): Observable<Treatment> {
    return this.http.post<Treatment>(`${API_BASE}/tratamientos`, draft).pipe(
      tap(created => this.subjects.next([created, ...this.subjects.getValue()]))
    );
  }

  updateTreatment(item: Treatment): void {
    this.http.put<Treatment>(`${API_BASE}/tratamientos/${item.code}`, item).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(t => (t.id === updated.id ? updated : t)));
    });
  }

  toggleActive(id: string): void {
    this.http.patch<Treatment>(`${API_BASE}/tratamientos/${id}/toggle-active`, null).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(t => (t.id === updated.id ? updated : t)));
    });
  }

  money(price: number): string {
    return `$ ${price.toLocaleString('en-US')}`;
  }
}
