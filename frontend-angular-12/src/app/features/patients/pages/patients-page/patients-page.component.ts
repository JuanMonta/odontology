import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Patient, PatientAlert } from '../../../../core/models/patient.model';
import { PatientsHttpService } from '../../services/patients-http.service';

type PatientFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-patients-page',
  templateUrl: './patients-page.component.html',
  styleUrls: ['./patients-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientsPageComponent implements OnInit {
  patients$: Observable<Patient[]>;
  alerts$: Observable<PatientAlert[]>;
  pending$: Observable<number>;

  selected: Patient | null = null;
  creating = false;
  alertsOpen = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly filter$ = new BehaviorSubject<PatientFilter>('all');

  constructor(
    private service: PatientsHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.alerts$ = this.service.alerts$;
    this.pending$ = this.service.alerts$.pipe(
      map(list => list.filter(a => !a.handled).length)
    );
    this.patients$ = combineLatest([this.service.patients$, this.search$, this.filter$]).pipe(
      map(([list, q, f]) => {
        const query = q.trim().toUpperCase();
        return list.filter(p => {
          const matchesFilter = f === 'all' || p.status === f;
          const matchesQuery =
            !query ||
            p.name.toUpperCase().includes(query) ||
            p.id.includes(query) ||
            p.treatment.toUpperCase().includes(query);
          return matchesFilter && matchesQuery;
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

  onFilter(f: PatientFilter): void {
    this.filter$.next(f);
  }

  onSelect(patient: Patient): void {
    this.selected = patient;
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selected = null;
  }

  onSaved(patient: Patient): void {
    this.creating = false;
    this.selected = patient;
    this.router.navigate([], { queryParams: {} });
  }

  cancelCreate(): void {
    this.creating = false;
  }

  onClosePanel(): void {
    this.selected = null;
  }

  toggleAlerts(): void {
    this.alertsOpen = !this.alertsOpen;
  }

  onAlertHandled(id: string): void {
    this.service.markAlertHandled(id);
  }

  onAlertPatient(id: string): void {
    this.alertsOpen = false;
    const found = this.service.findPatient(id);
    if (found) {
      this.selected = found;
      this.creating = false;
    }
  }
}
