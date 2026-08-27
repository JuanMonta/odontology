import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE } from '../../../core/config/api.config';
import { Evolucion, EvolucionDraft, Hcl, HojaResumen } from '../../../core/models/hcl.model';

@Injectable({ providedIn: 'root' })
export class HclHttpService {
  constructor(private readonly http: HttpClient) {}

  /** Hoja 1 (por compatibilidad con vistas que sólo leen la primera hoja). */
  get(pacienteId: string): Observable<Hcl> {
    return this.http.get<Hcl>(`${API_BASE}/pacientes/${pacienteId}/hclinica`).pipe(
      map(this.fromBackend)
    );
  }

  getHoja(pacienteId: string, hoja: number): Observable<Hcl> {
    return this.http.get<Hcl>(`${API_BASE}/pacientes/${pacienteId}/hclinica/${hoja}`).pipe(
      map(this.fromBackend)
    );
  }

  listarHojas(pacienteId: string): Observable<HojaResumen[]> {
    return this.http.get<HojaResumen[]>(`${API_BASE}/pacientes/${pacienteId}/hclinica/hojas`);
  }

  save(pacienteId: string, hc: Hcl): Observable<Hcl> {
    return this.http.put<Hcl>(`${API_BASE}/pacientes/${pacienteId}/hclinica/${hc.hoja}`, this.toBackend(hc));
  }

  listarEvolucion(pacienteId: string): Observable<Evolucion[]> {
    return this.http.get<Evolucion[]>(`${API_BASE}/pacientes/${pacienteId}/evolucion`);
  }

  guardarEvolucion(pacienteId: string, dto: EvolucionDraft): Observable<Evolucion> {
    return this.http.post<Evolucion>(`${API_BASE}/pacientes/${pacienteId}/evolucion`, dto);
  }

  private fromBackend = (raw: any): Hcl => {
    if (!raw) return raw;
    return {
      ...raw,
      // CPO: camelCase -> snake_case
      indicesCpo: this.mapCpo(raw.indicesCpo),
      // Sextantes: camelCase -> snake_case
      higieneSextantes: (raw.higieneSextantes || []).map(this.mapSextanteFromBackend),
    };
  };

  private toBackend = (hc: Hcl): any => {
    return {
      ...hc,
      // CPO: snake_case -> camelCase
      indicesCpo: this.mapCpoToBackend(hc.indicesCpo),
      // Sextantes: snake_case -> camelCase
      higieneSextantes: (hc.higieneSextantes || []).map(this.mapSextanteToBackend),
    };
  };

  private mapCpo = (c: any): any => {
    if (!c) return c;
    return {
      c_perma: c.cPerma ?? c.c_perma,
      p_perma: c.pPerma ?? c.p_perma,
      o_perma: c.oPerma ?? c.o_perma,
      total_perma: c.totalPerma ?? c.total_perma,
      c_deci: c.cDeci ?? c.c_deci,
      e_deci: c.eDeci ?? c.e_deci,
      o_deci: c.oDeci ?? c.o_deci,
      total_deci: c.totalDeci ?? c.total_deci,
    };
  };

  private mapCpoToBackend = (c: any): any => {
    if (!c) return c;
    return {
      cPerma: c.c_perma ?? c.cPerma,
      pPerma: c.p_perma ?? c.pPerma,
      oPerma: c.o_perma ?? c.oPerma,
      totalPerma: c.total_perma ?? c.totalPerma,
      cDeci: c.c_deci ?? c.cDeci,
      eDeci: c.e_deci ?? c.eDeci,
      oDeci: c.o_deci ?? c.oDeci,
      totalDeci: c.total_deci ?? c.totalDeci,
    };
  };

  private mapSextanteFromBackend = (s: any): any => {
    if (!s) return s;
    return {
      sextante: s.sextante,
      d1_evaluado: s.d1Evaluado ?? s.d1_evaluado,
      d2_evaluado: s.d2Evaluado ?? s.d2_evaluado,
      d3_evaluado: s.d3Evaluado ?? s.d3_evaluado,
      placa: s.placa,
      calculo: s.calculo,
      gingivitis: s.gingivitis,
    };
  };

  private mapSextanteToBackend = (s: any): any => {
    if (!s) return s;
    return {
      sextante: s.sextante,
      d1Evaluado: s.d1_evaluado ?? s.d1Evaluado,
      d2Evaluado: s.d2_evaluado ?? s.d2Evaluado,
      d3Evaluado: s.d3_evaluado ?? s.d3Evaluado,
      placa: s.placa,
      calculo: s.calculo,
      gingivitis: s.gingivitis,
    };
  };
}