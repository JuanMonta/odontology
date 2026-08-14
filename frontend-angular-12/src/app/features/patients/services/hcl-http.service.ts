import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { Hcl } from '../../../core/models/hcl.model';

/**
 * Persistencia REST de la historia clínica Formulario 033
 * (GET/PUT /api/v1/pacientes/{id}/hclinica).
 */
@Injectable({ providedIn: 'root' })
export class HclHttpService {
  constructor(private readonly http: HttpClient) {}

  get(pacienteId: string): Observable<Hcl> {
    return this.http.get<Hcl>(`${API_BASE}/pacientes/${pacienteId}/hclinica`);
  }

  save(pacienteId: string, hc: Hcl): Observable<Hcl> {
    return this.http.put<Hcl>(`${API_BASE}/pacientes/${pacienteId}/hclinica`, hc);
  }
}