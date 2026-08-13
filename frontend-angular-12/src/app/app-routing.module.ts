import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },
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
        path: 'chat',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./features/chat/chat.module').then(m => m.ChatModule)
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
        path: 'turnos',
        loadChildren: () =>
          import('./features/turnos/turnos.module').then(m => m.TurnosModule)
      },
      {
        path: 'especialidades',
        loadChildren: () =>
          import('./features/especialidades/especialidades.module').then(m => m.EspecialidadesModule)
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
