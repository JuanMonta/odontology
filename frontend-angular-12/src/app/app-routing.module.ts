import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/patient-dashboard/patient-dashboard.module').then(
            m => m.PatientDashboardModule
          )
      },
      {
        path: 'pacientes',
        loadChildren: () =>
          import('./features/patients/patients.module').then(m => m.PatientsModule)
      },
      {
        path: 'tratamientos',
        loadChildren: () =>
          import('./features/treatments/treatments.module').then(m => m.TreatmentsModule)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
