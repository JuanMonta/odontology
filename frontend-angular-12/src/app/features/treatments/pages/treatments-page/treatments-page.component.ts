import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Treatment,
  TreatmentCategory,
  TreatmentDraft
} from '../../../../core/models/treatment.model';
import { TREATMENT_CATEGORIES, TreatmentsHttpService } from '../../services/treatments-http.service';

type CategoryFilter = TreatmentCategory | 'all';

@Component({
  selector: 'app-treatments-page',
  templateUrl: './treatments-page.component.html',
  styleUrls: ['./treatments-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentsPageComponent implements OnInit {
  categories = TREATMENT_CATEGORIES;
  treatments$: Observable<Treatment[]>;

  selected: Treatment | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly category$ = new BehaviorSubject<CategoryFilter>('all');

  constructor(
    private service: TreatmentsHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.treatments$ = combineLatest([this.service.treatments$, this.search$, this.category$]).pipe(
      map(([list, q, cat]) => {
        const query = q.trim().toUpperCase();
        return list.filter(t => {
          const matchesCat = cat === 'all' || t.category === cat;
          const matchesQuery =
            !query ||
            t.name.toUpperCase().includes(query) ||
            t.code.includes(query) ||
            t.category.toUpperCase().includes(query);
          return matchesCat && matchesQuery;
        });
      })
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

  onCategory(cat: CategoryFilter): void {
    this.category$.next(cat);
  }

  onSelect(treatment: Treatment): void {
    this.selected = treatment;
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selected = null;
  }

  onSaved(draft: TreatmentDraft): void {
    if (this.selected) {
      this.service.updateTreatment({ ...this.selected, ...draft });
    } else {
      this.service.addTreatment(draft).subscribe(created => {
        this.selected = created;
      });
    }
    this.creating = false;
    this.router.navigate([], { queryParams: {} });
  }

  cancelCreate(): void {
    this.creating = false;
  }

  onClosePanel(): void {
    this.selected = null;
  }

  onToggleActive(id: string): void {
    this.service.toggleActive(id);
  }

  money(price: number): string {
    return this.service.money(price);
  }
}
