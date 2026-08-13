import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TurnosPageComponent } from './pages/turnos-page/turnos-page.component';

const routes: Routes = [
  { path: '', component: TurnosPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnosRoutingModule { }
