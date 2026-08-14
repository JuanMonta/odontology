import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Usuario, UsuarioRol } from '../models/usuario.model';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { borradorKey, limpiarDatosDeSesion } from './session-local-storage';

const TOKEN_KEY = 'sas_odonto_jwt';
const USER_KEY = 'sas_odonto_usuario';

/**
 * Fuente única de la sesión activa. El token viaja en localStorage y en cada
 * petición vía {@link JwtInterceptor}; al desloguear se limpia todo y la app
 * vuelve al muelle de login.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly token$ = new BehaviorSubject<string | null>(this.readToken());
  private readonly user$ = new BehaviorSubject<Usuario | null>(this.readUser());

  constructor(private readonly authApi: AuthApiService) {}

  get usuario(): Usuario | null {
    return this.user$.getValue();
  }

  get token(): string | null {
    return this.token$.getValue();
  }

  isLoggedIn(): boolean {
    return !!this.token && !!this.user$;
  }

  usuario$(): Observable<Usuario | null> {
    return this.user$.asObservable();
  }

  esAdmin(): Observable<boolean> {
    return this.user$.pipe(map(u => !!u && u.role === 'administrador'));
  }

  async login(username: string, password: string): Promise<void> {
    const res = await this.authApi.login(username, password).toPromise();
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        code: res.code,
        username: res.username,
        name: res.name,
        role: res.role
      })
    );
    this.token$.next(res.token);
    this.user$.next(this.readUser());
  }

  logout(): void {
    limpiarDatosDeSesion();
    this.token$.next(null);
    this.user$.next(null);
  }

  refrescar(usuario: Usuario): void {
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    this.user$.next(usuario);
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        id: parsed.id ?? parsed.code ?? '',
        code: parsed.code ?? '',
        username: parsed.username ?? '',
        name: parsed.name ?? '',
        role: parsed.role as UsuarioRol,
        status: 'activo',
        lastAccess: '',
        phone: ''
      };
    } catch {
      return null;
    }
  }
}
