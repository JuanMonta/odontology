import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Consultorio,
  ConsultorioDraft,
  ConsultorioStatus
} from '../../../../core/models/consultorio.model';
import { ConsultoriosHttpService } from '../../services/consultorios-http.service';

type StatusFilter = ConsultorioStatus | 'all';

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

  constructor(
    private service: ConsultoriosHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.consultorios$ = combineLatest([this.service.consultorios$, this.search$, this.status$]).pipe(
      map(([list, q, filter]) => {
        const query = q.trim().toUpperCase();
        return list.filter(c => {
          const matchesStatus = filter === 'all' || c.status === filter;
          const matchesQuery =
            !query ||
            c.name.toUpperCase().includes(query) ||
            c.code.includes(query) ||
            c.dentist.toUpperCase().includes(query) ||
            c.location.toUpperCase().includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([this.service.consultorios$, this.selectedId$]).pipe(
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
}
