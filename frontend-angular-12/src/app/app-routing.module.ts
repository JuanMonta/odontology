import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthGuard } from './core/auth/auth.guard';
import { PermisoGuard } from './core/auth/permiso.guard';
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
        canActivate: [PermisoGuard],
        data: { permiso: 'AGENDA_VER' },
        loadChildren: () =>
          import('./features/patient-dashboard/patient-dashboard.module').then(
            m => m.PatientDashboardModule
          )
      },
      {
        path: APP_ROUTE_SEGMENTS.pacientes,
        canActivate: [PermisoGuard],
        data: { permiso: 'PAC_VER' },
        loadChildren: () =>
          import('./features/patients/patients.module').then(m => m.PatientsModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.tratamientos,
        canActivate: [PermisoGuard],
        data: { permiso: 'TRA_VER' },
        loadChildren: () =>
          import('./features/treatments/treatments.module').then(m => m.TreatmentsModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.mensajes,
        canActivate: [PermisoGuard],
        data: { permiso: 'MSG_VER' },
        loadChildren: () =>
          import('./features/messages/messages.module').then(m => m.MessagesModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.chat,
        canActivate: [AuthGuard, PermisoGuard],
        data: { permiso: 'CHAT_VER' },
        loadChildren: () =>
          import('./features/chat/chat.module').then(m => m.ChatModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.consultorios,
        canActivate: [PermisoGuard],
        data: { permiso: 'CON_VER' },
        loadChildren: () =>
          import('./features/consultorios/consultorios.module').then(m => m.ConsultoriosModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.odontologos,
        canActivate: [PermisoGuard],
        data: { permiso: 'ODO_VER' },
        loadChildren: () =>
          import('./features/odontologos/odontologos.module').then(m => m.OdontologosModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.usuarios,
        canActivate: [PermisoGuard],
        data: { permiso: 'USU_VER' },
        loadChildren: () =>
          import('./features/usuarios/usuarios.module').then(m => m.UsuariosModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.turnos,
        canActivate: [PermisoGuard],
        data: { permiso: 'TUR_VER' },
        loadChildren: () =>
          import('./features/turnos/turnos.module').then(m => m.TurnosModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.especialidades,
        canActivate: [PermisoGuard],
        data: { permiso: 'ESP_VER' },
        loadChildren: () =>
          import('./features/especialidades/especialidades.module').then(m => m.EspecialidadesModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.configuracion,
        canActivate: [PermisoGuard],
        data: { permiso: 'CFG_VER' },
        loadChildren: () =>
          import('./features/configuracion/configuracion.module').then(m => m.ConfiguracionModule)
      },
      {
        path: APP_ROUTE_SEGMENTS.reportes,
        canActivate: [PermisoGuard],
        data: { permiso: 'REP_VER' },
        loadChildren: () =>
          import('./features/reportes/reportes.module').then(m => m.ReportesModule)
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
