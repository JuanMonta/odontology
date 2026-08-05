import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PatientsRoutingModule } from './patients-routing.module';
import { PatientsPageComponent } from './pages/patients-page/patients-page.component';
import { PatientDirectoryComponent } from './components/patient-directory/patient-directory.component';
import { PatientPanelComponent } from './components/patient-panel/patient-panel.component';
import { PatientFormComponent } from './components/patient-form/patient-form.component';
import { OdontogramComponent } from './components/odontogram/odontogram.component';
import { OdontogramIconsService } from './components/odontogram/odontogram-icons.service';

@NgModule({
  declarations: [
    PatientsPageComponent,
    PatientDirectoryComponent,
    PatientPanelComponent,
    PatientFormComponent,
    OdontogramComponent
  ],
  imports: [CommonModule, FormsModule, HttpClientModule, PatientsRoutingModule],
  providers: [OdontogramIconsService],
  exports: [PatientsPageComponent]
})
export class PatientsModule { }
