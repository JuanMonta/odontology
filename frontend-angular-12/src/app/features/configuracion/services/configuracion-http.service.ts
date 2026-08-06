import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { ClinicaSettings, ConfigSectionMeta } from '../../../core/models/clinica-settings.model';
import { API_BASE } from '../../../core/config/api.config';

export const CONFIG_SECTIONS: ConfigSectionMeta[] = [
  { id: 'clinica', label: 'DATOS DEL CONSULTORIO', sub: 'IDENTIDAD Y CONTACTO' },
  { id: 'agenda', label: 'AGENDA Y HORARIOS', sub: 'JORNADA Y TURNOS' },
  { id: 'sistema', label: 'SISTEMA Y NOTIFICACIONES', sub: 'PREFERENCIAS DEL MÓDULO' }
];

/**
 * Consume el backend REST de configuración (spring_backend → /api/v1/configuracion).
 * Mantiene el mismo contrato Observable del mock para no tocar las vistas.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracionHttpService {
  private readonly subjects = new BehaviorSubject<ClinicaSettings | null>(null);

  readonly settings$: Observable<ClinicaSettings | null> = this.subjects.asObservable();

  constructor(private readonly http: HttpClient) {
    this.refresh();
  }

  refresh(): void {
    this.http.get<ClinicaSettings>(`${API_BASE}/configuracion`).subscribe(settings => this.subjects.next(settings));
  }

  save(settings: ClinicaSettings): void {
    this.http.put<ClinicaSettings>(`${API_BASE}/configuracion`, settings).subscribe(saved => {
      this.subjects.next(saved);
    });
  }
}
