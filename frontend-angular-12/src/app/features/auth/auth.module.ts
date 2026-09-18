import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthRoutingModule } from './auth-routing.module';
import { SharedModule } from '../../shared/ui/shared.module';
import { LoginPageComponent } from './login-page/login-page.component';

@NgModule({
  declarations: [LoginPageComponent],
  imports: [CommonModule, FormsModule, RouterModule, AuthRoutingModule, SharedModule]
})
export class AuthModule {}
