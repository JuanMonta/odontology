import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OdontologosRoutingModule } from './odontologos-routing.module';
import { PaginationModule } from '../../shared/components/pagination/pagination.module';
import { OdontologosPageComponent } from './pages/odontologos-page/odontologos-page.component';
import { OdontologoDirectoryComponent } from './components/odontologo-directory/odontologo-directory.component';
import { OdontologoPanelComponent } from './components/odontologo-panel/odontologo-panel.component';
import { OdontologoFormComponent } from './components/odontologo-form/odontologo-form.component';

@NgModule({
  declarations: [
    OdontologosPageComponent,
    OdontologoDirectoryComponent,
    OdontologoPanelComponent,
    OdontologoFormComponent
  ],
  imports: [CommonModule, FormsModule, OdontologosRoutingModule, PaginationModule],
  exports: [OdontologosPageComponent]
})
export class OdontologosModule { }
