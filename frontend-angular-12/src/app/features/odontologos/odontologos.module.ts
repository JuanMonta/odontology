import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OdontologosRoutingModule } from './odontologos-routing.module';
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
  imports: [CommonModule, FormsModule, OdontologosRoutingModule],
  exports: [OdontologosPageComponent]
})
export class OdontologosModule { }
