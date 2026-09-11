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
    return !!this.token && !!this.user$.getValue();
  }

  usuario$(): Observable<Usuario | null> {
    return this.user$.asObservable();
  }

  esAdmin(): Observable<boolean> {
    return this.user$.pipe(map(u => !!u && u.role === 'administrador'));
  }

  /** Permisos RBAC del JWT (claim `perms`, separado por espacios). */
  permisos(): string[] {
    const token = this.token;
    if (!token) {
      return [];
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const raw = String(payload.perms || '').trim();
      return raw ? raw.split(/\s+/) : [];
    } catch {
      return [];
    }
  }

  tienePermiso(permiso: string): boolean {
    const perms = this.permisos();
    return perms.includes('SUPER_ADMIN') || perms.includes(permiso);
  }

  tienePermiso$(permiso: string): Observable<boolean> {
    return this.user$.pipe(map(() => this.tienePermiso(permiso)));
  }

  esSuperAdmin(): boolean {
    return this.permisos().includes('SUPER_ADMIN');
  }

  async login(username: string, password: string): Promise<void> {
    const res = await this.authApi.login(username, password).toPromise();
    localStorage.setItem(TOKEN_KEY, res.token);
    this.token$.next(res.token);
    // Enriquece con la ficha vinculada (odontologoCodigo) vía /me.
    try {
      const me = await this.authApi.me().toPromise();
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          code: me?.code ?? res.code,
          username: me?.username ?? res.username,
          name: me?.name ?? res.name,
          role: me?.role ?? res.role,
          odontologoCodigo: me?.odontologoCodigo ?? null
        })
      );
    } catch {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          code: res.code,
          username: res.username,
          name: res.name,
          role: res.role,
          odontologoCodigo: null
        })
      );
    }
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
        phone: '',
        odontologoCodigo: parsed.odontologoCodigo ?? null
      };
    } catch {
      return null;
    }
  }
}
