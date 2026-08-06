import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ClinicaSettings, ConfigSection } from '../../../../core/models/clinica-settings.model';
import { CONFIG_SECTIONS } from '../../services/configuracion-mock.service';

export const WEEKDAYS: string[] = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];

@Component({
  selector: 'app-configuracion-panel',
  templateUrl: './configuracion-panel.component.html',
  styleUrls: ['./configuracion-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionPanelComponent implements OnChanges {
  @Input() settings: ClinicaSettings | null = null;
  @Input() section: ConfigSection = 'clinica';
  @Output() save = new EventEmitter<ClinicaSettings>();

  weekdays = WEEKDAYS;

  nombre = '';
  ruc = '';
  direccion = '';
  telefono = '';
  email = '';
  horarioInicio = '08:00';
  horarioFin = '18:00';
  duracionCita = 45;
  toleranciaRetraso = 15;
  diasAtencion: string[] = [];
  formatoFecha = 'DD MMM AAAA';
  recordatorioCitas = true;
  notificacionUrgente = true;
  avisoVencimiento = true;
  error = false;

  sectionMeta(id: ConfigSection): { label: string; sub: string } | undefined {
    return CONFIG_SECTIONS.find(s => s.id === id);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.settings && this.settings) {
      this.nombre = this.settings.nombre;
      this.ruc = this.settings.ruc;
      this.direccion = this.settings.direccion;
      this.telefono = this.settings.telefono;
      this.email = this.settings.email;
      this.horarioInicio = this.settings.horarioInicio;
      this.horarioFin = this.settings.horarioFin;
      this.duracionCita = this.settings.duracionCita;
      this.toleranciaRetraso = this.settings.toleranciaRetraso;
      this.diasAtencion = [...this.settings.diasAtencion];
      this.formatoFecha = this.settings.formatoFecha;
      this.recordatorioCitas = this.settings.recordatorioCitas;
      this.notificacionUrgente = this.settings.notificacionUrgente;
      this.avisoVencimiento = this.settings.avisoVencimiento;
      this.error = false;
    }
  }

  toggleDay(day: string): void {
    this.diasAtencion = this.diasAtencion.includes(day)
      ? this.diasAtencion.filter(d => d !== day)
      : [...this.diasAtencion, day];
  }

  onSubmit(): void {
    if (!this.nombre.trim() || !this.ruc.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    if (!this.settings) {
      return;
    }
    this.save.emit({
      ...this.settings,
      nombre: this.nombre.trim().toUpperCase(),
      ruc: this.ruc.trim(),
      direccion: this.direccion.trim().toUpperCase(),
      telefono: this.telefono.trim(),
      email: this.email.trim(),
      horarioInicio: this.horarioInicio,
      horarioFin: this.horarioFin,
      duracionCita: this.duracionCita,
      toleranciaRetraso: this.toleranciaRetraso,
      diasAtencion: [...this.diasAtencion],
      formatoFecha: this.formatoFecha,
      recordatorioCitas: this.recordatorioCitas,
      notificacionUrgente: this.notificacionUrgente,
      avisoVencimiento: this.avisoVencimiento
    });
  }
}
