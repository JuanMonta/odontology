import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AccountEntry,
  Patient,
  PatientDraft,
  PatientDetail,
  Tooth
} from '../../../../core/models/patient.model';
import { PatientsMockService } from '../../services/patients-mock.service';

type Tab = 'ficha' | 'historial' | 'cuentas' | 'odonto';

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
  tab: Tab = 'ficha';
  editMode = false;
  abonoOpen = false;
  abonoAmount = 100;

  tabs: { id: Tab; label: string }[] = [
    { id: 'ficha', label: 'FICHA' },
    { id: 'historial', label: 'HISTORIAL' },
    { id: 'cuentas', label: 'CUENTAS' },
    { id: 'odonto', label: 'ODONTOGRAMA' }
  ];

  constructor(private service: PatientsMockService) {}

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

  balance(entries: AccountEntry[]): number {
    const charges = entries.filter(e => e.type === 'charge').reduce((s, e) => s + e.amount, 0);
    const payments = entries.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0);
    return charges - payments;
  }

  fmtMoney(n: number): string {
    const abs = Math.abs(n).toLocaleString('en-US');
    return n < 0 ? `-S/ ${abs}` : `S/ ${abs}`;
  }

  onToothChange(tooth: Tooth): void {
    if (this.patient) {
      this.service.setToothState(this.patient.id, tooth.number, tooth.status);
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

  confirmAbono(): void {
    if (this.patient && this.abonoAmount > 0) {
      this.service.addPayment(this.patient.id, this.abonoAmount);
      this.abonoOpen = false;
      this.abonoAmount = 100;
    }
  }

  onCreate(draft: PatientDraft): void {
    const created = this.service.addPatient(draft);
    this.saved.emit(created);
  }

  onEdit(draft: PatientDraft): void {
    if (this.patient) {
      this.service.updatePatient(this.patient.id, draft);
      this.editMode = false;
    }
  }
}
