import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { API_BASE } from '../config/api.config';
import { APP_ROUTES } from '../config/app-routes';
import { AuthStore } from './auth.store';
import { ReauthService } from './reauth.service';

/**
 * Ante 401 (sesión vencida o inválida) abre el prompt de reinicio de sesión en
 * lugar de navegar: la vista queda viva detrás del difuminado para no perder el
 * registro sin guardar. Si el usuario re-ingresa, la petición original se
 * re-dispara (con el token nuevo vía cadena de interceptores); si cancela, se
 * limpia la sesión y se vuelve al login.
 */
@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  private readonly promptAbierto = new Set<string>();

  constructor(
    private readonly auth: AuthStore,
    private readonly reauth: ReauthService,
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const esApi = req.url.startsWith(API_BASE);
        const esLogin = req.url.includes('/auth/login');
        const sesionActiva = this.auth.isLoggedIn();
        const enLogin = this.router.url.startsWith(APP_ROUTES.login);
        if (err.status === 401 && esApi && !esLogin && sesionActiva && !enLogin) {
          return this.relogin(req, err);
        }
        return throwError(err);
      })
    );
  }

  private relogin(req: HttpRequest<unknown>, err: HttpErrorResponse): Observable<HttpEvent<unknown>> {
    const id = req.urlWithParams;
    this.promptAbierto.add(id);
    this.reauth.iniciar();

    return this.reauth.esperarResultado().pipe(
      mergeMap(resultado => {
        this.promptAbierto.delete(id);
        if (resultado === 'ok') {
          // Re-entra por HttpClient: JwtInterceptor adjunta el token renovado.
          return this.http.request(req.method, req.url, {
            body: req.body,
            params: req.params,
            headers: req.headers,
            responseType: req.responseType as 'json' | 'text' | 'arraybuffer' | 'blob'
          });
        }
        this.auth.logout();
        // Recarga completa: descarta cachés de singleton y cierra el WebSocket.
        window.location.assign(APP_ROUTES.login);
        return throwError(err);
      })
    );
  }
}