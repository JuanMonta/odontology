import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

export interface ConsultorioEquipoCatalogo {
  codigo: string;
  nombre: string;
  categoria: string;
}

export interface TratamientoSimple {
  code: string;
  name: string;
  categoryCode: string;
  category: string;
}

export interface ConsultorioCatalogos {
  unidades: string[];
  ubicaciones: string[];
  equipos: ConsultorioEquipoCatalogo[];
  tratamientos: TratamientoSimple[];
}

/**
 * Catálogos (unidades, ubicaciones, equipos, tratamientos) para los selects del formulario
 * de consultorios. Única fuente de verdad → spring_backend /consultorios/catalogos.
 */
@Injectable({ providedIn: 'root' })
export class ConsultorioCatalogosService {
  private readonly subject = new BehaviorSubject<ConsultorioCatalogos>({
    unidades: [],
    ubicaciones: [],
    equipos: [],
    tratamientos: []
  });

  readonly catalogos$: Observable<ConsultorioCatalogos> = this.subject.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    status.reconnected$.subscribe(() => this.refresh());
  }

  refresh(): void {
    this.http.get<ConsultorioCatalogos>(`${API_BASE}/consultorios/catalogos`).subscribe({
      next: data => {
        console.log('[ConsultorioCatalogosService] Catalogos loaded:', {
          unidades: data.unidades.length,
          ubicaciones: data.ubicaciones.length,
          equipos: data.equipos.length,
          tratamientos: data.tratamientos.length
        });
        this.subject.next(data);
      },
      error: err => {
        console.error('[ConsultorioCatalogosService] Failed to load catalogos:', err);
      }
    });
  }
}
