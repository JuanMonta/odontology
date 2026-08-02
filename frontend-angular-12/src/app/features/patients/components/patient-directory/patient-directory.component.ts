import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Patient } from '../../../../core/models/patient.model';

@Component({
  selector: 'app-patient-directory',
  templateUrl: './patient-directory.component.html',
  styleUrls: ['./patient-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientDirectoryComponent {
  @Input() patients: Patient[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Patient>();

  fmtMoney(n: number): string {
    return n > 0 ? `S/ ${n.toLocaleString('en-US')}` : 'AL DÍA';
  }

  trackById(_: number, p: Patient): string {
    return p.id;
  }
}
