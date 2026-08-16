import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Patient } from '../../../../core/models/patient.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';

@Component({
  selector: 'app-patient-directory',
  templateUrl: './patient-directory.component.html',
  styleUrls: ['./patient-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientDirectoryComponent extends PaginatedListComponent {
  @Input() patients: Patient[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Patient>();

  protected get totalItems(): number {
    return this.patients.length;
  }

  get visiblePatients(): Patient[] {
    return this.slice(this.patients) as Patient[];
  }

  fmtMoney(n: number): string {
    return n > 0 ? `$ ${n.toLocaleString('en-US')}` : 'AL D�?A';
  }

  trackById(_: number, p: Patient): string {
    return p.id;
  }
}

