import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthGuard } from './core/auth/auth.guard';
import { APP_ROUTE_SEGMENTS } from './core/config/app-routes';

const routes: Routes = [
  {
    path: APP_ROUTE_SEGMENTS.login,
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: APP_ROUTE_SEGMENTS.dashboard,
    component: MainLayoutComponent,
    children: [
      {
        path: APP_ROUTE_SEGMENTS.dashboard,
        loadChildren: () =>
          import('./features/patient-dashboard/patient-dashboard.module').then(
            m => m.PatientDashboardModule
          )
      },
      {
        path: APP_ROUTE_SEGMENTS.pacientes,
        loadChildren: () =>
          import('./features/patients/patients.module').then(m => m.PatientsModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.tratamientos,
        loadChildren: () =>
          import('./features/treatments/treatments.module').then(m => m.TreatmentsModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.mensajes,
        loadChildren: () =>
          import('./features/messages/messages.module').then(m => m.MessagesModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.chat,
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./features/chat/chat.module').then(m => m.ChatModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.consultorios,
        loadChildren: () =>
          import('./features/consultorios/consultorios.module').then(m => m.ConsultoriosModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.odontologos,
        loadChildren: () =>
          import('./features/odontologos/odontologos.module').then(m => m.OdontologosModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.usuarios,
        loadChildren: () =>
          import('./features/usuarios/usuarios.module').then(m => m.UsuariosModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.turnos,
        loadChildren: () =>
          import('./features/turnos/turnos.module').then(m => m.TurnosModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.especialidades,
        loadChildren: () =>
          import('./features/especialidades/especialidades.module').then(m => m.EspecialidadesModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.configuracion,
        loadChildren: () =>
          import('./features/configuracion/configuracion.module').then(m => m.ConfiguracionModule)
      }
    ]
  },
  { path: APP_ROUTE_SEGMENTS.wildcard, redirectTo: APP_ROUTE_SEGMENTS.dashboard }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
