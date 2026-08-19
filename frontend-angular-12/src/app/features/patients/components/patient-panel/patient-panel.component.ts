import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AccountEntry,
  Patient,
  PatientAppointment,
  PatientDraft,
  PatientDetail,
  Tooth
} from '../../../../core/models/patient.model';
import { PatientsHttpService } from '../../services/patients-http.service';
import { clearPatientFormDraft } from '../../../../shared/patient-form/patient-form.component';

type Tab = 'odonto' | 'hcl033' | 'historial' | 'ficha' | 'cuentas' | 'evolucion';

@Component({
  selector: 'app-patient-panel',
  templateUrl: './patient-panel.component.html',
  styleUrls: ['./patient-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientPanelComponent implements OnChanges {
  @Input() patient: Patient | null = null;
  @Input() creating = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Patient>();

  detail$: Observable<PatientDetail> | null = null;
  tab: Tab = 'odonto';
  editMode = false;
  abonoOpen = false;
  abonoAmount = 100;

  tabs: { id: Tab; label: string }[] = [
    { id: 'odonto', label: 'ODONTOGRAMA' },
    { id: 'hcl033', label: 'HISTORIA 033' },
    { id: 'historial', label: 'HISTORIAL' },
    { id: 'evolucion', label: 'EVOLUCIÓN' },
    { id: 'ficha', label: 'FICHA' },
    { id: 'cuentas', label: 'CUENTAS' }
  ];

  constructor(private service: PatientsHttpService) {}

  ngOnChanges(): void {
    this.editMode = false;
    this.abonoOpen = false;
    if (this.patient) {
      this.detail$ = this.service.patientDetail$(this.patient.id);
    } else {
      this.detail$ = null;
    }
  }

  selectTab(t: Tab): void {
    this.tab = t;
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('');
  }

  hasAllergies(p: Patient): boolean {
    return p.allergies.toUpperCase() !== 'NINGUNA';
  }

  balance(entries: AccountEntry[]): number {
    const charges = entries.filter(e => e.type === 'charge').reduce((s, e) => s + e.amount, 0);
    const payments = entries.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0);
    return charges - payments;
  }

  fmtMoney(n: number): string {
    const abs = Math.abs(n).toLocaleString('en-US');
    return n < 0 ? `-$ ${abs}` : `$ ${abs}`;
  }

  onToothChange(teeth: Tooth[]): void {
    if (this.patient) {
      this.service.updateTeeth(this.patient.id, teeth);
    }
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      done: 'ATENDIDA',
      cancelled: 'CANCELADA',
      scheduled: 'PROGRAMADA',
      'no-show': 'NO ASISTIÓ'
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    return `hist-status--${s}`;
  }

  /** Última cita ATENDIDA del paciente (el detalle llega ordenado desc). */
  ultimoControlCita(citas: PatientAppointment[]): PatientAppointment | null {
    if (!citas || !citas.length) {
      return null;
    }
    return citas.find(c => c.status === 'done') ?? null;
  }

  confirmAbono(): void {
    if (this.patient && this.abonoAmount > 0) {
      this.service.addPayment(this.patient.id, this.abonoAmount);
      this.abonoOpen = false;
      this.abonoAmount = 100;
    }
  }

  onCreate(draft: PatientDraft): void {
    this.service.addPatient(draft).subscribe(created => {
      this.saved.emit(created);
    });
  }

  cancelCreate(): void {
    clearPatientFormDraft();
    this.cancel.emit();
  }

  onEdit(draft: PatientDraft): void {
    if (this.patient) {
      this.service.updatePatient(this.patient.id, draft).subscribe(updated => {
        this.editMode = false;
        this.saved.emit(updated);
      });
    }
  }
}
