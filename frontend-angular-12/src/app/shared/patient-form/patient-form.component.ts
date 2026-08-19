import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Patient, PatientDraft, PatientStatus } from '../../core/models/patient.model';
import { borradorKey } from '../../core/auth/session-local-storage';

/** Clave base del borrador del alta de paciente en localStorage. */
export const PATIENT_FORM_DRAFT_KEY = 'saas.clinica.patient-form.draft';

/** Descarta el borrador guardado (al cancelar o guardar un alta). */
export function clearPatientFormDraft(): void {
  try {
    localStorage.removeItem(borradorKey(PATIENT_FORM_DRAFT_KEY));
  } catch {
    // almacenamiento no disponible: el borrador simplemente se ignora
  }
}

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientFormComponent implements OnInit {
  @Input() patient: Patient | null = null;
  @Output() saved = new EventEmitter<PatientDraft>();
  @Output() cancel = new EventEmitter<void>();

  name = '';
  cedula = '';
  sexo = '';
  birthDate = '';
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
      this.cedula = this.patient.cedula === '—' ? '' : this.patient.cedula;
      this.sexo = this.patient.sexo === '—' ? '' : this.patient.sexo;
      this.birthDate = this.patient.birthDate;
      this.recalcularDesdeNacimiento();
      this.phone = this.patient.phone;
      this.email = this.patient.email;
      this.address = this.patient.address;
      this.allergies = this.patient.allergies;
      this.treatment = this.patient.treatment;
      this.status = this.patient.status;
    } else {
      this.restoreDraft();
    }
  }

  onSubmit(): void {
    if (!this.name.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    this.recalcularDesdeNacimiento();
    const draft: PatientDraft = {
      name: this.name.trim().toUpperCase(),
      cedula: this.cedula.trim(),
      sexo: this.sexo,
      birthDate: this.birthDate,
      age: this.age,
      phone: this.phone.trim(),
      email: this.email.trim(),
      address: this.address.trim(),
      allergies: this.allergies.trim().toUpperCase() || 'NINGUNA',
      treatment: this.treatment.trim().toUpperCase(),
      status: this.status,
      birthday: this.birthday,
      lastVisit: this.patient ? this.patient.lastVisit : this.todayLabel(),
      fechaNacimiento: this.birthDate || null
    };
    if (!this.patient) {
      clearPatientFormDraft();
    }
    this.saved.emit(draft);
  }

  onCancel(): void {
    clearPatientFormDraft();
    this.cancel.emit();
  }

  setStatus(status: PatientStatus): void {
    this.status = status;
    this.persistDraft();
  }

  setSexo(sexo: string): void {
    this.sexo = sexo;
    this.persistDraft();
  }

  onBirthDateChange(): void {
    this.recalcularDesdeNacimiento();
    this.persistDraft();
  }

  /** Deriva edad (años cumplidos) y cumpleaños (DD/MM) desde birthDate ISO. */
  private recalcularDesdeNacimiento(): void {
    if (!this.birthDate) {
      this.age = 0;
      this.birthday = '';
      return;
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(this.birthDate);
    if (!m) {
      this.age = 0;
      this.birthday = '';
      return;
    }
    const nacimiento = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const aniversario = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());
    if (hoy < aniversario) {
      edad--;
    }
    this.age = Math.max(0, edad);
    this.birthday = `${m[3]}/${m[2]}`;
  }

  persistDraft(): void {
    if (this.patient) {
      return;
    }
    try {
      localStorage.setItem(
        borradorKey(PATIENT_FORM_DRAFT_KEY),
        JSON.stringify({
          name: this.name,
          cedula: this.cedula,
          sexo: this.sexo,
          birthDate: this.birthDate,
          age: this.age,
          phone: this.phone,
          email: this.email,
          address: this.address,
          allergies: this.allergies,
          treatment: this.treatment,
          status: this.status,
          birthday: this.birthday
        })
      );
    } catch {
      // almacenamiento no disponible: el borrador simplemente no se persiste
    }
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(borradorKey(PATIENT_FORM_DRAFT_KEY));
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw);
      if (typeof saved !== 'object' || saved === null) {
        return;
      }
      this.name = typeof saved.name === 'string' ? saved.name : this.name;
      this.cedula = typeof saved.cedula === 'string' ? saved.cedula : this.cedula;
      this.sexo = typeof saved.sexo === 'string' ? saved.sexo : this.sexo;
      this.birthDate = typeof saved.birthDate === 'string' ? saved.birthDate : this.birthDate;
      this.age = Number.isFinite(saved.age) ? saved.age : this.age;
      this.phone = typeof saved.phone === 'string' ? saved.phone : this.phone;
      this.email = typeof saved.email === 'string' ? saved.email : this.email;
      this.address = typeof saved.address === 'string' ? saved.address : this.address;
      this.allergies = typeof saved.allergies === 'string' ? saved.allergies : this.allergies;
      this.treatment = typeof saved.treatment === 'string' ? saved.treatment : this.treatment;
      this.status = saved.status === 'inactive' ? 'inactive' : 'active';
      this.birthday = typeof saved.birthday === 'string' ? saved.birthday : this.birthday;
    } catch {
      // borrador corrupto: se ignora y se arranca en blanco
    }
  }

  private todayLabel(): string {
    const d = new Date();
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }
}
