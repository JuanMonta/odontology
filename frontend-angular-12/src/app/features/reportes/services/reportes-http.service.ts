import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import {
  ReporteCartera,
  ReporteFlujo,
  ReporteProduccion
} from '../../../core/models/reporte.model';

/**
 * Reportes financieros (Fase 1). Consume el backend REST read-only
 * (/api/v1/reportes). El rango (desde/hasta, ISO yyyy-MM-dd) es opcional:
 * sin él el backend toma el mes en curso.
 */
@Injectable({ providedIn: 'root' })
export class ReportesHttpService {
  constructor(private readonly http: HttpClient) {}

  produccionTratamiento(desde: string, hasta: string): Observable<ReporteProduccion> {
    return this.http.get<ReporteProduccion>(
      `${API_BASE}/reportes/produccion-tratamiento`,
      { params: this.rango(desde, hasta) }
    );
  }

  produccionOdontologo(desde: string, hasta: string): Observable<ReporteProduccion> {
    return this.http.get<ReporteProduccion>(
      `${API_BASE}/reportes/produccion-odontologo`,
      { params: this.rango(desde, hasta) }
    );
  }

  produccionConsultorio(desde: string, hasta: string): Observable<ReporteProduccion> {
    return this.http.get<ReporteProduccion>(
      `${API_BASE}/reportes/produccion-consultorio`,
      { params: this.rango(desde, hasta) }
    );
  }

  flujoCaja(desde: string, hasta: string): Observable<ReporteFlujo> {
    return this.http.get<ReporteFlujo>(`${API_BASE}/reportes/flujo-caja`, {
      params: this.rango(desde, hasta)
    });
  }

  cartera(): Observable<ReporteCartera> {
    return this.http.get<ReporteCartera>(`${API_BASE}/reportes/cartera`);
  }

  private rango(desde: string, hasta: string): HttpParams {
    return new HttpParams().set('desde', desde).set('hasta', hasta);
  }
}