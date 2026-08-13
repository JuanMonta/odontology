import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspecialidadesRoutingModule } from './especialidades-routing.module';
import { EspecialidadesPageComponent } from './pages/especialidades-page/especialidades-page.component';
import { EspecialidadDirectoryComponent } from './components/especialidad-directory/especialidad-directory.component';
import { EspecialidadPanelComponent } from './components/especialidad-panel/especialidad-panel.component';
import { EspecialidadFormComponent } from './components/especialidad-form/especialidad-form.component';

@NgModule({
  declarations: [
    EspecialidadesPageComponent,
    EspecialidadDirectoryComponent,
    EspecialidadPanelComponent,
    EspecialidadFormComponent
  ],
  imports: [CommonModule, FormsModule, EspecialidadesRoutingModule],
  exports: [EspecialidadesPageComponent]
})
export class EspecialidadesModule { }
