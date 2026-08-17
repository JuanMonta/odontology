import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Appointment, BoardTotals, WaitingPatient } from '../../../../core/models/appointment.model';
import { ConsultoriosHttpService } from '../../../consultorios/services/consultorios-http.service';
import { OdontologosHttpService } from '../../../odontologos/services/odontologos-http.service';
import { PatientsHttpService } from '../../../patients/services/patients-http.service';
import { TreatmentsHttpService } from '../../../treatments/services/treatments-http.service';
import { TurnosHttpService } from '../../../turnos/services/turnos-http.service';
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

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

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
  availableHours$: Observable<string[]>;

  creating = false;
  error = false;
  errorMessage = '';
  waitingError = '';

  draft: NewAppointmentDraft = this.restoreDraft();

  private readonly draft$ = new BehaviorSubject<NewAppointmentDraft>(EMPTY_DRAFT);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly mock: DashboardHttpService,
    patients: PatientsHttpService,
    treatments: TreatmentsHttpService,
    consultorios: ConsultoriosHttpService,
    odontologos: OdontologosHttpService,
    turnos: TurnosHttpService
  ) {
    this.draft$.next({ ...this.draft });

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

    // Cascada: los consultorios se restringen a los que soportan el tratamiento elegido.
    this.consultorioOptions$ = combineLatest([
      consultorios.consultorios$,
      treatments.treatments$,
      this.draft$
    ]).pipe(
      map(([cons, trts, d]) => {
        const trt = trts.find(t => t.name === d.treatment);
        const allowed = trt && trt.consultorios.length ? trt.consultorios : null;
        return cons
          .filter(c => c.status !== 'inactivo')
          .filter(c => !allowed || allowed.includes(c.code))
          .map(c => c.name);
      })
    );

    // Cascada: los odontólogos se restringen a los asignados al consultorio elegido.
    this.dentistOptions$ = combineLatest([
      odontologos.odontologos$,
      consultorios.consultorios$,
      this.draft$
    ]).pipe(
      map(([odos, cons, d]) => {
        const consObj = cons.find(c => c.name === d.consultorio);
        return odos
          .filter(o => o.status === 'activo')
          .filter(o => !consObj || o.consultorio === consObj.code)
          .map(o => o.name);
      })
    );

    // Cascada: la hora se restringe a la jornada del odontólogo elegido.
    this.availableHours$ = combineLatest([
      odontologos.odontologos$,
      turnos.turnos$,
      this.draft$
    ]).pipe(
      map(([odos, turnos, d]) => {
        const odo = odos.find(o => o.name === d.dentist);
        if (!odo) {
          return [];
        }
        const turno = turnos.find(t => t.nombre === odo.turno);
        if (!turno) {
          return [];
        }
        return this.hourRange(turno.horaInicio, turno.horaFin);
      })
    );
  }

  /** Horas del reloj (HH) dentro de la jornada, sin incluir la hora de fin. */
  private hourRange(start: string, end: string): string[] {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
      const hMin = h * 60;
      if (hMin >= startMin && hMin < endMin) {
        out.push(pad(h));
      }
    }
    return out;
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
    if (field === 'treatment') {
      this.draft.consultorio = '';
      this.draft.dentist = '';
      this.draft.time = '';
    } else if (field === 'consultorio') {
      this.draft.dentist = '';
      this.draft.time = '';
    } else if (field === 'dentist') {
      this.draft.time = '';
    }
    this.draft$.next({ ...this.draft });
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
        this.draft$.next({ ...this.draft });
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
