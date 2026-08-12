import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthStore } from './auth.store';

/**
 * Adjunta el JWT de la sesión a cada petición hacia el backend. Sin token la
 * petición sale igual: los endpoints protegidos responderán 401 y la UI decide.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private readonly auth: AuthStore) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.token;
    if (token && req.url.startsWith('http://localhost:8000')) {
      return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }
    return next.handle(req);
  }
}
