import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesRoutingModule } from './reportes-routing.module';
import { ReportesPageComponent } from './pages/reportes-page/reportes-page.component';

@NgModule({
  declarations: [ReportesPageComponent],
  imports: [CommonModule, ReportesRoutingModule],
  exports: [ReportesPageComponent]
})
export class ReportesModule {}