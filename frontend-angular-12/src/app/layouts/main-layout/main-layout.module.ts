import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { SharedModule } from '../../shared/ui/shared.module';

@NgModule({
  declarations: [MainLayoutComponent],
  // BackendStatusComponent vive en SharedModule (compartido con el login);
  // sin importarlo aqui, <app-backend-status> del layout no resolveria.
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [MainLayoutComponent]
})
export class MainLayoutModule { }
