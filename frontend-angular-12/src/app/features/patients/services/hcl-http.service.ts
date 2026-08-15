import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { Hcl, HojaResumen } from '../../../core/models/hcl.model';

/**
 * Persistencia REST de la historia clínica Formulario 033.
 * Una historia clínica tiene varias hojas (continuaciones): la clave compuesta
 * (paciente, hoja) se expone como GET/PUT /api/v1/pacientes/{id}/hclinica[/{hoja}].
 */
@Injectable({ providedIn: 'root' })
export class HclHttpService {
  constructor(private readonly http: HttpClient) {}

  /** Hoja 1 (por compatibilidad con vistas que sólo leen la primera hoja). */
  get(pacienteId: string): Observable<Hcl> {
    return this.http.get<Hcl>(`${API_BASE}/pacientes/${pacienteId}/hclinica`);
  }

  getHoja(pacienteId: string, hoja: number): Observable<Hcl> {
    return this.http.get<Hcl>(`${API_BASE}/pacientes/${pacienteId}/hclinica/${hoja}`);
  }

  listarHojas(pacienteId: string): Observable<HojaResumen[]> {
    return this.http.get<HojaResumen[]>(`${API_BASE}/pacientes/${pacienteId}/hclinica/hojas`);
  }

  save(pacienteId: string, hc: Hcl): Observable<Hcl> {
    return this.http.put<Hcl>(`${API_BASE}/pacientes/${pacienteId}/hclinica/${hc.hoja}`, hc);
  }
}