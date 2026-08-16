import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientsRoutingModule } from './patients-routing.module';
import { OdontogramModule } from '../../shared/odontogram/odontogram.module';
import { PatientFormModule } from '../../shared/patient-form/patient-form.module';
import { PaginationModule } from '../../shared/components/pagination/pagination.module';
import { PatientsPageComponent } from './pages/patients-page/patients-page.component';
import { PatientDirectoryComponent } from './components/patient-directory/patient-directory.component';
import { PatientPanelComponent } from './components/patient-panel/patient-panel.component';
import { Hcl033Component } from './components/hcl-033/hcl-033.component';

@NgModule({
  declarations: [
    PatientsPageComponent,
    PatientDirectoryComponent,
    PatientPanelComponent,
    Hcl033Component
  ],
  imports: [
    CommonModule,
    FormsModule,
    PatientsRoutingModule,
    OdontogramModule,
    PatientFormModule,
    PaginationModule
  ],
  providers: [],
  exports: [PatientsPageComponent]
})
export class PatientsModule { }
