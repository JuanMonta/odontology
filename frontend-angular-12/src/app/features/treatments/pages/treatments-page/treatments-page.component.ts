import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  Treatment,
  TreatmentCategory,
  TreatmentDraft
} from '../../../../core/models/treatment.model';
import { CategoriasHttpService, Categoria } from '../../services/categorias-http.service';
import { TreatmentsHttpService } from '../../services/treatments-http.service';

type CategoryFilter = string | 'all';

@Component({
  selector: 'app-treatments-page',
  templateUrl: './treatments-page.component.html',
  styleUrls: ['./treatments-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentsPageComponent implements OnInit, OnDestroy {
  categories$: Observable<Categoria[]>;
  treatments$: Observable<Treatment[]>;
  selected$: Observable<Treatment | null>;

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly category$ = new BehaviorSubject<CategoryFilter>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private service: TreatmentsHttpService,
    private categoriasService: CategoriasHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.categories$ = categoriasService.categorias$.pipe(
      map(list => list.filter(c => c.activo))
    );
    this.treatments$ = combineLatest([this.service.treatments$, this.search$, this.category$]).pipe(
      map(([list, q, cat]) => {
        const query = q.trim().toUpperCase();
        return list.filter(t => {
          const matchesCat = cat === 'all' || t.categoryCode === cat;
          const matchesQuery =
            !query ||
            t.name.toUpperCase().includes(query) ||
            t.code.includes(query) ||
            t.category.toUpperCase().includes(query);
          return matchesCat && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([this.service.treatments$, this.selectedId$]).pipe(
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

  onSearch(q: string): void {
    this.search$.next(q);
  }

  onCategory(cat: CategoryFilter): void {
    this.category$.next(cat);
  }

  onSelect(treatment: Treatment): void {
    this.selectedId = treatment.id;
    this.selectedId$.next(treatment.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onSaved(draft: TreatmentDraft): void {
    if (this.selectedId) {
      const current = this.service.snapshot().find(t => t.id === this.selectedId);
      if (current) {
        this.service.updateTreatment({ ...current, ...draft });
      }
    } else {
      this.service.addTreatment(draft).subscribe(created => {
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

  onToggleActive(id: string): void {
    this.service.toggleActive(id);
  }

  money(price: number): string {
    return this.service.money(price);
  }
}