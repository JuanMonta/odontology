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

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<StatusFilter>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private service: OdontologosHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
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

  onSearch(q: string): void {
    this.search$.next(q);
  }

  onFilter(f: StatusFilter): void {
    this.status$.next(f);
  }

  onSelect(odontologo: Odontologo): void {
    this.selectedId = odontologo.id;
    this.selectedId$.next(odontologo.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onSaved(draft: OdontologoDraft): void {
    if (this.selectedId) {
      const current = this.service.snapshot().find(o => o.id === this.selectedId);
      if (current) {
        this.service.updateOdontologo({ ...current, ...draft });
      }
    } else {
      this.service.addOdontologo(draft).subscribe(created => {
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
}
