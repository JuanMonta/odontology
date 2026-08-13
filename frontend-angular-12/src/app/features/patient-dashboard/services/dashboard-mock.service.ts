import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Appointment, BoardTotals, WaitingPatient } from '../../../core/models/appointment.model';

/**
 * FUENTE DE DATOS SINTÉTICA — reemplazar por el Facade que consulte el
 * backend (GraphQL/REST) cuando exista. Los datos son ilustrativos.
 */
@Injectable({ providedIn: 'root' })
export class DashboardMockService {
  private readonly appointmentsSubject = new BehaviorSubject<Appointment[]>(this.buildAppointments());
  private readonly waitingSubject = new BehaviorSubject<WaitingPatient[]>(this.buildWaiting());

  readonly appointments$: Observable<Appointment[]> = this.appointmentsSubject.asObservable();
  readonly waiting$: Observable<WaitingPatient[]> = this.waitingSubject.asObservable();

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
    const waiting = this.waitingSubject.getValue();
    const [next, ...rest] = waiting;
    if (!next) { return; }
    this.waitingSubject.next(rest);
    const list = this.appointmentsSubject.getValue();
    const target = list.find(a => a.patient === next.patient && a.status === 'on-time');
    if (target) {
      this.appointmentsSubject.next(
        list.map(a => a.id === target.id ? { ...a, status: 'boarding' as const } : a)
      );
    }
  }

  /** Marcar la cita como atendida. */
  markDone(id: string): void {
    const list = this.appointmentsSubject.getValue();
    this.appointmentsSubject.next(
      list.map(a => a.id === id ? { ...a, status: 'done' as const } : a)
    );
  }

  private buildAppointments(): Appointment[] {
    return [
      { id: 'apt-1', time: '08:00', patient: 'MARÍA QUISPE', treatment: 'LIMPIEZA', consultorio: 'CON 01', dentist: 'DRA. TORRES', status: 'done' },
      { id: 'apt-2', time: '08:30', patient: 'JOSÉ HUAMÁN', treatment: 'EMP ASTE', consultorio: 'CON 02', dentist: 'DR. RIVERA', status: 'done' },
      { id: 'apt-3', time: '09:00', patient: 'LUCÍA PAREDES', treatment: 'ENDODONCIA', consultorio: 'CON 01', dentist: 'DRA. TORRES', status: 'done' },
      { id: 'apt-4', time: '09:45', patient: 'CARLOS MENDOZA', treatment: 'EXTRACCIÓN', consultorio: 'CON 02', dentist: 'DR. RIVERA', status: 'boarding' },
      { id: 'apt-5', time: '10:15', patient: 'ANA FLORES', treatment: 'CORONA', consultorio: 'CON 03', dentist: 'DR. VEGA', status: 'delayed' },
      { id: 'apt-6', time: '10:45', patient: 'PEDRO SÁNCHEZ', treatment: 'ORTODONCIA', consultorio: 'CON 01', dentist: 'DRA. TORRES', status: 'on-time' },
      { id: 'apt-7', time: '11:15', patient: 'ROSA CÁCERES', treatment: 'BLANQUEAMIENTO', consultorio: 'CON 02', dentist: 'DR. RIVERA', status: 'on-time' },
      { id: 'apt-8', time: '11:45', patient: 'DIEGO RAMOS', treatment: 'REVISIÓN', consultorio: 'CON 03', dentist: 'DR. VEGA', status: 'cancelled' },
      { id: 'apt-9', time: '12:15', patient: 'ELENA VARGAS', treatment: 'LIMPIEZA', consultorio: 'CON 01', dentist: 'DRA. TORRES', status: 'on-time' }
    ];
  }

  private buildWaiting(): WaitingPatient[] {
    return [
      { id: 'wt-1', ticket: 'A-015', patient: 'JORGE LUNA', arrivedAt: '09:52', reason: 'SIN CITA / URGENCIA' },
      { id: 'wt-2', ticket: 'A-016', patient: 'KAREN DÍAZ', arrivedAt: '10:02', reason: 'REVISIÓN DE TRATAMIENTO' },
      { id: 'wt-3', ticket: 'A-017', patient: 'MIGUEL CASTRO', arrivedAt: '10:11', reason: 'PRIMERA CONSULTA' }
    ];
  }
}
