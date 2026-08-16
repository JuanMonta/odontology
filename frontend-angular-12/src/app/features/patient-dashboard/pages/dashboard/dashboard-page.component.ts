import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { borradorKey } from '../../../../core/auth/session-local-storage';

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

  private get draftKey(): string {
    return borradorKey(DashboardPageComponent.DRAFT_KEY);
  }

  appointments$: Observable<Appointment[]>;
  waiting$: Observable<WaitingPatient[]>;
  waitingNames$: Observable<string[]>;
  totals$: Observable<BoardTotals>;

  patientOptions$: Observable<string[]>;
  treatmentOptions$: Observable<string[]>;
  consultorioOptions$: Observable<string[]>;
  dentistOptions$: Observable<string[]>;

  creating = false;
  error = false;
  errorMessage = '';
  waitingError = '';

  draft: NewAppointmentDraft = this.restoreDraft();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly mock: DashboardHttpService,
    patients: PatientsHttpService,
    treatments: TreatmentsHttpService,
    consultorios: ConsultoriosHttpService,
    odontologos: OdontologosHttpService
  ) {
    this.appointments$ = this.mock.appointments$;
    this.waiting$ = this.mock.waiting$;
    this.waitingNames$ = this.waiting$.pipe(
      map(list => list.map(p => p.patient.toUpperCase())),
      takeUntil(this.destroy$)
    );
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
    this.waitingError = '';
    this.mock.callWaitingPatient().subscribe({
      next: () => {
        this.waitingError = '';
        this.refreshBoards();
      },
      error: err => {
        this.waitingError = err?.error?.message || 'NO SE PUDO LLAMAR AL SIGUIENTE';
        this.cdr.markForCheck();
      }
    });
  }

  private refreshBoards(): void {
    this.mock.refresh();
    this.cdr.markForCheck();
  }

  onCheckIn(appointmentId: string): void {
    this.mock.checkIn({ appointmentId });
  }

  onMarkDone(id: string): void {
    this.mock.markDone(id);
  }

  onNoShow(id: string): void {
    this.mock.markNoShow(id);
  }

  onCancel(id: string): void {
    this.mock.markCancelled(id);
  }

  onCloseDay(): void {
    this.mock.closeDay();
  }

  onWalkIn(data: { nombre: string; motivo: string }): void {
    this.mock.checkIn({ pacienteNombre: data.nombre, motivo: data.motivo });
  }

  startCreate(): void {
    this.creating = true;
    this.error = false;
    this.errorMessage = '';
  }

  cancelCreate(): void {
    this.creating = false;
    this.error = false;
    this.errorMessage = '';
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
      this.errorMessage = 'HORA Y PACIENTE SON OBLIGATORIOS';
      return;
    }
    this.mock.addAppointment({
      id: `apt-${Date.now().toString(36)}`,
      time: time.trim(),
      patient: patient.trim().toUpperCase(),
      treatment: (treatment.trim() || 'CONSULTA').toUpperCase(),
      consultorio: (consultorio.trim() || 'CON 01').toUpperCase(),
      dentist: (dentist.trim() || 'DRA. TORRES').toUpperCase(),
      status: 'on-time'
    }).subscribe({
      next: () => {
        this.mock.refresh();
        this.creating = false;
        this.draft = { ...EMPTY_DRAFT };
        this.clearDraft();
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = true;
        this.errorMessage = err?.error?.message || 'NO SE PUDO AGENDAR LA CITA';
        this.cdr.markForCheck();
      }
    });
  }

  persistDraft(): void {
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(this.draft));
    } catch {
      // almacenamiento no disponible: el borrador simplemente no se persiste
    }
  }

  private restoreDraft(): NewAppointmentDraft {
    try {
      const raw = localStorage.getItem(this.draftKey);
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
      localStorage.removeItem(this.draftKey);
    } catch {
      // almacenamiento no disponible
    }
  }

  private computeTotals(list: Appointment[]): BoardTotals {
    return {
      total: list.length,
      waiting: list.filter(a => a.status === 'arrived' || a.status === 'delayed').length,
      delayed: list.filter(a => a.status === 'delayed').length,
      done: list.filter(a => a.status === 'done').length
    };
  }
}
