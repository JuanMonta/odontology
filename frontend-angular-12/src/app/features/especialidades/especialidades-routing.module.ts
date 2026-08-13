import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EspecialidadesPageComponent } from './pages/especialidades-page/especialidades-page.component';

const routes: Routes = [
  { path: '', component: EspecialidadesPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EspecialidadesRoutingModule { }
