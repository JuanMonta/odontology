import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Especialidad, EspecialidadDraft } from '../../../../core/models/especialidad.model';
import { EspecialidadesHttpService } from '../../services/especialidades-http.service';

@Component({
  selector: 'app-especialidades-page',
  templateUrl: './especialidades-page.component.html',
  styleUrls: ['./especialidades-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EspecialidadesPageComponent implements OnInit, OnDestroy {
  especialidades$: Observable<Especialidad[]>;
  selected$: Observable<Especialidad | null>;

  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly activo$ = new BehaviorSubject<'all' | boolean>('all');
  readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private service: EspecialidadesHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.especialidades$ = combineLatest([this.service.especialidades$, this.search$, this.activo$]).pipe(
      map(([list, q, filter]) => {
        const query = q.trim().toUpperCase();
        return list.filter(e => {
          const matchesStatus = filter === 'all' || e.activo === filter;
          const matchesQuery =
            !query ||
            e.nombre.toUpperCase().includes(query) ||
            e.code.includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([this.service.especialidades$, this.selectedId$]).pipe(
      map(([list, id]) => (id ? list.find(e => e.id === id) ?? null : null))
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
  }

  onFilter(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.activo$.next(v === 'all' ? 'all' : v === 'true');
  }

  onSelect(especialidad: Especialidad): void {
    this.selectedId$.next(especialidad.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId$.next(null);
  }

  onSaved(draft: EspecialidadDraft): void {
    const selectedId = this.selectedId$.getValue();
    if (selectedId) {
      const current = this.service.snapshot().find(e => e.id === selectedId);
      if (current) {
        this.service.updateEspecialidad({ ...current, ...draft });
      }
    } else {
      this.service.addEspecialidad(draft).subscribe(created => {
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
