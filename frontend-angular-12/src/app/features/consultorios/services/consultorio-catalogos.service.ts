import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

export interface ConsultorioCatalogos {
  unidades: string[];
  ubicaciones: string[];
  equipos: string[];
}

/**
 * Catálogos (unidades, ubicaciones, equipos) para los selects del formulario
 * de consultorios. Única fuente de verdad → spring_backend /consultorios/catalogos.
 */
@Injectable({ providedIn: 'root' })
export class ConsultorioCatalogosService {
  private readonly subject = new BehaviorSubject<ConsultorioCatalogos>({
    unidades: [],
    ubicaciones: [],
    equipos: []
  });

  readonly catalogos$: Observable<ConsultorioCatalogos> = this.subject.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    status.reconnected$.subscribe(() => this.refresh());
  }

  refresh(): void {
    this.http.get<ConsultorioCatalogos>(`${API_BASE}/consultorios/catalogos`).subscribe(data => {
      this.subject.next(data);
    });
  }
}
