import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Usuario,
  UsuarioDraft,
  UsuarioRol,
  UsuarioStatus
} from '../../../core/models/usuario.model';

export const ROLES: UsuarioRol[] = ['administrador', 'recepción', 'odontólogo'];

@Injectable({ providedIn: 'root' })
export class UsuariosMockService {
  private readonly subjects = new BehaviorSubject<Usuario[]>(this.build());

  readonly usuarios$: Observable<Usuario[]> = this.subjects.asObservable();

  snapshot(): Usuario[] {
    return this.subjects.getValue();
  }

  addUsuario(draft: UsuarioDraft): Usuario {
    const list = this.subjects.getValue();
    const item: Usuario = {
      ...draft,
      id: `usr-${Date.now()}`,
      code: this.nextCode(list),
      lastAccess: '—',
      phone: '—'
    };
    this.subjects.next([item, ...list]);
    return item;
  }

  updateUsuario(item: Usuario): void {
    const list = this.subjects.getValue();
    this.subjects.next(list.map(u => (u.id === item.id ? item : u)));
  }

  toggleStatus(id: string): void {
    const list = this.subjects.getValue();
    this.subjects.next(
      list.map(u => {
        if (u.id !== id) {
          return u;
        }
        const next: Record<UsuarioStatus, UsuarioStatus> = {
          activo: 'suspendido',
          suspendido: 'activo',
          inactivo: 'activo'
        };
        return { ...u, status: next[u.status] };
      })
    );
  }

  private nextCode(list: Usuario[]): string {
    const base = 'USR';
    const max = list.reduce((acc, u) => {
      const n = Number(u.code.replace(base, ''));
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return `${base}-${String(max + 1).padStart(3, '0')}`;
  }

  private build(): Usuario[] {
    return [
      {
        id: 'u1',
        code: 'USR-001',
        username: 'mrivera',
        name: 'MIGUEL RIVERA',
        role: 'administrador',
        status: 'activo',
        lastAccess: '06 AGO 2026 · 14:32',
        phone: '+51 987 654 321'
      },
      {
        id: 'u2',
        code: 'USR-002',
        username: 'atorres',
        name: 'ANA TORRES',
        role: 'odontólogo',
        status: 'activo',
        lastAccess: '06 AGO 2026 · 13:05',
        phone: '+51 976 432 108'
      },
      {
        id: 'u3',
        code: 'USR-003',
        username: 'cvega',
        name: 'CARLOS VEGA',
        role: 'odontólogo',
        status: 'activo',
        lastAccess: '05 AGO 2026 · 18:41',
        phone: '+51 965 210 774'
      },
      {
        id: 'u4',
        code: 'USR-004',
        username: 'lfernandez',
        name: 'LUCÍA FERNÁNDEZ',
        role: 'recepción',
        status: 'activo',
        lastAccess: '06 AGO 2026 · 08:12',
        phone: '+51 954 308 296'
      },
      {
        id: 'u5',
        code: 'USR-005',
        username: 'jsalas',
        name: 'JORGE SALAS',
        role: 'recepción',
        status: 'suspendido',
        lastAccess: '28 JUL 2026 · 16:20',
        phone: '+51 943 512 880'
      },
      {
        id: 'u6',
        code: 'USR-006',
        username: 'pquiroz',
        name: 'PAULA QUIROZ',
        role: 'odontólogo',
        status: 'inactivo',
        lastAccess: '15 JUN 2026 · 11:03',
        phone: '+51 932 644 501'
      }
    ];
  }
}
