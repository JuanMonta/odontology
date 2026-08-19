export type TipoReporte =
  | 'produccion-tratamiento'
  | 'produccion-odontologo'
  | 'produccion-consultorio'
  | 'flujo-caja'
  | 'cartera';

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