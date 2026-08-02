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
  @Output() markDone = new EventEmitter<string>();

  statusLabel(status: Appointment['status']): string {
    const labels: Record<Appointment['status'], string> = {
      'on-time': 'A TIEMPO',
      boarding: 'EN CONSULTORIO',
      delayed: 'RETRASADA',
      cancelled: 'CANCELADA',
      done: 'ATENDIDA'
    };
    return labels[status];
  }

  trackById(_: number, a: Appointment): string {
    return a.id;
  }
}
