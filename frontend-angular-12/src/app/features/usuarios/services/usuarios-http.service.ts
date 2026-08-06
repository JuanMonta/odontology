import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Usuario, UsuarioDraft, UsuarioRol } from '../../../core/models/usuario.model';
import { API_BASE } from '../../../core/config/api.config';

export const ROLES: UsuarioRol[] = ['administrador', 'recepción', 'odontólogo'];

/**
 * Consume el backend REST de usuarios (spring_backend → /api/v1/usuarios).
 * Mantiene el mismo contrato Observable del mock para no tocar las vistas.
 */
@Injectable({ providedIn: 'root' })
export class UsuariosHttpService {
  private readonly subjects = new BehaviorSubject<Usuario[]>([]);

  readonly usuarios$: Observable<Usuario[]> = this.subjects.asObservable();

  constructor(private readonly http: HttpClient) {
    this.refresh();
  }

  snapshot(): Usuario[] {
    return this.subjects.getValue();
  }

  refresh(): void {
    this.http.get<Usuario[]>(`${API_BASE}/usuarios`).subscribe(list => this.subjects.next(list));
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
