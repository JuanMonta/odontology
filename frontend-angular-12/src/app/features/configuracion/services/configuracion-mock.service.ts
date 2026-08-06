import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ClinicaSettings, ConfigSectionMeta } from '../../../core/models/clinica-settings.model';

export const CONFIG_SECTIONS: ConfigSectionMeta[] = [
  { id: 'clinica', label: 'DATOS DEL CONSULTORIO', sub: 'IDENTIDAD Y CONTACTO' },
  { id: 'agenda', label: 'AGENDA Y HORARIOS', sub: 'JORNADA Y TURNOS' },
  { id: 'sistema', label: 'SISTEMA Y NOTIFICACIONES', sub: 'PREFERENCIAS DEL MÓDULO' }
];

const DEFAULTS: ClinicaSettings = {
  nombre: 'SAS ODONTO S.A.C.',
  ruc: '20512345678',
  direccion: 'AV. LARCO 1250, MIRAFLORES, LIMA',
  telefono: '+51 987 654 321',
  email: 'contacto@sasodonto.com',
  horarioInicio: '08:00',
  horarioFin: '18:00',
  duracionCita: 45,
  toleranciaRetraso: 15,
  diasAtencion: ['LU', 'MA', 'MI', 'JU', 'VI'],
  moneda: 'USD',
  formatoFecha: 'DD MMM AAAA',
  recordatorioCitas: true,
  notificacionUrgente: true,
  avisoVencimiento: true
};

@Injectable({ providedIn: 'root' })
export class ConfiguracionMockService {
  private readonly subjects = new BehaviorSubject<ClinicaSettings>({ ...DEFAULTS });

  readonly settings$: Observable<ClinicaSettings> = this.subjects.asObservable();

  snapshot(): ClinicaSettings {
    return this.subjects.getValue();
  }

  save(settings: ClinicaSettings): void {
    this.subjects.next({ ...settings });
  }
}
