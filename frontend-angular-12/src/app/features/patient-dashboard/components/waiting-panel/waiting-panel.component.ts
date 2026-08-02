import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { WaitingPatient } from '../../../../core/models/appointment.model';

@Component({
  selector: 'app-waiting-panel',
  templateUrl: './waiting-panel.component.html',
  styleUrls: ['./waiting-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaitingPanelComponent {
  @Input() waiting: WaitingPatient[] = [];
  @Output() callNext = new EventEmitter<void>();

  trackById(_: number, p: WaitingPatient): string {
    return p.id;
  }
}
