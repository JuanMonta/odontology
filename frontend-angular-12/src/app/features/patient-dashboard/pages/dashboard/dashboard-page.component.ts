import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Appointment, BoardTotals, WaitingPatient } from '../../../../core/models/appointment.model';
import { ConsultoriosHttpService } from '../../../consultorios/services/consultorios-http.service';
import { OdontologosHttpService } from '../../../odontologos/services/odontologos-http.service';
import { PatientsHttpService } from '../../../patients/services/patients-http.service';
import { TreatmentsHttpService } from '../../../treatments/services/treatments-http.service';
import { DashboardHttpService } from '../../services/dashboard-http.service';

export interface NewAppointmentDraft {
  time: string;
  patient: string;
  treatment: string;
  consultorio: string;
  dentist: string;
}

const EMPTY_DRAFT: NewAppointmentDraft = {
  time: '',
  patient: '',
  treatment: '',
  consultorio: '',
  dentist: ''
};

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private static readonly DRAFT_KEY = 'saas.clinica.appointment-form.draft';

  appointments$: Observable<Appointment[]>;
  waiting$: Observable<WaitingPatient[]>;
  totals$: Observable<BoardTotals>;

  patientOptions$: Observable<string[]>;
  treatmentOptions$: Observable<string[]>;
  consultorioOptions$: Observable<string[]>;
  dentistOptions$: Observable<string[]>;

  creating = false;
  error = false;

  draft: NewAppointmentDraft = this.restoreDraft();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly mock: DashboardHttpService,
    patients: PatientsHttpService,
    treatments: TreatmentsHttpService,
    consultorios: ConsultoriosHttpService,
    odontologos: OdontologosHttpService
  ) {
    this.appointments$ = this.mock.appointments$;
    this.waiting$ = this.mock.waiting$;
    this.totals$ = this.mock.appointments$.pipe(
      map(list => this.computeTotals(list)),
      takeUntil(this.destroy$)
    );
    this.patientOptions$ = patients.patients$.pipe(map(list => list.map(p => p.name)));
    this.treatmentOptions$ = treatments.treatments$.pipe(map(list => list.map(t => t.name)));
    this.consultorioOptions$ = consultorios.consultorios$.pipe(map(list => list.map(c => c.name)));
    this.dentistOptions$ = odontologos.odontologos$.pipe(map(list => list.map(o => o.name)));
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCallNext(): void {
    this.mock.callWaitingPatient();
  }

  onMarkDone(id: string): void {
    this.mock.markDone(id);
  }

  startCreate(): void {
    this.creating = true;
    this.error = false;
  }

  cancelCreate(): void {
    this.creating = false;
    this.error = false;
    this.clearDraft();
  }

  onValueChange(field: keyof NewAppointmentDraft, value: string): void {
    this.draft[field] = value;
    this.persistDraft();
  }

  onNewAppointment(): void {
    const { time, patient, treatment, consultorio, dentist } = this.draft;
    if (!time.trim() || !patient.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    this.mock.addAppointment({
      id: `apt-${Date.now().toString(36)}`,
      time: time.trim(),
      patient: patient.trim().toUpperCase(),
      treatment: (treatment.trim() || 'CONSULTA').toUpperCase(),
      consultorio: (consultorio.trim() || 'CON 01').toUpperCase(),
      dentist: (dentist.trim() || 'DRA. TORRES').toUpperCase(),
      status: 'on-time'
    });
    this.creating = false;
    this.draft = { ...EMPTY_DRAFT };
    this.clearDraft();
  }

  persistDraft(): void {
    try {
      localStorage.setItem(DashboardPageComponent.DRAFT_KEY, JSON.stringify(this.draft));
    } catch {
      // almacenamiento no disponible: el borrador simplemente no se persiste
    }
  }

  private restoreDraft(): NewAppointmentDraft {
    try {
      const raw = localStorage.getItem(DashboardPageComponent.DRAFT_KEY);
      if (!raw) {
        return { ...EMPTY_DRAFT };
      }
      const saved = JSON.parse(raw);
      if (typeof saved !== 'object' || saved === null) {
        return { ...EMPTY_DRAFT };
      }
      return {
        time: typeof saved.time === 'string' ? saved.time : '',
        patient: typeof saved.patient === 'string' ? saved.patient : '',
        treatment: typeof saved.treatment === 'string' ? saved.treatment : '',
        consultorio: typeof saved.consultorio === 'string' ? saved.consultorio : '',
        dentist: typeof saved.dentist === 'string' ? saved.dentist : ''
      };
    } catch {
      return { ...EMPTY_DRAFT };
    }
  }

  private clearDraft(): void {
    try {
      localStorage.removeItem(DashboardPageComponent.DRAFT_KEY);
    } catch {
      // almacenamiento no disponible
    }
  }

  private computeTotals(list: Appointment[]): BoardTotals {
    return {
      total: list.length,
      waiting: list.filter(a => a.status === 'on-time').length,
      delayed: list.filter(a => a.status === 'delayed').length,
      done: list.filter(a => a.status === 'done').length
    };
  }
}
