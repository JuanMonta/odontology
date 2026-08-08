import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { BackendStatusComponent } from './components/backend-status/backend-status.component';

@NgModule({
  declarations: [MainLayoutComponent, BackendStatusComponent],
  imports: [CommonModule, RouterModule],
  exports: [MainLayoutComponent, BackendStatusComponent]
})
export class MainLayoutModule { }
