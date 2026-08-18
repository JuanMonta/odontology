import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { RolItem } from '../../../../core/models/usuario.model';
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

  editandoCode = '';
  editarNombre = '';
  editarActivo = true;
  editarError = '';

  constructor(
    private readonly service: UsuariosHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.roles$ = service.rolesTodos$;
  }

  ngOnInit(): void {
    this.service.refreshRolesTodos();
  }

  trackRol(_: number, r: RolItem): string {
    return r.code;
  }

  toggleCrearRol(): void {
    this.creandoRol = !this.creandoRol;
    if (this.creandoRol) {
      this.editandoCode = '';
      this.editarError = '';
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

  onEditarRol(rol: RolItem): void {
    if (this.editandoCode === rol.code) {
      this.cancelarEdicion();
      return;
    }
    this.creandoRol = false;
    this.crearError = '';
    this.editandoCode = rol.code;
    this.editarNombre = rol.nombre;
    this.editarActivo = rol.activo;
    this.editarError = '';
    this.cdr.markForCheck();
  }

  guardarRol(): void {
    const nombre = this.editarNombre.trim().toLowerCase();
    if (!nombre) {
      this.editarError = 'EL NOMBRE DEL ROL ES OBLIGATORIO';
      this.cdr.markForCheck();
      return;
    }
    this.editarError = '';
    this.service.updateRol({
      id: this.editandoCode,
      code: this.editandoCode,
      nombre,
      activo: this.editarActivo
    }).subscribe({
      next: () => {
        this.editandoCode = '';
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        const body = err as { error?: { message?: string } };
        this.editarError = body?.error?.message || 'NO SE PUDO ACTUALIZAR EL ROL';
        this.cdr.markForCheck();
      }
    });
  }

  cancelarEdicion(): void {
    this.editandoCode = '';
    this.editarError = '';
    this.cdr.markForCheck();
  }
}