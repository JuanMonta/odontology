import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Permiso, RolItem } from '../../../../core/models/usuario.model';
import { UsuariosHttpService } from '../../../usuarios/services/usuarios-http.service';

@Component({
  selector: 'app-configuracion-roles',
  templateUrl: './configuracion-roles.component.html',
  styleUrls: ['./configuracion-roles.component.css', '../../../../shared/styles/cat-inline.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionRolesComponent implements OnInit {
  roles$: Observable<RolItem[]>;

  creandoRol = false;
  nuevoRol = '';
  crearError = '';

  /** Segundo paso de eliminación (acción destructiva después de pedirla). */
  confirmarEliminarCode = '';
  eliminandoRol = false;
  eliminarError = '';

  /** Código del rol desplegado (acordeón: un item abierto a la vez). */
  expandidoCode = '';
  /** true = edición habilitada; false = solo observación (toggles bloqueados). */
  editando = false;
  editarNombre = '';
  editarActivo = true;
  editarError = '';

  catalogoPermisos: Permiso[] = [];
  categoriasPermisos: string[] = [];
  permisosSel = new Set<string>();
  cargandoPermisos = false;
  guardandoPermisos = false;
  permsError = '';
  permsOk = false;

  constructor(
    private readonly service: UsuariosHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.roles$ = service.rolesTodos$;
  }

  private rolesSnapshot: RolItem[] = [];

  ngOnInit(): void {
    this.service.refreshRolesTodos();
    this.service.rolesTodos$.subscribe(list => {
      this.rolesSnapshot = list || [];
      this.cdr.markForCheck();
    });
    this.service.listarPermisos().subscribe({
      next: list => {
        this.catalogoPermisos = list || [];
        this.categoriasPermisos = [...new Set(this.catalogoPermisos.map(p => p.categoria))];
        this.cdr.markForCheck();
      },
      error: () => {
        this.catalogoPermisos = [];
        this.categoriasPermisos = [];
        this.cdr.markForCheck();
      }
    });
  }

  permisosDe(cat: string): Permiso[] {
    return this.catalogoPermisos.filter(p => p.categoria === cat);
  }

  tienePermisoSel(codigo: string): boolean {
    return this.permisosSel.has(codigo);
  }

  esToggleBloqueado(p: Permiso): boolean {
    if (!this.editando) {
      return true;
    }
    const rol = this.rolExpandido();
    return !!rol?.sistema && p.codigo === 'SUPER_ADMIN';
  }

  rolExpandido(): RolItem | null {
    return this.rolesSnapshot.find(r => r.code === this.expandidoCode) || null;
  }

  estaExpandido(rol: RolItem): boolean {
    return this.expandidoCode === rol.code;
  }

  togglePermiso(p: Permiso): void {
    if (this.esToggleBloqueado(p) || this.guardandoPermisos) {
      return;
    }
    if (this.permisosSel.has(p.codigo)) {
      this.permisosSel.delete(p.codigo);
    } else {
      this.permisosSel.add(p.codigo);
    }
    this.permsOk = false;
    this.permsError = '';
    this.cdr.markForCheck();
  }

  guardarPermisos(): void {
    if (!this.expandidoCode || this.guardandoPermisos) {
      return;
    }
    this.guardandoPermisos = true;
    this.permsError = '';
    this.service.guardarRolPermisos(this.expandidoCode, [...this.permisosSel]).subscribe({
      next: res => {
        this.permisosSel = new Set(res.permisos || []);
        this.guardandoPermisos = false;
        this.permsOk = true;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        const body = err as { error?: { message?: string }; message?: string };
        this.permsError = body?.error?.message || 'NO SE PUDO GUARDAR LA MATRIZ';
        this.guardandoPermisos = false;
        this.cdr.markForCheck();
      }
    });
  }

  trackRol(_: number, r: RolItem): string {
    return r.code;
  }

  toggleCrearRol(): void {
    this.creandoRol = !this.creandoRol;
    if (this.creandoRol) {
      this.contraer();
      this.crearError = '';
    }
    this.cdr.markForCheck();
  }

  onCrearRol(): void {
    const nombre = this.nuevoRol.trim().toLowerCase();
    if (!nombre) {
      this.crearError = 'EL NOMBRE DEL ROL ES OBLIGATORIO';
      this.cdr.markForCheck();
      return;
    }
    this.crearError = '';
    this.service.crearRol(nombre).subscribe({
      next: () => {
        this.creandoRol = false;
        this.nuevoRol = '';
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        const body = err as { error?: { message?: string } };
        this.crearError = body?.error?.message || 'NO SE PUDO CREAR EL ROL';
        this.cdr.markForCheck();
      }
    });
  }

  /** Click en la fila: observar permisos en solo lectura. */
  onVerRol(rol: RolItem): void {
    if (this.expandidoCode === rol.code) {
      this.contraer();
      return;
    }
    this.creandoRol = false;
    this.crearError = '';
    this.expandidoCode = rol.code;
    this.editando = false;
    this.editarNombre = rol.nombre;
    this.editarActivo = rol.activo;
    this.editarError = '';
    this.permsError = '';
    this.permsOk = false;
    this.permisosSel = new Set();
    this.cargarMatriz(rol.code);
    this.cdr.markForCheck();
  }

  /** Botón EDITAR: entra a edición; si ya edita, vuelve a solo observar. */
  onEditarRol(rol: RolItem): void {
    if (this.expandidoCode !== rol.code) {
      this.onVerRol(rol);
    }
    this.editando = !this.editando;
    if (this.editando) {
      const actual = this.rolExpandido();
      if (actual) {
        this.editarNombre = actual.nombre;
        this.editarActivo = actual.activo;
      }
      this.editarError = '';
      this.permsError = '';
      this.permsOk = false;
    }
    this.cdr.markForCheck();
  }

  private cargarMatriz(code: string): void {
    this.cargandoPermisos = true;
    this.cdr.markForCheck();
    this.service.rolPermisos(code).subscribe({
      next: res => {
        this.permisosSel = new Set(res.permisos || []);
        this.cargandoPermisos = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.permisosSel = new Set();
        this.cargandoPermisos = false;
        this.permsError = 'NO SE PUDO CARGAR LA MATRIZ DE PERMISOS';
        this.cdr.markForCheck();
      }
    });
  }

  guardarRol(): void {
    if (this.rolExpandido()?.sistema) {
      this.editarError = 'ROL PROTEGIDO POR SISTEMA: NO SE PUEDE RENOMBRAR NI DESACTIVAR';
      this.cdr.markForCheck();
      return;
    }
    const nombre = this.editarNombre.trim().toLowerCase();
    if (!nombre) {
      this.editarError = 'EL NOMBRE DEL ROL ES OBLIGATORIO';
      this.cdr.markForCheck();
      return;
    }
    this.editarError = '';
    this.service.updateRol({
      id: this.expandidoCode,
      code: this.expandidoCode,
      nombre,
      activo: this.editarActivo
    }).subscribe({
      next: () => {
        this.editando = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        const body = err as { error?: { message?: string } };
        this.editarError = body?.error?.message || 'NO SE PUDO ACTUALIZAR EL ROL';
        this.cdr.markForCheck();
      }
    });
  }

  contraer(): void {
    this.expandidoCode = '';
    this.editando = false;
    this.editarError = '';
    this.permisosSel = new Set();
    this.permsError = '';
    this.permsOk = false;
    this.confirmarEliminarCode = '';
    this.eliminarError = '';
    this.cdr.markForCheck();
  }

  pedirEliminar(rol: RolItem): void {
    if (rol.sistema) {
      return;
    }
    this.confirmarEliminarCode = rol.code;
    this.eliminarError = '';
    this.cdr.markForCheck();
  }

  cancelarEliminar(): void {
    this.confirmarEliminarCode = '';
    this.eliminarError = '';
    this.cdr.markForCheck();
  }

  confirmarEliminar(rol: RolItem): void {
    if (this.eliminandoRol || rol.sistema) {
      return;
    }
    this.eliminandoRol = true;
    this.eliminarError = '';
    this.service.eliminarRol(rol.code).subscribe({
      next: () => {
        this.eliminandoRol = false;
        this.confirmarEliminarCode = '';
        if (this.expandidoCode === rol.code) {
          this.contraer();
        }
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        const body = err as { error?: { message?: string }; message?: string };
        this.eliminarError = body?.error?.message || 'NO SE PUDO ELIMINAR EL ROL';
        this.eliminandoRol = false;
        this.cdr.markForCheck();
      }
    });
  }
}
