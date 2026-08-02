import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Patient, PatientDraft, PatientStatus } from '../../../../core/models/patient.model';

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientFormComponent implements OnInit {
  @Input() patient: Patient | null = null;
  @Output() submit = new EventEmitter<PatientDraft>();
  @Output() cancel = new EventEmitter<void>();

  name = '';
  age = 30;
  phone = '';
  email = '';
  address = '';
  allergies = 'NINGUNA';
  treatment = '';
  status: PatientStatus = 'active';
  birthday = '';
  error = false;

  ngOnInit(): void {
    if (this.patient) {
      this.name = this.patient.name;
      this.age = this.patient.age;
      this.phone = this.patient.phone;
      this.email = this.patient.email;
      this.address = this.patient.address;
      this.allergies = this.patient.allergies;
      this.treatment = this.patient.treatment;
      this.status = this.patient.status;
      this.birthday = this.patient.birthday;
    }
  }

  onSubmit(): void {
    if (!this.name.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: PatientDraft = {
      name: this.name.trim().toUpperCase(),
      age: this.age,
      phone: this.phone.trim(),
      email: this.email.trim(),
      address: this.address.trim(),
      allergies: this.allergies.trim().toUpperCase() || 'NINGUNA',
      treatment: this.treatment.trim().toUpperCase(),
      status: this.status,
      birthday: this.birthday.trim(),
      lastVisit: this.patient ? this.patient.lastVisit : this.todayLabel()
    };
    this.submit.emit(draft);
  }

  private todayLabel(): string {
    const d = new Date();
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }
}
