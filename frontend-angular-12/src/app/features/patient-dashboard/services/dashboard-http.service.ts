import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Appointment, BoardTotals, WaitingPatient } from '../../../core/models/appointment.model';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

/**
 * Consume el backend REST del panel del consultorio (spring_backend →
 * /api/v1/dashboard). Mantiene el mismo contrato Observable del mock.
 */
@Injectable({ providedIn: 'root' })
export class DashboardHttpService {
  private readonly appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
  private readonly waitingSubject = new BehaviorSubject<WaitingPatient[]>([]);

  readonly appointments$: Observable<Appointment[]> = this.appointmentsSubject.asObservable();
  readonly waiting$: Observable<WaitingPatient[]> = this.waitingSubject.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    status.reconnected$.subscribe(() => this.refresh());
    status.onlineTick$
      .pipe(filter(() => this.appointmentsSubject.getValue().length === 0))
      .subscribe(() => this.refresh());
  }

  refresh(): void {
    this.http.get<Appointment[]>(`${API_BASE}/dashboard/appointments`).subscribe(list => {
      this.appointmentsSubject.next(list);
    });
    this.http.get<WaitingPatient[]>(`${API_BASE}/dashboard/waiting`).subscribe(list => {
      this.waitingSubject.next(list);
    });
  }

  /**
   * Alta en sala de espera (check-in). Con {@code appointmentId} deriva los
   * datos de la cita; sin cita, usa {@code pacienteNombre} + {@code motivo}.
   */
  checkIn(payload: { appointmentId?: string; pacienteNombre?: string; motivo?: string }): void {
    this.http.post(`${API_BASE}/dashboard/waiting`, payload).subscribe(() => this.refresh());
  }

  get totals(): BoardTotals {
    const list = this.appointmentsSubject.getValue();
    return {
      total: list.length,
      waiting: list.filter(a => a.status === 'on-time').length,
      delayed: list.filter(a => a.status === 'delayed').length,
      done: list.filter(a => a.status === 'done').length
    };
  }

  /** Llamar al siguiente paciente en espera → pasa a "en consultorio" (boarding). */
  callWaitingPatient(): void {
    this.http.post<Appointment>(`${API_BASE}/dashboard/call-waiting`, {}).subscribe(() => this.refresh());
  }

  /** Marcar la cita como atendida. */
  markDone(id: string): void {
    this.http.patch<Appointment>(`${API_BASE}/dashboard/appointments/${id}/done`, null).subscribe(() => this.refresh());
  }

  /** Registrar una nueva cita en el tablero (inserción local optimista, ordenada por hora). */
  addAppointment(appointment: Appointment): void {
    const list = this.appointmentsSubject.getValue();
    this.appointmentsSubject.next(
      [...list, appointment].sort((a, b) => a.time.localeCompare(b.time))
    );
  }
}
