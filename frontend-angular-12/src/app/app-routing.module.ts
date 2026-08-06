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
      },
      {
        path: 'mensajes',
        loadChildren: () =>
          import('./features/messages/messages.module').then(m => m.MessagesModule)
      },
      {
        path: 'consultorios',
        loadChildren: () =>
          import('./features/consultorios/consultorios.module').then(m => m.ConsultoriosModule)
      },
      {
        path: 'odontologos',
        loadChildren: () =>
          import('./features/odontologos/odontologos.module').then(m => m.OdontologosModule)
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.module').then(m => m.UsuariosModule)
      },
      {
        path: 'configuracion',
        loadChildren: () =>
          import('./features/configuracion/configuracion.module').then(m => m.ConfiguracionModule)
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
