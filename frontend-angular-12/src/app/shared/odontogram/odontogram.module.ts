import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { OdontogramComponent } from './odontogram.component';
import { OdontogramIconsService } from './odontogram-icons.service';

@NgModule({
  declarations: [OdontogramComponent],
  imports: [CommonModule, HttpClientModule],
  providers: [OdontogramIconsService],
  exports: [OdontogramComponent]
})
export class OdontogramModule {}
