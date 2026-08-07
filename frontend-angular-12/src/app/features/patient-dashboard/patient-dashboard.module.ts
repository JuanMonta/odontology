import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientDashboardRoutingModule } from './patient-dashboard-routing.module';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { DeparturesBoardComponent } from './components/departures-board/departures-board.component';
import { FlapCellComponent } from './components/flap-cell/flap-cell.component';
import { FlapTextComponent } from './components/flap-text/flap-text.component';
import { FlapClockComponent } from './components/flap-clock/flap-clock.component';
import { WaitingPanelComponent } from './components/waiting-panel/waiting-panel.component';

@NgModule({
  declarations: [
    DashboardPageComponent,
    DeparturesBoardComponent,
    FlapCellComponent,
    FlapTextComponent,
    FlapClockComponent,
    WaitingPanelComponent
  ],
  imports: [CommonModule, FormsModule, PatientDashboardRoutingModule],
  exports: [DashboardPageComponent]
})
export class PatientDashboardModule { }
