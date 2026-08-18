export type ConfigSection = 'clinica' | 'agenda' | 'sistema' | 'roles';

export interface ClinicaSettings {
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  horarioInicio: string;
  horarioFin: string;
  duracionCita: number;
  toleranciaRetraso: number;
  diasAtencion: string[];
  moneda: 'USD';
  formatoFecha: string;
  recordatorioCitas: boolean;
  notificacionUrgente: boolean;
  avisoVencimiento: boolean;
}

export interface ConfigSectionMeta {
  id: ConfigSection;
  label: string;
  sub: string;
}
