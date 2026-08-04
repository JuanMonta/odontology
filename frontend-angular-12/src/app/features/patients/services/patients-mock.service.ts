import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AccountEntry,
  Patient,
  PatientAlert,
  PatientAppointment,
  PatientDetail,
  PatientDraft,
  Tooth,
  ToothCondition
} from '../../../core/models/patient.model';

/**
 * FUENTE DE DATOS SINTÉTICA — reemplazar por el Facade que consulte el
 * backend cuando exista. Los datos son ilustrativos de una clínica odontológica.
 */
@Injectable({ providedIn: 'root' })
export class PatientsMockService {
  private readonly accountSubject = new BehaviorSubject<Record<string, AccountEntry[]>>(this.buildAccount());
  private readonly patientsSubject = new BehaviorSubject<Patient[]>(this.buildPatients());
  private readonly appointmentsSubject = new BehaviorSubject<Record<string, PatientAppointment[]>>(this.buildAppointments());
  private readonly teethSubject = new BehaviorSubject<Record<string, Tooth[]>>(this.buildTeeth());
  private readonly alertsSubject = new BehaviorSubject<PatientAlert[]>(this.buildAlerts());

  readonly patients$: Observable<Patient[]> = this.patientsSubject.pipe(
    map(list => list.map(p => ({ ...p, debt: this.balanceOf(p.id) })))
  );

  readonly alerts$: Observable<PatientAlert[]> = this.alertsSubject.asObservable();

  findPatient(id: string): Patient | null {
    const patient = this.patientsSubject.getValue().find(p => p.id === id);
    return patient ? { ...patient, debt: this.balanceOf(id) } : null;
  }

  patientDetail$(id: string): Observable<PatientDetail> {
    return new Observable<PatientDetail>(subscriber => {
      const detail = this.readDetail(id);
      subscriber.next(detail);
      const refs = [
        this.appointmentsSubject.subscribe(() => subscriber.next(this.readDetail(id))),
        this.accountSubject.subscribe(() => subscriber.next(this.readDetail(id))),
        this.teethSubject.subscribe(() => subscriber.next(this.readDetail(id)))
      ];
      return () => refs.forEach(r => r.unsubscribe());
    });
  }

  addPatient(draft: PatientDraft): Patient {
    const list = this.patientsSubject.getValue();
    const next = this.nextId(list);
    const patient: Patient = { ...draft, id: next, debt: 0 };
    this.patientsSubject.next([...list, patient]);
    this.appointmentsSubject.next({ ...this.appointmentsSubject.getValue(), [next]: [] });
    this.accountSubject.next({ ...this.accountSubject.getValue(), [next]: [] });
    this.teethSubject.next({ ...this.teethSubject.getValue(), [next]: this.defaultTeeth() });
    return patient;
  }

  updatePatient(id: string, draft: PatientDraft): void {
    const list = this.patientsSubject.getValue();
    this.patientsSubject.next(list.map(p => (p.id === id ? { ...p, ...draft } : p)));
  }

  addPayment(id: string, amount: number, method = 'EFECTIVO'): void {
    const today = this.todayLabel();
    const entry: AccountEntry = {
      id: `pay-${Date.now()}`,
      date: today,
      concept: 'ABONO A CUENTA',
      amount,
      type: 'payment',
      method
    };
    const map = this.accountSubject.getValue();
    this.accountSubject.next({ ...map, [id]: [...(map[id] ?? []), entry] });
  }

  updateTooth(id: string, tooth: Tooth): void {
    const map = this.teethSubject.getValue();
    const teeth = (map[id] ?? this.defaultTeeth()).map(t =>
      t.number === tooth.number ? { ...t, ...tooth } : t
    );
    this.teethSubject.next({ ...map, [id]: teeth });
  }

  markAlertHandled(alertId: string): void {
    const list = this.alertsSubject.getValue();
    this.alertsSubject.next(list.map(a => (a.id === alertId ? { ...a, handled: true } : a)));
  }

