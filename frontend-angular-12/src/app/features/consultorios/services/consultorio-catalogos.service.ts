import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
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

export interface Unidad {
  id: string;
  code: string;
  nombre: string;
  tipo: string;
  activo: boolean;
}

export interface UnidadDraft {
  nombre: string;
  tipo: string;
}

export interface Ubicacion {
  id: string;
  code: string;
  nombre: string;
  activo: boolean;
}

export interface UbicacionDraft {
  nombre: string;
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
 * Las unidades y ubicaciones se gestionan (crear/editar/baja lógica) desde el propio form
 * vía /unidades y /ubicaciones; cada mutación refresca el catálogo de selects.
 */
@Injectable({ providedIn: 'root' })
export class ConsultorioCatalogosService {
  private readonly subject = new BehaviorSubject<ConsultorioCatalogos>({
    unidades: [],
    ubicaciones: [],
    equipos: [],
    tratamientos: []
  });

  private readonly unidadesSubject = new BehaviorSubject<Unidad[]>([]);
  private readonly ubicacionesSubject = new BehaviorSubject<Ubicacion[]>([]);

  readonly catalogos$: Observable<ConsultorioCatalogos> = this.subject.asObservable();
  readonly unidades$: Observable<Unidad[]> = this.unidadesSubject.asObservable();
  readonly ubicaciones$: Observable<Ubicacion[]> = this.ubicacionesSubject.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    this.refreshUnidades();
    this.refreshUbicaciones();
    status.reconnected$.subscribe(() => {
      this.refresh();
      this.refreshUnidades();
      this.refreshUbicaciones();
    });
  }

  snapshotUnidades(): Unidad[] {
    return this.unidadesSubject.getValue();
  }

  snapshotUbicaciones(): Ubicacion[] {
    return this.ubicacionesSubject.getValue();
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

  refreshUnidades(): void {
    this.http.get<Unidad[]>(`${API_BASE}/unidades`).subscribe(list => this.unidadesSubject.next(list));
  }

  refreshUbicaciones(): void {
    this.http.get<Ubicacion[]>(`${API_BASE}/ubicaciones`).subscribe(list => this.ubicacionesSubject.next(list));
  }

  addUnidad(draft: UnidadDraft): Observable<Unidad> {
    return this.http.post<Unidad>(`${API_BASE}/unidades`, draft).pipe(
      tap(() => {
        this.refreshUnidades();
        this.refresh();
      })
    );
  }

  updateUnidad(item: Unidad): Observable<Unidad> {
    return this.http.put<Unidad>(`${API_BASE}/unidades/${item.code}`, item).pipe(
      tap(() => {
        this.refreshUnidades();
        this.refresh();
      })
    );
  }

  toggleUnidadStatus(code: string): Observable<Unidad> {
    return this.http.patch<Unidad>(`${API_BASE}/unidades/${code}/toggle-status`, {}).pipe(
      tap(() => {
        this.refreshUnidades();
        this.refresh();
      })
    );
  }

  addUbicacion(draft: UbicacionDraft): Observable<Ubicacion> {
    return this.http.post<Ubicacion>(`${API_BASE}/ubicaciones`, draft).pipe(
      tap(() => {
        this.refreshUbicaciones();
        this.refresh();
      })
    );
  }

  updateUbicacion(item: Ubicacion): Observable<Ubicacion> {
    return this.http.put<Ubicacion>(`${API_BASE}/ubicaciones/${item.code}`, item).pipe(
      tap(() => {
        this.refreshUbicaciones();
        this.refresh();
      })
    );
  }

  toggleUbicacionStatus(code: string): Observable<Ubicacion> {
    return this.http.patch<Ubicacion>(`${API_BASE}/ubicaciones/${code}/toggle-status`, {}).pipe(
      tap(() => {
        this.refreshUbicaciones();
        this.refresh();
      })
    );
  }
}