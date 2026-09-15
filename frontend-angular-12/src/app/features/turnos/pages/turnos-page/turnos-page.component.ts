import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Turno, TurnoDraft } from '../../../../core/models/turno.model';
import { TurnosHttpService } from '../../services/turnos-http.service';
import { readListState, saveListState } from '../../../../shared/components/pagination/list-state';

@Component({
  selector: 'app-turnos-page',
  templateUrl: './turnos-page.component.html',
  styleUrls: ['./turnos-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurnosPageComponent implements OnInit, OnDestroy {
  turnos$: Observable<Turno[]>;
  selected$: Observable<Turno | null>;

  creating = false;

  readonly search$ = new BehaviorSubject<string>('');
  readonly activo$ = new BehaviorSubject<'all' | boolean>('all');
  readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private service: TurnosHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const _s = readListState('turnos');
    const _sq = _s?.query ?? '';
    const _sf = _s?.filter ?? 'all';
    this.search$.next(_sq);
    this.activo$.next(_sf === 'all' ? 'all' : _sf === 'true');
    this.turnos$ = combineLatest([this.service.turnos$, this.search$, this.activo$]).pipe(
      map(([list, q, filter]) => {
        const query = q.trim().toUpperCase();
        return list.filter(t => {
          const matchesStatus = filter === 'all' || t.activo === filter;
          const matchesQuery =
            !query ||
            t.nombre.toUpperCase().includes(query) ||
            t.code.includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([this.service.turnos$, this.selectedId$]).pipe(
      map(([list, id]) => (id ? list.find(t => t.id === id) ?? null : null))
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

  get activoFilterValue(): string {
    const v = this.activo$.value;
    return v === true ? 'true' : v === false ? 'false' : 'all';
  }

  onSearch(ev: Event): void {
    this.search$.next((ev.target as HTMLInputElement).value);
    const _st = readListState('turnos') ?? { page: 1, pageSize: 10, scrollTop: 0 };
    saveListState('turnos', { ..._st, query: (ev.target as HTMLInputElement).value });
  }

  onFilter(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.activo$.next(v === 'all' ? 'all' : v === 'true');
    const _st = readListState('turnos') ?? { page: 1, pageSize: 10, scrollTop: 0 };
    saveListState('turnos', { ..._st, filter: (ev.target as HTMLSelectElement).value });
  }

  onSelect(turno: Turno): void {
    this.selectedId$.next(turno.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId$.next(null);
  }

  onSaved(draft: TurnoDraft): void {
    const selectedId = this.selectedId$.getValue();
    if (selectedId) {
      const current = this.service.snapshot().find(t => t.id === selectedId);
      if (current) {
        this.service.updateTurno({ ...current, ...draft });
      }
    } else {
      this.service.addTurno(draft).subscribe(created => {
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
    this.selectedId$.next(null);
  }

  onToggleStatus(id: string): void {
    this.service.toggleStatus(id);
  }
}
