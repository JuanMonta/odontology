import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from './ui-button/ui-button.component';
import { UiLampComponent } from './ui-lamp/ui-lamp.component';
import { UiStatComponent } from './ui-stat/ui-stat.component';
import { UiEmptyComponent } from './ui-empty/ui-empty.component';
import { UiChipComponent } from './ui-chip/ui-chip.component';
import { UiPanelComponent } from './ui-panel/ui-panel.component';
import { UiFieldComponent } from './ui-field/ui-field.component';
import { UiCatActComponent } from './ui-cat-act/ui-cat-act.component';
import { UiCatCardComponent } from './ui-cat-card/ui-cat-card.component';

@NgModule({
  declarations: [
    UiButtonComponent,
    UiLampComponent,
    UiStatComponent,
    UiEmptyComponent,
    UiChipComponent,
    UiPanelComponent,
    UiFieldComponent,
    UiCatActComponent,
    UiCatCardComponent
  ],
  imports: [CommonModule],
  exports: [
    UiButtonComponent,
    UiLampComponent,
    UiStatComponent,
    UiEmptyComponent,
    UiChipComponent,
    UiPanelComponent,
    UiFieldComponent,
    UiCatActComponent,
    UiCatCardComponent
  ]
})
export class SharedModule { }