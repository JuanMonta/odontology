import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthStore } from './auth.store';
import { getApiBase } from '../config/api.config';

/**
 * Adjunta el JWT de la sesión a cada petición hacia el backend. Sin token la
 * petición sale igual: los endpoints protegidos responderán 401 y la UI decide.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private readonly auth: AuthStore) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.token;
    if (token && this.esDelBackend(req.url)) {
      return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }
    return next.handle(req);
  }

  /**
   * El puerto real lo decide el descubrimiento en runtime (matriz 8001-8010 y
   * 8100-8900), asi que no puede fijarse un host concreto: se compara contra la
   * base resuelta y contra el prefijo `/api/v1` que comparten los endpoints.
   * `auth/login` queda fuera porque no exige JWT y un token caducado no debe
   * estorbar el inicio de sesión.
   */
  private esDelBackend(url: string): boolean {
    if (url.includes('/auth/login')) {
      return false;
    }
    return url.startsWith(getApiBase()) || url.includes('/api/v1');
  }
}
