import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OdontologosPageComponent } from './pages/odontologos-page/odontologos-page.component';

const routes: Routes = [
  { path: '', component: OdontologosPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OdontologosRoutingModule { }
