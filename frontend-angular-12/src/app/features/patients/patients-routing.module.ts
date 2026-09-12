import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientsPageComponent } from './pages/patients-page/patients-page.component';
import { PatientDetailPageComponent } from './pages/patient-detail-page/patient-detail-page.component';

const routes: Routes = [
  { path: '', component: PatientsPageComponent },
  { path: ':id', component: PatientDetailPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientsRoutingModule { }
