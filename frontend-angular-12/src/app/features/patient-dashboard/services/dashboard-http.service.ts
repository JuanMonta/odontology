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
      .pipe(
        filter(() => this.hasLiveAppointments())
      )
      .subscribe(() => this.refresh());
  }

  /** ¿Hay citas en juego cuyo estado puede cambiar por el reloj (on-time, arrived, delayed, boarding)? */
  private hasLiveAppointments(): boolean {
    return this.appointmentsSubject
      .getValue()
      .some(a => ['on-time', 'arrived', 'delayed', 'boarding'].includes(a.status));
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
      waiting: list.filter(a => a.status === 'arrived' || a.status === 'delayed').length,
      delayed: list.filter(a => a.status === 'delayed').length,
      done: list.filter(a => a.status === 'done').length
    };
  }

  /** Cierre de día: marca no-show todas las on-time restantes del backend. */
  closeDay(): void {
    this.http.post(`${API_BASE}/dashboard/close-day`, null).subscribe(() => this.refresh());
  }

  /** Llamar al siguiente paciente en espera → pasa a "en consultorio" (boarding). */
  callWaitingPatient(): void {
    this.http.post<Appointment>(`${API_BASE}/dashboard/call-waiting`, {}).subscribe(() => this.refresh());
  }

  /** Marcar la cita como atendida. */
  markDone(id: string): void {
    this.http.patch<Appointment>(`${API_BASE}/dashboard/appointments/${id}/done`, null).subscribe(() => this.refresh());
  }

  /** Marcar la cita como cancelada. */
  markCancelled(id: string): void {
    this.http.patch<Appointment>(`${API_BASE}/dashboard/appointments/${id}/cancel`, null).subscribe(() => this.refresh());
  }

  /** Marcar la cita como no-show (no asistió). */
  markNoShow(id: string): void {
    this.http.patch<Appointment>(`${API_BASE}/dashboard/appointments/${id}/no-show`, null).subscribe(() => this.refresh());
  }

  /** Registrar una nueva cita programada para hoy (persistida en el backend). */
  addAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(`${API_BASE}/dashboard/appointments`, {
      time: appointment.time,
      patient: appointment.patient,
      treatment: appointment.treatment,
      consultorio: appointment.consultorio,
      dentist: appointment.dentist
    });
  }
}
