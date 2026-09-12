import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Patient, PatientDetail, Tooth } from '../../../../core/models/patient.model';
import { PatientsHttpService } from '../../services/patients-http.service';

type WsTab = 'odonto' | 'hcl033';

@Component({
  selector: 'app-patient-detail-page',
  templateUrl: './patient-detail-page.component.html',
  styleUrls: ['./patient-detail-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientDetailPageComponent implements OnInit, OnDestroy {
  patient: Patient | null = null;
  detail$: Observable<PatientDetail> | null = null;
  tab: WsTab = 'odonto';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: PatientsHttpService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.open(params.get('id'));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('');
  }

  onToothChange(teeth: Tooth[]): void {
    if (this.patient) {
      this.service.updateTeeth(this.patient.id, teeth);
    }
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private open(id: string | null): void {
    if (!id) {
      this.goBack();
      return;
    }
    const patient = this.service.findPatient(id);
    if (!patient) {
      this.goBack();
      return;
    }
    this.patient = patient;
    this.detail$ = this.service.patientDetail$(patient.id);
    this.tab = 'odonto';
    this.cd.markForCheck();
  }
}