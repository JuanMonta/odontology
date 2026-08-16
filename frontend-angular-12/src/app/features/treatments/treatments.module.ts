import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreatmentsRoutingModule } from './treatments-routing.module';
import { PaginationModule } from '../../shared/components/pagination/pagination.module';
import { TreatmentsPageComponent } from './pages/treatments-page/treatments-page.component';
import { TreatmentDirectoryComponent } from './components/treatment-directory/treatment-directory.component';
import { TreatmentFormComponent } from './components/treatment-form/treatment-form.component';
import { TreatmentPanelComponent } from './components/treatment-panel/treatment-panel.component';

@NgModule({
  declarations: [
    TreatmentsPageComponent,
    TreatmentDirectoryComponent,
    TreatmentFormComponent,
    TreatmentPanelComponent
  ],
  imports: [CommonModule, FormsModule, TreatmentsRoutingModule, PaginationModule],
  exports: [TreatmentsPageComponent]
})
export class TreatmentsModule { }
