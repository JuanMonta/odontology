import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, shareReplay, tap } from 'rxjs/operators';
import { BackendStatusService } from '../../../core/services/backend-status.service';
import {
  AccountEntry,
  Patient,
  PatientAlert,
  PatientAppointment,
  PatientDetail,
  PatientDraft,
  Tooth,
  ToothCondition,
  ToothFace
} from '../../../core/models/patient.model';
import { API_BASE } from '../../../core/config/api.config';

/** Forma que envía el backend para las condiciones de diente completo: `[{ "condition": "..." }]`. */
interface BackendToothCondition {
  condition: string;
}

interface BackendTooth {
  number: number;
  conditions: BackendToothCondition[];
  faces?: ToothFace[];
  movilidad?: string | null;
  recesion?: string | null;
}

/** Detalle tal como lo entrega el endpoint (teeth en forma cruda del backend). */
interface BackendPatientDetail {
  appointments: PatientAppointment[];
  account: AccountEntry[];
  teeth: BackendTooth[];
}

/**
 * Consume el backend REST de pacientes (spring_backend → /api/v1/pacientes).
 * Mantiene el mismo contrato Observable del mock para no tocar las vistas.
 */
@Injectable({ providedIn: 'root' })
export class PatientsHttpService {
  private readonly accountSubject = new BehaviorSubject<Record<string, AccountEntry[]>>({});
  private readonly patientsSubject = new BehaviorSubject<Patient[]>([]);
  private readonly appointmentsSubject = new BehaviorSubject<Record<string, PatientDetail['appointments']>>({});
  private readonly teethSubject = new BehaviorSubject<Record<string, Tooth[]>>({});
  private readonly alertsSubject = new BehaviorSubject<PatientAlert[]>([]);
  private readonly detailCache = new Map<string, Observable<PatientDetail>>();

  readonly patients$: Observable<Patient[]> = this.patientsSubject.pipe(
    map(list => list.map(p => ({ ...p, debt: this.balanceOf(p.id) })))
  );

  readonly alerts$: Observable<PatientAlert[]> = this.alertsSubject.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    status.reconnected$.subscribe(() => this.refresh());
    status.onlineTick$
      .pipe(filter(() => this.patientsSubject.getValue().length === 0))
      .subscribe(() => this.refresh());
  }

  refresh(): void {
    this.http.get<Patient[]>(`${API_BASE}/pacientes`).subscribe(list => this.patientsSubject.next(list));
    this.http.get<PatientAlert[]>(`${API_BASE}/pacientes/alerts`).subscribe(list => this.alertsSubject.next(list));
  }

  findPatient(id: string): Patient | null {
    const patient = this.patientsSubject.getValue().find(p => p.id === id);
    return patient ? { ...patient, debt: this.balanceOf(id) } : null;
  }

  patientDetail$(id: string): Observable<PatientDetail> {
    let detail$ = this.detailCache.get(id);
    if (!detail$) {
      detail$ = this.http.get<BackendPatientDetail>(`${API_BASE}/pacientes/${id}/detail`).pipe(
        map(detail => ({ ...detail, teeth: this.normalizeTeeth(detail.teeth ?? []) })),
        tap(detail => {
          this.appointmentsSubject.next({ ...this.appointmentsSubject.getValue(), [id]: detail.appointments });
          this.accountSubject.next({ ...this.accountSubject.getValue(), [id]: detail.account });
          this.teethSubject.next({ ...this.teethSubject.getValue(), [id]: detail.teeth });
        }),
        shareReplay(1)
      );
      this.detailCache.set(id, detail$);
    }
    return detail$;
  }

  addPatient(draft: PatientDraft): Observable<Patient> {
    return this.http.post<Patient>(`${API_BASE}/pacientes`, draft).pipe(
      tap(created => {
        this.patientsSubject.next([created, ...this.patientsSubject.getValue()]);
        this.detailCache.delete(created.id);
      })
    );
  }

  updatePatient(id: string, draft: PatientDraft): void {
    this.http.put<Patient>(`${API_BASE}/pacientes/${id}`, draft).subscribe(updated => {
      this.patientsSubject.next(this.patientsSubject.getValue().map(p => (p.id === updated.id ? updated : p)));
      this.detailCache.delete(id);
    });
  }

  addPayment(id: string, amount: number, method = 'EFECTIVO'): void {
    this.http
      .post<AccountEntry>(`${API_BASE}/pacientes/${id}/abonos`, { monto: amount, metodo: method })
      .subscribe(() => {
        this.detailCache.delete(id);
        this.patientsSubject.next(this.patientsSubject.getValue().map(p => ({ ...p })));
      });
  }

  updateTooth(id: string, tooth: Tooth): void {
    this.updateTeeth(id, [tooth]);
  }

  updateTeeth(id: string, updates: Tooth[]): void {
    const map = this.teethSubject.getValue();
    const teeth = (map[id] ?? []).map(t => {
      const next = updates.find(u => u.number === t.number);
      return next ? { ...t, ...next } : t;
    });
    this.teethSubject.next({ ...map, [id]: teeth });
    updates.forEach(u => {
      this.http.put<BackendTooth>(`${API_BASE}/pacientes/${id}/teeth/${u.number}`, this.toBackendTooth(u)).subscribe(() => {
        this.detailCache.delete(id);
      });
    });
  }

  markAlertHandled(alertId: string): void {
    this.http.patch<PatientAlert>(`${API_BASE}/pacientes/alerts/${alertId}/handled`, null).subscribe(updated => {
      this.alertsSubject.next(this.alertsSubject.getValue().map(a => (a.id === updated.id ? updated : a)));
    });
  }

  private balanceOf(id: string): number {
    const entries = this.accountSubject.getValue()[id] ?? [];
    const charges = entries.filter(e => e.type === 'charge').reduce((s, e) => s + e.amount, 0);
    const payments = entries.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0);
    return Math.max(0, charges - payments);
  }

  /** El backend entrega conditions como `[{ condition }]`; el odontograma las usa como strings. */
  private normalizeTeeth(raw: BackendTooth[]): Tooth[] {
    return raw.map(t => ({
      number: t.number,
      conditions: (t.conditions ?? [])
        .map(c => (typeof c === 'string' ? c : c.condition))
        .filter((c): c is ToothCondition => typeof c === 'string'),
      faces: (t.faces ?? []) as ToothFace[],
      movilidad: t.movilidad ?? undefined,
      recesion: t.recesion ?? undefined
    }));
  }

  /** Devuelve la pieza en la forma que el endpoint PUT espera (`conditions` como objetos). */
  private toBackendTooth(t: Tooth): BackendTooth {
    return {
      number: t.number,
      conditions: t.conditions.map(c => ({ condition: c })),
      faces: t.faces ?? [],
      movilidad: t.movilidad ?? null,
      recesion: t.recesion ?? null
    };
  }
}
