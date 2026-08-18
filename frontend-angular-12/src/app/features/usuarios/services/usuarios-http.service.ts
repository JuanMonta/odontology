import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { CatalogoItem, RolItem, Usuario, UsuarioDraft } from '../../../core/models/usuario.model';
import { API_BASE } from '../../../core/config/api.config';
import { BackendStatusService } from '../../../core/services/backend-status.service';

/**
 * Consume el backend REST de usuarios (spring_backend → /api/v1/usuarios).
 * Rol y estado viven en los catálogos usuario_roles / usuario_estados;
 * el administrador puede crear, renombrar y desactivar roles desde
 * CONFIGURACIÓN (rolesTodos$), mientras el form de usuarios solo consume
 * los activos (roles$).
 */
@Injectable({ providedIn: 'root' })
export class UsuariosHttpService {
  private readonly subjects = new BehaviorSubject<Usuario[]>([]);
  private readonly rolesSub = new BehaviorSubject<CatalogoItem[]>([]);
  private readonly rolesTodosSub = new BehaviorSubject<RolItem[]>([]);
  private readonly estadosSub = new BehaviorSubject<CatalogoItem[]>([]);

  readonly usuarios$: Observable<Usuario[]> = this.subjects.asObservable();
  readonly roles$: Observable<CatalogoItem[]> = this.rolesSub.asObservable();
  readonly rolesTodos$: Observable<RolItem[]> = this.rolesTodosSub.asObservable();
  readonly estados$: Observable<CatalogoItem[]> = this.estadosSub.asObservable();

  constructor(private readonly http: HttpClient, status: BackendStatusService) {
    this.refresh();
    this.refreshRoles();
    this.refreshRolesTodos();
    this.refreshEstados();
    status.reconnected$.subscribe(() => {
      this.refresh();
      this.refreshRoles();
      this.refreshRolesTodos();
      this.refreshEstados();
    });
    status.onlineTick$
      .pipe(filter(() => this.subjects.getValue().length === 0))
      .subscribe(() => this.refresh());
  }

  snapshot(): Usuario[] {
    return this.subjects.getValue();
  }

  refresh(): void {
    this.http.get<Usuario[]>(`${API_BASE}/usuarios`).subscribe(list => this.subjects.next(list));
  }

  refreshRoles(): void {
    this.http.get<CatalogoItem[]>(`${API_BASE}/usuarios/roles`).subscribe(list => this.rolesSub.next(list));
  }

  refreshRolesTodos(): void {
    this.http.get<RolItem[]>(`${API_BASE}/usuarios/roles/todos`).subscribe(list => this.rolesTodosSub.next(list));
  }

  refreshEstados(): void {
    this.http.get<CatalogoItem[]>(`${API_BASE}/usuarios/estados`).subscribe(list => this.estadosSub.next(list));
  }

  crearRol(nombre: string): Observable<RolItem> {
    return this.http.post<RolItem>(`${API_BASE}/usuarios/roles`, { nombre }).pipe(
      tap(rol => {
        this.rolesSub.next([...this.rolesSub.getValue(), { codigo: rol.code, nombre: rol.nombre }]
          .sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.rolesTodosSub.next([...this.rolesTodosSub.getValue(), rol]
          .sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
    );
  }

  updateRol(item: RolItem): Observable<RolItem> {
    return this.http.put<RolItem>(`${API_BASE}/usuarios/roles/${item.code}`, item).pipe(
      tap(updated => {
        this.rolesTodosSub.next(this.rolesTodosSub.getValue().map(r => (r.code === updated.code ? updated : r)));
        this.refreshRoles();
      })
    );
  }

  toggleRolStatus(code: string): Observable<RolItem> {
    return this.http.patch<RolItem>(`${API_BASE}/usuarios/roles/${code}/toggle-status`, {}).pipe(
      tap(updated => {
        this.rolesTodosSub.next(this.rolesTodosSub.getValue().map(r => (r.code === updated.code ? updated : r)));
        this.refreshRoles();
      })
    );
  }

  crearEstado(nombre: string): Observable<CatalogoItem> {
    return this.http.post<CatalogoItem>(`${API_BASE}/usuarios/estados`, { nombre }).pipe(
      tap(estado => {
        this.estadosSub.next([...this.estadosSub.getValue(), estado].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
    );
  }

  addUsuario(draft: UsuarioDraft): Observable<Usuario> {
    return this.http.post<Usuario>(`${API_BASE}/usuarios`, draft).pipe(
      tap(created => this.subjects.next([created, ...this.subjects.getValue()]))
    );
  }

  updateUsuario(item: Usuario): void {
    this.http.put<Usuario>(`${API_BASE}/usuarios/${item.code}`, item).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(u => (u.id === updated.id ? updated : u)));
    });
  }

  toggleStatus(id: string): void {
    this.http.patch<Usuario>(`${API_BASE}/usuarios/${id}/toggle-status`, null).subscribe(updated => {
      this.subjects.next(this.subjects.getValue().map(u => (u.id === updated.id ? updated : u)));
    });
  }
}
