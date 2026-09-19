import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { Usuario } from '../../../core/models/usuario.model';

export interface AuthLoginResponse {
  token: string;
  code: string;
  username: string;
  name: string;
  role: string;
}

/**
 * Autenticación contra el backend (spring_backend → /api/v1/auth). El login
 * devuelve el JWT de sesión; /me refresca la identidad desde el servidor.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${API_BASE}/auth/login`, { username, password });
  }

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${API_BASE}/auth/me`);
  }

  /** Cierra la sesión activa en el servidor (el JWT deja de ser válido). */
  logout(): Observable<void> {
    return this.http.post<void>(`${API_BASE}/auth/logout`, {});
  }

  /** Canje self-service del código de un solo uso por una clave nueva. */
  reestablecerClave(username: string, codigo: string, nuevaClave: string): Observable<void> {
    return this.http.post<void>(
      `${API_BASE}/auth/reestablecer-clave`, { username, codigo, nuevaClave });
  }

  /** Cambio de clave verificando la actual (cambio forzado / voluntario). */
  cambiarClave(username: string, claveActual: string, nuevaClave: string): Observable<void> {
    return this.http.post<void>(
      `${API_BASE}/auth/cambiar-clave`, { username, claveActual, nuevaClave });
  }
}
