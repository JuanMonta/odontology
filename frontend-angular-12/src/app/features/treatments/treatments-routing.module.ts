import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TreatmentsPageComponent } from './pages/treatments-page/treatments-page.component';

const routes: Routes = [
  { path: '', component: TreatmentsPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TreatmentsRoutingModule { }
