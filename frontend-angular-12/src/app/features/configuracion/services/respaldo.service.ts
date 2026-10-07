import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';

export interface RespaldoResponse {
  ok: boolean;
  mensaje: string;
  archivo: string;
  bytes: number;
  generadoEn: string;
  bindAddress: string | null;
  advertencia: string | null;
}

export interface RespaldoRequest {
  username?: string;
  password?: string;
}

export interface RespaldoJob {
  jobId: string;
  estado: 'EN_PROGRESO' | 'COMPLETADO' | 'FALLADO';
  mensaje: string;
  archivo: string | null;
  bytes: number | null;
  generadoEn: string | null;
  iniciadoEn: string;
  bindAddress: string | null;
  advertencia: string | null;
  error: string | null;
  progreso: number;
}

@Injectable({ providedIn: 'root' })
export class RespaldoService {
  constructor(private http: HttpClient) {}

  crear(body: RespaldoRequest = {}): Observable<RespaldoJob> {
    return this.http.post<RespaldoJob>(`${API_BASE}/respaldos`, body);
  }

  estado(jobId: string): Observable<RespaldoJob> {
    return this.http.get<RespaldoJob>(`${API_BASE}/respaldos/${jobId}`);
  }

  descargarUrl(archivo: string): string {
    return `${API_BASE}/respaldos/descargar/${encodeURIComponent(archivo)}`;
  }
}
