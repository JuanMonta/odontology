import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  Odontologo,
  OdontologoDraft,
  OdontologoStatus
} from '../../../../core/models/odontologo.model';
import { OdontologosHttpService } from '../../services/odontologos-http.service';
import { readListState, saveListState } from '../../../../shared/components/pagination/list-state';

type StatusFilter = OdontologoStatus | 'all';

@Component({
  selector: 'app-odontologos-page',
  templateUrl: './odontologos-page.component.html',
  styleUrls: ['./odontologos-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdontologosPageComponent implements OnInit, OnDestroy {
  odontologos$: Observable<Odontologo[]>;
  selected$: Observable<Odontologo | null>;

  creating = false;

  readonly search$ = new BehaviorSubject<string>('');
  readonly status$ = new BehaviorSubject<StatusFilter>('all');
  readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private service: OdontologosHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const _s = readListState('odontologos');
    const _sq = _s?.query ?? '';
    const _sf = _s?.filter ?? 'all';
    this.search$.next(_sq);
    this.status$.next(_sf as StatusFilter);
    this.odontologos$ = combineLatest([this.service.odontologos$, this.search$, this.status$]).pipe(
      map(([list, q, filter]) => {
        const query = q.trim().toUpperCase();
        return list.filter(o => {
          const matchesStatus = filter === 'all' || o.status === filter;
          const matchesQuery =
            !query ||
            o.name.toUpperCase().includes(query) ||
            o.code.includes(query) ||
            o.specialty.toUpperCase().includes(query) ||
            o.consultorio.includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([this.service.odontologos$, this.selectedId$]).pipe(
      map(([list, id]) => (id ? list.find(o => o.id === id) ?? null : null))
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

  onSearch(ev: Event): void {
    this.search$.next((ev.target as HTMLInputElement).value);
    const _st = readListState('odontologos') ?? { page: 1, pageSize: 10, scrollTop: 0 };
    saveListState('odontologos', { ..._st, query: (ev.target as HTMLInputElement).value });
  }

  onFilter(ev: Event): void {
    this.status$.next((ev.target as HTMLSelectElement).value as StatusFilter);
    const _st = readListState('odontologos') ?? { page: 1, pageSize: 10, scrollTop: 0 };
    saveListState('odontologos', { ..._st, filter: (ev.target as HTMLSelectElement).value });
  }

  onSelect(odontologo: Odontologo): void {
    this.selectedId$.next(odontologo.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId$.next(null);
  }

  onSaved(draft: OdontologoDraft): void {
    const selectedId = this.selectedId$.getValue();
    if (selectedId) {
      const current = this.service.snapshot().find(o => o.id === selectedId);
      if (current) {
        this.service.updateOdontologo({ ...current, ...draft });
      }
    } else {
      this.service.addOdontologo(draft).subscribe(created => {
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
