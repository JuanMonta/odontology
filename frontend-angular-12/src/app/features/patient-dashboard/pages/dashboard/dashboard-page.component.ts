import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Appointment, BoardTotals, WaitingPatient } from '../../../../core/models/appointment.model';
import { DashboardHttpService } from '../../services/dashboard-http.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  appointments$: Observable<Appointment[]>;
  waiting$: Observable<WaitingPatient[]>;
  totals$: Observable<BoardTotals>;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly mock: DashboardHttpService) {
    this.appointments$ = this.mock.appointments$;
    this.waiting$ = this.mock.waiting$;
    this.totals$ = this.mock.appointments$.pipe(
      map(list => this.computeTotals(list)),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCallNext(): void {
    this.mock.callWaitingPatient();
  }

  onMarkDone(id: string): void {
    this.mock.markDone(id);
  }

  private computeTotals(list: Appointment[]): BoardTotals {
    return {
      total: list.length,
      waiting: list.filter(a => a.status === 'on-time').length,
      delayed: list.filter(a => a.status === 'delayed').length,
      done: list.filter(a => a.status === 'done').length
    };
  }
}
