import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { Appointment } from '../../../../core/models/appointment.model';

@Component({
  selector: 'app-departures-board',
  templateUrl: './departures-board.component.html',
  styleUrls: ['./departures-board.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeparturesBoardComponent {
  @Input() appointments: Appointment[] = [];
  @Input() waitingPatients: string[] = [];
  @Output() markDone = new EventEmitter<string>();
  @Output() checkIn = new EventEmitter<string>();
  @Output() noShow = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<string>();

  statusLabel(status: Appointment['status']): string {
    const labels: Record<Appointment['status'], string> = {
      'on-time': 'PROGRAMADA',
      arrived: 'LLEGÓ',
      boarding: 'EN CONSULTORIO',
      delayed: 'CON RETRASO',
      'no-show': 'NO ASISTIÓ',
      cancelled: 'CANCELADA',
      done: 'ATENDIDA'
    };
    return labels[status];
  }

  isWaiting(name: string): boolean {
    return this.waitingPatients.includes(name.toUpperCase());
  }

  trackById(_: number, a: Appointment): string {
    return a.id;
  }
}
