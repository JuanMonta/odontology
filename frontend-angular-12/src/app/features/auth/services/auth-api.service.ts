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
}
