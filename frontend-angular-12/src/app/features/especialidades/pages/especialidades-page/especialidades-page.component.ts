import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Especialidad, EspecialidadDraft } from '../../../../core/models/especialidad.model';
import { EspecialidadesHttpService } from '../../services/especialidades-http.service';

@Component({
  selector: 'app-especialidades-page',
  templateUrl: './especialidades-page.component.html',
  styleUrls: ['./especialidades-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EspecialidadesPageComponent implements OnInit {
  especialidades$: Observable<Especialidad[]>;
  selected$: Observable<Especialidad | null>;

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly activo$ = new BehaviorSubject<'all' | boolean>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);

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
    this.route.queryParamMap.subscribe(params => {
      if (params.get('nuevo')) {
        this.startCreate();
      }
    });
  }

  onSearch(q: string): void {
    this.search$.next(q);
  }

  onFilter(f: string): void {
    this.activo$.next(f === 'all' ? 'all' : f === 'true');
  }

  onSelect(especialidad: Especialidad): void {
    this.selectedId = especialidad.id;
    this.selectedId$.next(especialidad.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onSaved(draft: EspecialidadDraft): void {
    if (this.selectedId) {
      const current = this.service.snapshot().find(e => e.id === this.selectedId);
      if (current) {
        this.service.updateEspecialidad({ ...current, ...draft });
      }
    } else {
      this.service.addEspecialidad(draft).subscribe(created => {
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
