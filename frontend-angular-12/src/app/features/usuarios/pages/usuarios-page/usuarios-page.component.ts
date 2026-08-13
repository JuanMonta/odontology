import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CatalogoItem,
  Usuario,
  UsuarioDraft,
  UsuarioStatus
} from '../../../../core/models/usuario.model';
import { UsuariosHttpService } from '../../services/usuarios-http.service';
import { AuthStore } from '../../../../core/auth/auth.store';

type StatusFilter = UsuarioStatus | 'all';

@Component({
  selector: 'app-usuarios-page',
  templateUrl: './usuarios-page.component.html',
  styleUrls: ['./usuarios-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosPageComponent implements OnInit {
  usuarios$: Observable<Usuario[]>;
  selected$: Observable<Usuario | null>;
  roles$: Observable<CatalogoItem[]>;
  estados$: Observable<CatalogoItem[]>;
  esAdmin$: Observable<boolean>;

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<StatusFilter>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);

  constructor(
    private service: UsuariosHttpService,
    private auth: AuthStore,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.usuarios$ = combineLatest([this.service.usuarios$, this.search$, this.status$]).pipe(
      map(([list, q, filter]) => {
        const query = q.trim().toUpperCase();
        return list.filter(u => {
          const matchesStatus = filter === 'all' || u.status === filter;
          const matchesQuery =
            !query ||
            u.username.toUpperCase().includes(query) ||
            u.code.includes(query) ||
            u.name.toUpperCase().includes(query) ||
            u.role.toUpperCase().includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([this.service.usuarios$, this.selectedId$]).pipe(
      map(([list, id]) => (id ? list.find(u => u.id === id) ?? null : null))
    );
    this.roles$ = this.service.roles$;
    this.estados$ = this.service.estados$;
    this.esAdmin$ = this.auth.esAdmin();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('nuevo')) {
        this.startCreate();
      }
    });
  }

  onSearch(q: string): void {
    this.search$.next(q);
  }

  onFilter(f: StatusFilter): void {
    this.status$.next(f);
  }

  onSelect(usuario: Usuario): void {
    this.selectedId = usuario.id;
    this.selectedId$.next(usuario.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onSaved(draft: UsuarioDraft): void {
    if (this.selectedId) {
      const current = this.service.snapshot().find(u => u.id === this.selectedId);
      if (current) {
        this.service.updateUsuario({ ...current, ...draft });
      }
    } else {
      this.service.addUsuario(draft).subscribe(created => {
        this.selectedId = created.id;
        this.selectedId$.next(created.id);
      });
    }
    this.creating = false;
    this.router.navigate([], { queryParams: {} });
  }

  cancelCreate(): void {
    this.creating = false;
  }

  onClosePanel(): void {
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onToggleStatus(id: string): void {
    this.service.toggleStatus(id);
  }

  onCrearRol(nombre: string): void {
    this.service.crearRol(nombre).subscribe();
  }

  onCrearEstado(nombre: string): void {
    this.service.crearEstado(nombre).subscribe();
  }
}
