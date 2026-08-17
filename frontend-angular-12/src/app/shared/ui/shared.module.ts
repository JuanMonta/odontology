import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from './ui-button/ui-button.component';
import { UiLampComponent } from './ui-lamp/ui-lamp.component';
import { UiStatComponent } from './ui-stat/ui-stat.component';
import { UiEmptyComponent } from './ui-empty/ui-empty.component';
import { UiChipComponent } from './ui-chip/ui-chip.component';
import { UiPanelComponent } from './ui-panel/ui-panel.component';
import { UiFieldComponent } from './ui-field/ui-field.component';

@NgModule({
  declarations: [
    UiButtonComponent,
    UiLampComponent,
    UiStatComponent,
    UiEmptyComponent,
    UiChipComponent,
    UiPanelComponent,
    UiFieldComponent
  ],
  imports: [CommonModule],
  exports: [
    UiButtonComponent,
    UiLampComponent,
    UiStatComponent,
    UiEmptyComponent,
    UiChipComponent,
    UiPanelComponent,
    UiFieldComponent
  ]
})
export class SharedModule { }