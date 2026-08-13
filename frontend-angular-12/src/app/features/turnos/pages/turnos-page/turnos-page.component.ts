import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Turno, TurnoDraft } from '../../../../core/models/turno.model';
import { TurnosHttpService } from '../../services/turnos-http.service';

@Component({
  selector: 'app-turnos-page',
  templateUrl: './turnos-page.component.html',
  styleUrls: ['./turnos-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurnosPageComponent implements OnInit {
  turnos$: Observable<Turno[]>;
  selected$: Observable<Turno | null>;

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly activo$ = new BehaviorSubject<'all' | boolean>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);

  constructor(
    private service: TurnosHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
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

  onSelect(turno: Turno): void {
    this.selectedId = turno.id;
    this.selectedId$.next(turno.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onSaved(draft: TurnoDraft): void {
    if (this.selectedId) {
      const current = this.service.snapshot().find(t => t.id === this.selectedId);
      if (current) {
        this.service.updateTurno({ ...current, ...draft });
      }
    } else {
      this.service.addTurno(draft).subscribe(created => {
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
