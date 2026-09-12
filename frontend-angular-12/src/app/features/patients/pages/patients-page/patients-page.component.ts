import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Patient, PatientAlert } from '../../../../core/models/patient.model';
import { PatientsHttpService } from '../../services/patients-http.service';
import { PatientsSelectionService } from '../../services/patients-selection.service';

type PatientFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-patients-page',
  templateUrl: './patients-page.component.html',
  styleUrls: ['./patients-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientsPageComponent implements OnInit, OnDestroy {
  patients$: Observable<Patient[]>;
  alerts$: Observable<PatientAlert[]>;
  pending$: Observable<number>;

  selected: Patient | null = null;
  creating = false;
  alertsOpen = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly filter$ = new BehaviorSubject<PatientFilter>('all');
  private readonly destroy$ = new Subject<void>();

  constructor(
    private service: PatientsHttpService,
    private route: ActivatedRoute,
    private router: Router,
    private selection: PatientsSelectionService,
    private cd: ChangeDetectorRef
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
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params.get('nuevo')) {
        this.startCreate();
      }
    });

    // Restaura la selección al volver desde el detalle (/pacientes/:id): la
    // página se recrea y su estado local ya no existe, pero la sesión sí lo
    // recuerda (PatientsSelectionService).
    combineLatest([this.service.patients$, this.selection.selectedId$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([list, id]) => {
        if (this.selected || !id) {
          return;
        }
        const found = list.find(p => p.id === id);
        if (found) {
          this.selected = found;
          this.cd.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(q: Event): void {
    this.search$.next((q.target as HTMLInputElement).value);
  }

  onFilter(f: Event): void {
    this.filter$.next((f.target as HTMLSelectElement).value as PatientFilter);
  }

  onSelect(patient: Patient): void {
    this.selected = patient;
    this.creating = false;
    this.selection.select(patient.id);
  }

  onOpen(patient: Patient): void {
    this.selection.select(patient.id);
    this.router.navigate([patient.id], { relativeTo: this.route });
  }

  onOpenExpedient(): void {
    if (this.selected) {
      this.onOpen(this.selected);
    }
  }

  startCreate(): void {
    this.creating = true;
    this.selected = null;
    this.selection.select(null);
  }

  onSaved(patient: Patient): void {
    this.creating = false;
    this.selected = patient;
    this.selection.select(patient.id);
    this.router.navigate([], { queryParams: {} });
  }

  cancelCreate(): void {
    this.creating = false;
  }

  onClosePanel(): void {
    this.selected = null;
    this.selection.select(null);
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
      this.onSelect(found);
    }
  }
}
