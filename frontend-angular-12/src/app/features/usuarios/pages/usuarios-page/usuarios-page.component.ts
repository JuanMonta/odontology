import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
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
export class UsuariosPageComponent implements OnInit, OnDestroy {
  usuarios$: Observable<Usuario[]>;
  selected$: Observable<Usuario | null>;
  roles$: Observable<CatalogoItem[]>;
  estados$: Observable<CatalogoItem[]>;
  esAdmin$: Observable<boolean>;

  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<StatusFilter>('all');
  readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly destroy$ = new Subject<void>();

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
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params.get('nuevo')) {
        this.startCreate();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(ev: Event): void {
    this.search$.next((ev.target as HTMLInputElement).value);
  }

  onFilter(ev: Event): void {
    this.status$.next((ev.target as HTMLSelectElement).value as StatusFilter);
  }

  onSelect(usuario: Usuario): void {
    this.selectedId$.next(usuario.id);
    this.creating = false;
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId$.next(null);
  }

  onSaved(draft: UsuarioDraft): void {
    const selectedId = this.selectedId$.getValue();
    if (selectedId) {
      const current = this.service.snapshot().find(u => u.id === selectedId);
      if (current) {
        this.service.updateUsuario({ ...current, ...draft });
      }
    } else {
      this.service.addUsuario(draft).subscribe(created => {
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
