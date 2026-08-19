import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  Consultorio,
  ConsultorioSaveEvent,
  ConsultorioStaff,
  ConsultorioStatus,
  StaffShiftState
} from '../../../../core/models/consultorio.model';
import { Turno } from '../../../../core/models/turno.model';
import { ConsultoriosHttpService } from '../../services/consultorios-http.service';
import { OdontologosHttpService } from '../../../odontologos/services/odontologos-http.service';
import { TurnosHttpService } from '../../../turnos/services/turnos-http.service';

type StatusFilter = ConsultorioStatus | 'all';

/** Prioridad de orden del roster: en turno primero, luego descanso, luego fuera. */
const STATE_RANK: Record<StaffShiftState, number> = { turno: 0, descanso: 1, fuera: 2 };

@Component({
  selector: 'app-consultorios-page',
  templateUrl: './consultorios-page.component.html',
  styleUrls: ['./consultorios-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultoriosPageComponent implements OnInit, OnDestroy {
  consultorios$: Observable<Consultorio[]>;
  selected$: Observable<Consultorio | null>;

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<StatusFilter>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly now$ = timer(0, 30_000).pipe(map(() => new Date()));
  private readonly destroy$ = new Subject<void>();

  constructor(
    private service: ConsultoriosHttpService,
    private odontologos: OdontologosHttpService,
    private turnos: TurnosHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const withStaff$ = combineLatest([
      this.service.consultorios$,
      this.odontologos.odontologos$,
      this.turnos.turnos$,
      this.now$
    ]).pipe(map(([list, odontologos, turnos, now]) => this.applyStaff(list, odontologos, turnos, now)));

    this.consultorios$ = combineLatest([withStaff$, this.search$, this.status$]).pipe(
      map(([list, q, filter]) => {
        const query = q.trim().toUpperCase();
        return list.filter(c => {
          const matchesStatus = filter === 'all' || c.status === filter;
          const matchesQuery =
            !query ||
            c.name.toUpperCase().includes(query) ||
            c.code.includes(query) ||
            c.staff.some(s => s.name.toUpperCase().includes(query)) ||
            c.location.toUpperCase().includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([withStaff$, this.selectedId$]).pipe(
      map(([list, id]) => (id ? list.find(c => c.id === id) ?? null : null))
    );
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params.get('nuevo')) {
        this.startCreate();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  onSaved(ev: ConsultorioSaveEvent): void {
    const { draft, assigned } = ev;
    if (this.selectedId) {
      const current = this.service.snapshot().find(c => c.id === this.selectedId);
      if (current) {
        this.service.updateConsultorio({ ...current, ...draft });
        this.applyAssignment(current.code, assigned);
      }
    } else {
      this.service.addConsultorio(draft).subscribe(created => {
        this.selectedId = created.id;
        this.selectedId$.next(created.id);
        this.applyAssignment(created.code, assigned);
      });
    }
    this.creating = false;
    this.router.navigate([], { queryParams: {} });
  }

  /**
   * Sincroniza odontologos.consultorio_codigo con la selección del form:
   * asigna los marcados a esta sala y libera los que dejaron de estarlo.
   */
  private applyAssignment(consultorioCode: string, assigned: string[]): void {
    for (const o of this.odontologos.snapshot()) {
      const belongs = o.consultorio === consultorioCode;
      const wanted = assigned.includes(o.code);
      if (wanted && !belongs) {
        this.odontologos.assignConsultorio(o.code, consultorioCode);
      } else if (!wanted && belongs) {
        this.odontologos.assignConsultorio(o.code, null);
      }
    }
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

  /**
   * Roster en vivo de la sala: los odontólogos con {@code consultorio_codigo}
   * igual a esta sala, cada uno con su turno del catálogo y el estado derivado
   * del reloj (en turno / en descanso / fuera de turno).
   */
  private applyStaff(
    list: Consultorio[],
    odontologos: { code: string; name: string; specialty: string; turno: string; consultorio: string; status: string }[],
    turnos: Turno[],
    now: Date
  ): Consultorio[] {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const turnoByName = new Map(turnos.map(t => [t.nombre, t]));

    return list.map(c => {
      const staff: ConsultorioStaff[] = odontologos
        .filter(o => o.consultorio === c.code && o.status !== 'inactivo')
        .map(o => {
          const turno = turnoByName.get(o.turno);
          const state = turno ? this.shiftState(turno, nowMin) : 'fuera';
          return {
            code: o.code,
            name: o.name,
            specialty: o.specialty,
            turno: o.turno,
            jornada: turno ? `${turno.horaInicio}–${turno.horaFin}` : '',
            state
          };
        })
        .sort(
          (a, b) =>
            STATE_RANK[a.state] - STATE_RANK[b.state] || a.name.localeCompare(b.name)
        );
      return { ...c, staff };
    });
  }

  private shiftState(turno: Turno, nowMin: number): StaffShiftState {
    const start = this.toMin(turno.horaInicio);
    const end = this.toMin(turno.horaFin);
    if (nowMin < start || nowMin >= end) {
      return 'fuera';
    }
    if (
      turno.descansoInicio &&
      turno.descansoFin &&
      nowMin >= this.toMin(turno.descansoInicio) &&
      nowMin < this.toMin(turno.descansoFin)
    ) {
      return 'descanso';
    }
    return 'turno';
  }

  private toMin(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      return Number.NaN;
    }
    return h * 60 + m;
  }
}
