import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TurnosRoutingModule } from './turnos-routing.module';
import { PaginationModule } from '../../shared/components/pagination/pagination.module';
import { TurnosPageComponent } from './pages/turnos-page/turnos-page.component';
import { TurnoDirectoryComponent } from './components/turno-directory/turno-directory.component';
import { TurnoPanelComponent } from './components/turno-panel/turno-panel.component';
import { TurnoFormComponent } from './components/turno-form/turno-form.component';

@NgModule({
  declarations: [
    TurnosPageComponent,
    TurnoDirectoryComponent,
    TurnoPanelComponent,
    TurnoFormComponent
  ],
  imports: [CommonModule, FormsModule, TurnosRoutingModule, PaginationModule],
  exports: [TurnosPageComponent]
})
export class TurnosModule { }
