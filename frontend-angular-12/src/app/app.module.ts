import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainLayoutModule } from './layouts/main-layout/main-layout.module';
import { JwtInterceptor } from './core/auth/jwt.interceptor';
import { AuthErrorInterceptor } from './core/auth/auth-error.interceptor';
import { ReauthModalComponent } from './core/auth/reauth-modal/reauth-modal.component';
import { ServerDiscoveryService } from './core/services/server-discovery.service';

@NgModule({
  declarations: [
    AppComponent,
    ReauthModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    MainLayoutModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true },
    // Resuelve la base del backend ANTES de arrancar la app: sin esto los
    // servicios usarian el puerto por defecto (8000) en vez del de la matriz.
    {
      provide: APP_INITIALIZER,
      useFactory: (descubrimiento: ServerDiscoveryService) => () => descubrimiento.inicializar(),
      deps: [ServerDiscoveryService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