  private readDetail(id: string): PatientDetail {
    return {
      appointments: this.appointmentsSubject.getValue()[id] ?? [],
      account: [...(this.accountSubject.getValue()[id] ?? [])].reverse(),
      teeth: this.teethSubject.getValue()[id] ?? this.defaultTeeth()
    };
  }

  private balanceOf(id: string): number {
    const entries = this.accountSubject.getValue()[id] ?? [];
    const charges = entries.filter(e => e.type === 'charge').reduce((s, e) => s + e.amount, 0);
    const payments = entries.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0);
    return Math.max(0, charges - payments);
  }

  private nextId(list: Patient[]): string {
    const max = list.reduce((m, p) => {
      const n = parseInt(p.id.replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `HC-${String(max + 1).padStart(4, '0')}`;
  }

  private todayLabel(): string {
    const d = new Date();
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  private defaultTeeth(): Tooth[] {
    return this.allNumbers().map(number => ({ number, conditions: [] as ToothCondition[] }));
  }

  private allNumbers(): number[] {
    return [
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
    ];
  }

  private buildPatients(): Patient[] {
    const list: Omit<Patient, 'debt'>[] = [
      { id: 'HC-0001', name: 'MARÍA QUISPE', age: 34, phone: '987 654 321', email: 'maria.quispe@correo.com', address: 'AV. LOS OLIVOS 245, SAN MIGUEL', allergies: 'NINGUNA', status: 'active', treatment: 'ORTODONCIA', lastVisit: '28 JUL 2026', birthday: '15/03' },
      { id: 'HC-0002', name: 'JOSÉ HUAMÁN', age: 41, phone: '912 345 678', email: 'jose.huaman@correo.com', address: 'JR. LOS ÁLAMOS 108, MAGDALENA', allergies: 'PENICILINA', status: 'active', treatment: 'ENDODONCIA', lastVisit: '30 JUL 2026', birthday: '02/08' },
      { id: 'HC-0003', name: 'LUCÍA PAREDES', age: 27, phone: '998 112 233', email: 'lucia.paredes@correo.com', address: 'AV. LA MAR 415, MIRAFLORES', allergies: 'NINGUNA', status: 'active', treatment: 'LIMPIEZA', lastVisit: '18 JUL 2026', birthday: '22/11' },
      { id: 'HC-0004', name: 'CARLOS MENDOZA', age: 52, phone: '955 667 788', email: 'carlos.mendoza@correo.com', address: 'JR. UCAYALI 89, LIMA CENTRO', allergies: 'LÁTEX', status: 'active', treatment: 'CORONA', lastVisit: '25 JUL 2026', birthday: '09/12' },
      { id: 'HC-0005', name: 'ANA FLORES', age: 30, phone: '921 334 455', email: 'ana.flores@correo.com', address: 'AV. AREQUIPA 210, LINCE', allergies: 'NINGUNA', status: 'active', treatment: 'BLANQUEAMIENTO', lastVisit: '22 JUL 2026', birthday: '05/06' },
      { id: 'HC-0006', name: 'PEDRO SÁNCHEZ', age: 47, phone: '966 778 899', email: 'pedro.sanchez@correo.com', address: 'JR. CALLES 320, SURQUILLO', allergies: 'NINGUNA', status: 'inactive', treatment: 'IMPLANTE', lastVisit: '12 JUN 2026', birthday: '18/09' },
      { id: 'HC-0007', name: 'ROSA CÁCERES', age: 38, phone: '977 889 900', email: 'rosa.caceres@correo.com', address: 'AV. MÉXICO 560, JESÚS MARÍA', allergies: 'SULFAS', status: 'active', treatment: 'REHABILITACIÓN', lastVisit: '27 JUL 2026', birthday: '30/08' },
      { id: 'HC-0008', name: 'DIEGO RAMOS', age: 25, phone: '933 445 566', email: 'diego.ramos@correo.com', address: 'JR. TAHUANTINSUYO 74, EL AGUSTINO', allergies: 'NINGUNA', status: 'active', treatment: 'REVISIÓN', lastVisit: '01 AGO 2026', birthday: '20/07' },
      { id: 'HC-0009', name: 'ELENA VARGAS', age: 33, phone: '944 556 677', email: 'elena.vargas@correo.com', address: 'AV. SALAVERRY 900, JESÚS MARÍA', allergies: 'ANESTESIA', status: 'active', treatment: 'ENDODONCIA', lastVisit: '29 JUL 2026', birthday: '11/02' },
      { id: 'HC-0010', name: 'JORGE LUNA', age: 45, phone: '910 223 344', email: 'jorge.luna@correo.com', address: 'JR. CUSCO 152, CERCADO', allergies: 'NINGUNA', status: 'active', treatment: 'EXTRACCIÓN', lastVisit: '20 JUL 2026', birthday: '25/08' }
    ];
    return list.map(p => ({ ...p, debt: this.balanceOf(p.id) }));
  }

  private buildAppointments(): Record<string, PatientAppointment[]> {
    return {
      'HC-0001': [
        { id: 'h1', date: '28 JUL 2026', time: '09:00', treatment: 'ORTODONCIA', dentist: 'DR. RIVERA', status: 'done' },
        { id: 'h2', date: '21 JUL 2026', time: '11:00', treatment: 'ORTODONCIA', dentist: 'DR. RIVERA', status: 'done' },
        { id: 'h3', date: '14 JUL 2026', time: '09:00', treatment: 'ORTODONCIA', dentist: 'DR. RIVERA', status: 'done' }
      ],
      'HC-0004': [
        { id: 'h4', date: '25 JUL 2026', time: '10:00', treatment: 'CORONA', dentist: 'DRA. TORRES', status: 'done' },
        { id: 'h5', date: '11 JUL 2026', time: '12:00', treatment: 'CORONA', dentist: 'DRA. TORRES', status: 'done' },
        { id: 'h6', date: '05 AGO 2026', time: '09:30', treatment: 'CORONA', dentist: 'DRA. TORRES', status: 'scheduled' }
      ],
      'HC-0002': [
        { id: 'h7', date: '30 JUL 2026', time: '08:30', treatment: 'ENDODONCIA', dentist: 'DR. RIVERA', status: 'done' },
        { id: 'h8', date: '23 JUL 2026', time: '08:30', treatment: 'ENDODONCIA', dentist: 'DR. RIVERA', status: 'done' }
      ],
      'HC-0009': [
        { id: 'h9', date: '29 JUL 2026', time: '12:15', treatment: 'ENDODONCIA', dentist: 'DRA. TORRES', status: 'done' },
        { id: 'h10', date: '16 JUL 2026', time: '12:15', treatment: 'ENDODONCIA', dentist: 'DRA. TORRES', status: 'cancelled' },
        { id: 'h11', date: '06 AGO 2026', time: '11:45', treatment: 'ENDODONCIA', dentist: 'DRA. TORRES', status: 'scheduled' }
      ],
      'HC-0007': [
        { id: 'h12', date: '27 JUL 2026', time: '11:15', treatment: 'REHABILITACIÓN', dentist: 'DR. VEGA', status: 'done' },
        { id: 'h13', date: '10 AGO 2026', time: '10:30', treatment: 'REHABILITACIÓN', dentist: 'DR. VEGA', status: 'scheduled' }
      ]
    };
  }

  private buildAccount(): Record<string, AccountEntry[]> {
    return {
      'HC-0001': [
        { id: 'c1', date: '10 JUL 2026', concept: 'ORTODONCIA — CUOTA MENSUAL', amount: 450, type: 'charge' },
        { id: 'c2', date: '21 JUL 2026', concept: 'ABONO A CUENTA', amount: 450, type: 'payment', method: 'EFECTIVO' },
        { id: 'c3', date: '28 JUL 2026', concept: 'ORTODONCIA — CUOTA MENSUAL', amount: 450, type: 'charge' }
      ],
      'HC-0004': [
        { id: 'c4', date: '25 JUN 2026', concept: 'CORONA — INICIAL', amount: 800, type: 'charge' },
        { id: 'c5', date: '11 JUL 2026', concept: 'ABONO A CUENTA', amount: 400, type: 'payment', method: 'TARJETA' },
        { id: 'c6', date: '25 JUL 2026', concept: 'CORONA — FINAL', amount: 900, type: 'charge' }
      ],
      'HC-0002': [
        { id: 'c7', date: '30 JUL 2026', concept: 'ENDODONCIA — PAGO TOTAL', amount: 600, type: 'charge' },
        { id: 'c8', date: '30 JUL 2026', concept: 'ABONO A CUENTA', amount: 600, type: 'payment', method: 'EFECTIVO' }
      ],
      'HC-0003': [
        { id: 'c9', date: '18 JUL 2026', concept: 'LIMPIEZA — PAGO TOTAL', amount: 180, type: 'charge' },
        { id: 'c10', date: '18 JUL 2026', concept: 'ABONO A CUENTA', amount: 180, type: 'payment', method: 'EFECTIVO' }
      ],
      'HC-0009': [
        { id: 'c11', date: '29 JUL 2026', concept: 'ENDODONCIA — CUOTA 1', amount: 300, type: 'charge' },
        { id: 'c12', date: '06 AGO 2026', concept: 'ENDODONCIA — CUOTA 2', amount: 300, type: 'charge' }
      ]
    };
  }

  private buildTeeth(): Record<string, Tooth[]> {
    const teeth = this.defaultTeeth();
    const map: Record<string, Tooth[]> = {};
    map['HC-0004'] = teeth.map(t => {
      if (t.number === 46) return { number: t.number, conditions: ['endodoncia'] as ToothCondition[] };
      if (t.number === 47) return { ...t, faces: [{ face: 'oclusal', condition: 'caries' }] };
      if (t.number === 25) {
        return {
          ...t,
          faces: [
            { face: 'mesial', condition: 'caries' },
            { face: 'distal', condition: 'caries' }
          ]
        };
      }
      if (t.number === 18) return { number: t.number, conditions: ['perdida-por-caries'] as ToothCondition[] };
      if (t.number === 36) {
        return {
          ...t,
          conditions: ['endodoncia'] as ToothCondition[],
          faces: [{ face: 'oclusal', condition: 'obturado' }]
        };
      }
      if (t.number === 31) return { ...t, recesion: '2' };
      if (t.number === 32) return { ...t, movilidad: '1' };
      return t;
    });
    map['HC-0001'] = teeth.map(t => {
      if (t.number === 26 || t.number === 27) {
        return { ...t, faces: [{ face: 'oclusal', condition: 'caries' }] };
      }
      if (t.number === 11) return { number: t.number, conditions: ['perdida-otra-causa'] as ToothCondition[] };
      return t;
    });
    map['HC-0007'] = teeth.map(t => {
      if (t.number >= 14 && t.number <= 17) return { number: t.number, conditions: ['protesis-fija'] as ToothCondition[] };
      return t;
    });
    return map;
  }

  private buildAlerts(): PatientAlert[] {
    return [
      { id: 'a1', type: 'birthday', patientId: 'HC-0002', label: 'JOSÉ HUAMÁN cumple el 02 AGO', handled: false },
      { id: 'a2', type: 'birthday', patientId: 'HC-0007', label: 'ROSA CÁCERES cumple el 30 AGO', handled: false },
      { id: 'a3', type: 'birthday', patientId: 'HC-0010', label: 'JORGE LUNA cumple el 25 AGO', handled: false },
      { id: 'a4', type: 'debt', patientId: 'HC-0004', label: 'CARLOS MENDOZA debe S/ 1,300', handled: false },
      { id: 'a5', type: 'debt', patientId: 'HC-0009', label: 'ELENA VARGAS debe S/ 600', handled: false },
      { id: 'a6', type: 'followup', patientId: 'HC-0006', label: 'PEDRO SÁNCHEZ sin visita desde JUN', handled: true }
    ];
  }
}
