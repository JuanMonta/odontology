import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultoriosPageComponent } from './pages/consultorios-page/consultorios-page.component';

const routes: Routes = [
  { path: '', component: ConsultoriosPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsultoriosRoutingModule { }
