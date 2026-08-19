import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportesHttpService } from '../../services/reportes-http.service';
import {
  ReporteCartera,
  ReporteCitasPerdidas,
  ReporteFlujo,
  ReporteOperacion,
  ReporteOperacionItem,
  ReportePacientesAtendidos,
  ReporteProduccion,
  ReporteProduccionItem,
  TipoReporte
} from '../../../../core/models/reporte.model';

type ReporteResultado =
  | ReporteProduccion
  | ReporteFlujo
  | ReporteCartera
  | ReporteOperacion
  | ReporteCitasPerdidas
  | ReportePacientesAtendidos;

interface TipoReporteOption {
  id: TipoReporte;
  label: string;
  corta: string;
}

const TIPOS: TipoReporteOption[] = [
  { id: 'produccion-tratamiento', label: 'PRODUCCIÓN POR TRATAMIENTO', corta: 'Producción por tratamiento' },
  { id: 'produccion-odontologo', label: 'PRODUCCIÓN POR ODONTÓLOGO', corta: 'Producción por odontólogo' },
  { id: 'produccion-consultorio', label: 'PRODUCCIÓN POR CONSULTORIO', corta: 'Producción por consultorio' },
  { id: 'flujo-caja', label: 'FLUJO DE CAJA', corta: 'Flujo de caja' },
  { id: 'cartera', label: 'CARTERA / DEUDORES', corta: 'Cartera de deudores' },
  { id: 'citas-consultorio', label: 'CITAS POR CONSULTORIO', corta: 'Citas por consultorio' },
  { id: 'citas-odontologo', label: 'CITAS POR ODONTÓLOGO', corta: 'Citas por odontólogo' },
  { id: 'citas-perdidas', label: 'CITAS PERDIDAS (NO-SHOW / CANCELADAS)', corta: 'Citas perdidas' },
  { id: 'pacientes-atendidos', label: 'PACIENTES ATENDIDOS', corta: 'Pacientes atendidos' }
];

function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

