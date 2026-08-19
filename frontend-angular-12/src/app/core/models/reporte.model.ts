export type TipoReporte =
  | 'produccion-tratamiento'
  | 'produccion-odontologo'
  | 'produccion-consultorio'
  | 'flujo-caja'
  | 'cartera'
  | 'citas-consultorio'
  | 'citas-odontologo'
  | 'citas-perdidas'
  | 'pacientes-atendidos';

export interface ReporteProduccionItem {
  codigo: string;
  nombre: string;
  grupo: string;
  cantidad: number;
  total: number;
  porcentaje: number;
}

export interface ReporteProduccion {
  items: ReporteProduccionItem[];
  totalCantidad: number;
  total: number;
  desde: string;
  hasta: string;
}

export interface ReporteFlujoItem {
  fecha: string;
  cargos: number;
  pagos: number;
  neto: number;
}

export interface ReporteFlujo {
  porDia: ReporteFlujoItem[];
  totalCargos: number;
  totalPagos: number;
  totalNeto: number;
  pagosEfectivo: number;
  pagosTarjeta: number;
  desde: string;
  hasta: string;
}

export interface ReporteCarteraItem {
  pacienteId: string;
  paciente: string;
  saldo: number;
  ultimoMovimiento: string;
}

export interface ReporteCartera {
  deudores: ReporteCarteraItem[];
  totalDeudores: number;
  totalCartera: number;
}

export interface ReporteOperacionItem {
  codigo: string;
  nombre: string;
  grupo: string;
  programadas: number;
  atendidas: number;
  noShow: number;
  canceladas: number;
  enProceso: number;
  ocupacion: number;
}

export interface ReporteOperacion {
  items: ReporteOperacionItem[];
  totalProgramadas: number;
  totalAtendidas: number;
  totalNoShow: number;
  totalCanceladas: number;
  totalEnProceso: number;
  ocupacionGlobal: number;
  desde: string;
  hasta: string;
}

export interface ReporteCitaPerdida {
  id: string;
  pacienteId: string;
  paciente: string;
  fecha: string;
  hora: string;
  tratamiento: string;
  consultorio: string;
  odontologo: string;
  estado: string;
}

export interface ReporteCitasPerdidas {
  items: ReporteCitaPerdida[];
  totalNoShow: number;
  totalCanceladas: number;
  totalPerdidas: number;
  desde: string;
  hasta: string;
}

export interface ReportePacienteAtendido {
  pacienteId: string;
  paciente: string;
  atenciones: number;
  ultimaFecha: string;
}

export interface ReportePacientesAtendidos {
  items: ReportePacienteAtendido[];
  pacientesUnicos: number;
  totalAtenciones: number;
  desde: string;
  hasta: string;
}