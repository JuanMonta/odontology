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
import { UiPassChecklistComponent } from './ui-pass-checklist/ui-pass-checklist.component';
import { BackendStatusComponent } from '../components/backend-status/backend-status.component';

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
    UiCatCardComponent,
    UiPassChecklistComponent,
    // Declarado AQUI (no en MainLayoutModule) para que el login pueda mostrar el
    // estado de conexion antes de autenticarse; AuthModule ya importa SharedModule.
    BackendStatusComponent
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
    UiCatCardComponent,
    UiPassChecklistComponent,
    BackendStatusComponent
  ]
})
export class SharedModule { }