@Component({
  selector: 'app-reportes-page',
  templateUrl: './reportes-page.component.html',
  styleUrls: ['./reportes-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesPageComponent {
  readonly tipos = TIPOS;

  tipo: TipoReporte = 'produccion-tratamiento';
  desde = iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  hasta = iso(new Date());

  resultado: ReporteResultado | null = null;
  cargando = false;
  error = '';

  constructor(
    private readonly service: ReportesHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get option(): TipoReporteOption {
    return TIPOS.find(t => t.id === this.tipo) ?? TIPOS[0];
  }

  get esProduccion(): boolean {
    return this.tipo === 'produccion-tratamiento' ||
      this.tipo === 'produccion-odontologo' ||
      this.tipo === 'produccion-consultorio';
  }

  get esFlujo(): boolean {
    return this.tipo === 'flujo-caja';
  }

  get esCartera(): boolean {
    return this.tipo === 'cartera';
  }

  get produccion(): ReporteProduccion | null {
    return this.esProduccion ? (this.resultado as ReporteProduccion) : null;
  }

  get flujo(): ReporteFlujo | null {
    return this.esFlujo ? (this.resultado as ReporteFlujo) : null;
  }

  get cartera(): ReporteCartera | null {
    return this.esCartera ? (this.resultado as ReporteCartera) : null;
  }

  get esOperacion(): boolean {
    return this.tipo === 'citas-consultorio' || this.tipo === 'citas-odontologo';
  }

  get esCitasPerdidas(): boolean {
    return this.tipo === 'citas-perdidas';
  }

  get esAtendidos(): boolean {
    return this.tipo === 'pacientes-atendidos';
  }

  get operacion(): ReporteOperacion | null {
    return this.esOperacion ? (this.resultado as ReporteOperacion) : null;
  }

  get citasPerdidas(): ReporteCitasPerdidas | null {
    return this.esCitasPerdidas ? (this.resultado as ReporteCitasPerdidas) : null;
  }

  get atendidos(): ReportePacientesAtendidos | null {
    return this.esAtendidos ? (this.resultado as ReportePacientesAtendidos) : null;
  }

  onTipo(): void {
    this.resultado = null;
    this.error = '';
    this.cdr.markForCheck();
  }

  generar(): void {
    if (!this.desde || !this.hasta) {
      this.error = 'SELECCIONA EL RANGO DE FECHAS';
      this.cdr.markForCheck();
      return;
    }
    this.cargando = true;
    this.error = '';
    this.resultado = null;
    this.cdr.markForCheck();

    const sub = this.consulta().subscribe({
      next: (r: ReporteResultado) => {
        this.resultado = r;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.cargando = false;
        this.error = err?.error?.message || err?.message || 'NO SE PUDO GENERAR EL REPORTE';
        this.cdr.markForCheck();
      }
    });
    setTimeout(() => sub.unsubscribe(), 60000);
  }

  imprimir(): void {
    if (!this.resultado) {
      return;
    }
    window.print();
  }

  csv(): void {
    const contenido = this.csvContenido();
    if (!contenido) {
      return;
    }
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${this.tipo}-${this.desde}-${this.hasta}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  money(n: number): string {
    return `$ ${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  pct(n: number): string {
    return `${(n || 0).toFixed(1)}%`;
  }

  fecha(isoDate: string): string {
    if (!isoDate) {
      return '—';
    }
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  filaProduccion(item: ReporteProduccionItem): string {
    return `${item.codigo || '—'}\t${item.nombre || '—'}\t${item.grupo || '—'}\t${item.cantidad}\t${item.total}\t${item.porcentaje}`;
  }

  filaOperacion(item: ReporteOperacionItem): string {
    return `${item.codigo || '—'}\t${item.nombre || '—'}\t${item.grupo || '—'}\t${item.programadas}\t${item.atendidas}\t${item.noShow}\t${item.canceladas}\t${item.enProceso}\t${item.ocupacion}`;
  }

  hora(time: string): string {
    return time ? time.slice(0, 5) : '—';
  }

  private consulta(): Observable<ReporteResultado> {
    switch (this.tipo) {
      case 'produccion-tratamiento':
        return this.service.produccionTratamiento(this.desde, this.hasta);
      case 'produccion-odontologo':
        return this.service.produccionOdontologo(this.desde, this.hasta);
      case 'produccion-consultorio':
        return this.service.produccionConsultorio(this.desde, this.hasta);
      case 'flujo-caja':
        return this.service.flujoCaja(this.desde, this.hasta);
      case 'cartera':
        return this.service.cartera();
      case 'citas-consultorio':
        return this.service.citasConsultorio(this.desde, this.hasta);
      case 'citas-odontologo':
        return this.service.citasOdontologo(this.desde, this.hasta);
      case 'citas-perdidas':
        return this.service.citasPerdidas(this.desde, this.hasta);
      case 'pacientes-atendidos':
        return this.service.pacientesAtendidos(this.desde, this.hasta);
    }
  }

  private csvContenido(): string {
    if (this.esProduccion && this.produccion) {
      const filas = this.produccion.items.map(i => this.filaProduccion(i));
      return [
        'CÓDIGO\tNOMBRE\tGRUPO\tCANTIDAD\tTOTAL\t%',
        ...filas,
        `TOTAL\t\t\t${this.produccion.totalCantidad}\t${this.produccion.total}\t`
      ].join('\r\n');
    }
    if (this.esFlujo && this.flujo) {
      const filas = this.flujo.porDia.map(f =>
        `${this.fecha(f.fecha)}\t${f.cargos}\t${f.pagos}\t${f.neto}`
      );
      return [
        'FECHA\tCARGOS\tPAGOS\tNETO',
        ...filas,
        `TOTAL\t${this.flujo.totalCargos}\t${this.flujo.totalPagos}\t${this.flujo.totalNeto}`,
        `EFECTIVO\t${this.flujo.pagosEfectivo}`,
        `TARJETA\t${this.flujo.pagosTarjeta}`
      ].join('\r\n');
    }
    if (this.esCartera && this.cartera) {
      const filas = this.cartera.deudores.map(d =>
        `${d.pacienteId}\t${d.paciente}\t${d.saldo}\t${this.fecha(d.ultimoMovimiento)}`
      );
      return [
        'PACIENTE ID\tPACIENTE\tSALDO\tÚLTIMO MOVIMIENTO',
        ...filas,
        `TOTAL DEUDORES\t${this.cartera.totalDeudores}\t${this.cartera.totalCartera}\t`
      ].join('\r\n');
    }
    if (this.esOperacion && this.operacion) {
      const filas = this.operacion.items.map(i => this.filaOperacion(i));
      return [
        'CÓDIGO\tNOMBRE\tGRUPO\tPROGRAMADAS\tATENDIDAS\tNO-SHOW\tCANCELADAS\tEN PROCESO\tOCUPACIÓN %',
        ...filas,
        `TOTAL\t\t\t${this.operacion.totalProgramadas}\t${this.operacion.totalAtendidas}\t${this.operacion.totalNoShow}\t${this.operacion.totalCanceladas}\t${this.operacion.totalEnProceso}\t${this.operacion.ocupacionGlobal}`
      ].join('\r\n');
    }
    if (this.esCitasPerdidas && this.citasPerdidas) {
      const filas = this.citasPerdidas.items.map(c =>
        `${c.id}\t${c.paciente}\t${this.fecha(c.fecha)}\t${this.hora(c.hora)}\t${c.tratamiento}\t${c.consultorio}\t${c.odontologo}\t${c.estado}`
      );
      return [
        'CITA\tPACIENTE\tFECHA\tHORA\tTRATAMIENTO\tCONSULTORIO\tODONTÓLOGO\tESTADO',
        ...filas,
        `TOTAL\t\t\t\t\t\tNO-SHOW ${this.citasPerdidas.totalNoShow}\tCANCELADAS ${this.citasPerdidas.totalCanceladas}`
      ].join('\r\n');
    }
    if (this.esAtendidos && this.atendidos) {
      const filas = this.atendidos.items.map(a =>
        `${a.pacienteId || '—'}\t${a.paciente}\t${a.atenciones}\t${this.fecha(a.ultimaFecha)}`
      );
      return [
        'PACIENTE ID\tPACIENTE\tATENCIONES\tÚLTIMA FECHA',
        ...filas,
        `TOTAL\t${this.atendidos.pacientesUnicos} PACIENTES\t${this.atendidos.totalAtenciones} ATENCIONES\t`
      ].join('\r\n');
    }
    return '';
  }
}