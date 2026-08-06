import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFormComponent } from './patient-form.component';

@NgModule({
  declarations: [PatientFormComponent],
  imports: [CommonModule, FormsModule],
  exports: [PatientFormComponent]
})
export class PatientFormModule {}
