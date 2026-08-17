import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultoriosRoutingModule } from './consultorios-routing.module';
import { PaginationModule } from '../../shared/components/pagination/pagination.module';
import { SharedModule } from '../../shared/ui/shared.module';
import { ConsultoriosPageComponent } from './pages/consultorios-page/consultorios-page.component';
import { ConsultorioDirectoryComponent } from './components/consultorio-directory/consultorio-directory.component';
import { ConsultorioPanelComponent } from './components/consultorio-panel/consultorio-panel.component';
import { ConsultorioFormComponent } from './components/consultorio-form/consultorio-form.component';

@NgModule({
  declarations: [
    ConsultoriosPageComponent,
    ConsultorioDirectoryComponent,
    ConsultorioPanelComponent,
    ConsultorioFormComponent
  ],
  imports: [CommonModule, FormsModule, ConsultoriosRoutingModule, PaginationModule, SharedModule],
  exports: [ConsultoriosPageComponent]
})
export class ConsultoriosModule { }
