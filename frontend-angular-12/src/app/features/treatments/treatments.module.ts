import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreatmentsRoutingModule } from './treatments-routing.module';
import { TreatmentsPageComponent } from './pages/treatments-page/treatments-page.component';
import { TreatmentDirectoryComponent } from './components/treatment-directory/treatment-directory.component';
import { TreatmentFormComponent } from './components/treatment-form/treatment-form.component';

@NgModule({
  declarations: [
    TreatmentsPageComponent,
    TreatmentDirectoryComponent,
    TreatmentFormComponent
  ],
  imports: [CommonModule, FormsModule, TreatmentsRoutingModule],
  exports: [TreatmentsPageComponent]
})
export class TreatmentsModule { }
