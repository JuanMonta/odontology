import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStore } from './auth.store';
import { API_BASE } from '../config/api.config';

/**
 * Si el backend responde 401 (sesión ausente, token inválido o expirado —
 * p. ej. tras reiniciar el backend con un secret rotado), cierra la sesión
 * local y vuelve al login en lugar de dejar la UI del chat rota en silencio.
 * El 403 NO se toca: ahí la sesión es válida y el servidor denegó una
 * operación concreta (renombrar/retirar miembro sin ser administrador).
 */
@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly auth: AuthStore,
    private readonly router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (
          err.status === 401 &&
          req.url.startsWith(API_BASE) &&
          !req.url.includes('/auth/login')
        ) {
          this.auth.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
}