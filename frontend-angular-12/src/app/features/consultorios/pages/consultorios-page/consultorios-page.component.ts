import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Consultorio,
  ConsultorioDraft,
  ConsultorioStatus
} from '../../../../core/models/consultorio.model';
import { Appointment } from '../../../../core/models/appointment.model';
import { ConsultoriosHttpService } from '../../services/consultorios-http.service';
import { DashboardHttpService } from '../../../patient-dashboard/services/dashboard-http.service';

type StatusFilter = ConsultorioStatus | 'all';

/** Duración por defecto de un bloque cuando la cita no informa hora_fin. */
const SLOT_FALLBACK_MIN = 45;

@Component({
  selector: 'app-consultorios-page',
  templateUrl: './consultorios-page.component.html',
  styleUrls: ['./consultorios-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultoriosPageComponent implements OnInit {
  consultorios$: Observable<Consultorio[]>;
  selected$: Observable<Consultorio | null>;

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<StatusFilter>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly now$ = timer(0, 30_000).pipe(map(() => new Date()));

  constructor(
    private service: ConsultoriosHttpService,
    private dashboard: DashboardHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const withOccupancy$ = combineLatest([
      this.service.consultorios$,
      this.dashboard.appointments$,
      this.now$
    ]).pipe(map(([list, appointments, now]) => this.applyOccupancy(list, appointments, now)));

    this.consultorios$ = combineLatest([withOccupancy$, this.search$, this.status$]).pipe(
      map(([list, q, filter]) => {
        const query = q.trim().toUpperCase();
        return list.filter(c => {
          const matchesStatus = filter === 'all' || c.status === filter;
          const matchesQuery =
            !query ||
            c.name.toUpperCase().includes(query) ||
            c.code.includes(query) ||
            (c.currentDentist ?? '').toUpperCase().includes(query) ||
            c.location.toUpperCase().includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([withOccupancy$, this.selectedId$]).pipe(
      map(([list, id]) => (id ? list.find(c => c.id === id) ?? null : null))
    );
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('nuevo')) {
        this.startCreate();
      }
    });
  }

  onSearch(q: string): void {
    this.search$.next(q);
  }

  onFilter(f: StatusFilter): void {
    this.status$.next(f);
  }

  onSelect(consultorio: Consultorio): void {
    this.selectedId = consultorio.id;
    this.selectedId$.next(consultorio.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onSaved(draft: ConsultorioDraft): void {
    if (this.selectedId) {
      const current = this.service.snapshot().find(c => c.id === this.selectedId);
      if (current) {
        this.service.updateConsultorio({ ...current, ...draft });
      }
    } else {
      this.service.addConsultorio(draft).subscribe(created => {
        this.selectedId = created.id;
        this.selectedId$.next(created.id);
      });
    }
    this.creating = false;
    this.router.navigate([], { queryParams: {} });
  }

  cancelCreate(): void {
    this.creating = false;
  }

  onClosePanel(): void {
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onToggleStatus(id: string): void {
    this.service.toggleStatus(id);
  }

  /** Quién está en turno ahora en cada sala, derivado de la agenda del día. */
  private applyOccupancy(list: Consultorio[], appointments: Appointment[], now: Date): Consultorio[] {
    const occupants = new Map<string, { time: number; dentist: string }>();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const a of appointments) {
      if (a.status === 'cancelled') {
        continue;
      }
      const start = this.parseMinutes(a.time);
      if (start === null) {
        continue;
      }
      const end = a.horaFin ? this.parseMinutes(a.horaFin) : start + SLOT_FALLBACK_MIN;
      if (end === null || nowMin < start || nowMin >= end) {
        continue;
      }
      const key = this.roomKey(a.consultorio);
      const prev = occupants.get(key);
      if (!prev || start > prev.time) {
        occupants.set(key, { time: start, dentist: a.dentist });
      }
    }

    return list.map(c => {
      const occupant = occupants.get(this.roomKey(c.code));
      return { ...c, currentDentist: occupant?.dentist ?? null };
    });
  }

  private parseMinutes(hhmm: string): number | null {
    const [h, m] = hhmm.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      return null;
    }
    return h * 60 + m;
  }

  /** "CON 01", "CON-001" y "CONSULTORIO 01" colapsan a la misma clave. */
  private roomKey(s: string): string {
    const m = s.toUpperCase().match(/^([A-Z]+)?\D*?(\d+)$/);
    if (!m) {
      return s.toUpperCase().replace(/[^A-Z]/g, '');
    }
    return `${m[1] || 'CON'}:${Number(m[2])}`;
  }
}
