import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  CatalogoItem,
  Usuario,
  UsuarioDraft,
  UsuarioRol,
  UsuarioStatus
} from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioFormComponent implements OnChanges {
  @Input() usuario: Usuario | null = null;
  @Input() roles: CatalogoItem[] = [];
  @Input() estados: CatalogoItem[] = [];
  @Input() esAdmin = false;
  @Output() saved = new EventEmitter<UsuarioDraft>();
  @Output() cancel = new EventEmitter<void>();
  @Output() crearRol = new EventEmitter<string>();
  @Output() crearEstado = new EventEmitter<string>();

  username = '';
  name = '';
  role: UsuarioRol = '';
  status: UsuarioStatus = '';
  error = false;

  nuevoRol = '';
  nuevoEstado = '';
  creandoRol = false;
  creandoEstado = false;

  private pendienteRol: string | null = null;
  private pendienteEstado: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.usuario && this.usuario) {
      this.username = this.usuario.username;
      this.name = this.usuario.name;
      this.role = this.usuario.role;
      this.status = this.usuario.status;
      this.error = false;
    }
    if (changes.roles) {
      if (this.pendienteRol && this.roles.some(r => r.nombre === this.pendienteRol)) {
        this.role = this.pendienteRol;
        this.pendienteRol = null;
      }
      if (this.roles.length && !this.role) {
        this.role = this.roles[0].nombre;
      }
    }
    if (changes.estados) {
      if (this.pendienteEstado && this.estados.some(e => e.nombre === this.pendienteEstado)) {
        this.status = this.pendienteEstado;
        this.pendienteEstado = null;
      }
      if (this.estados.length && !this.status) {
        this.status = this.estados[0].nombre;
      }
    }
  }

  onCrearRol(): void {
    const nombre = this.nuevoRol.trim().toLowerCase();
    if (!nombre) {
      return;
    }
    this.creandoRol = false;
    this.pendienteRol = nombre;
    this.nuevoRol = '';
    this.crearRol.emit(nombre);
  }

  onCrearEstado(): void {
    const nombre = this.nuevoEstado.trim().toLowerCase();
    if (!nombre) {
      return;
    }
    this.creandoEstado = false;
    this.pendienteEstado = nombre;
    this.nuevoEstado = '';
    this.crearEstado.emit(nombre);
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.name.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: UsuarioDraft = {
      username: this.username.trim().toLowerCase().replace(/\s+/g, ''),
      name: this.name.trim().toUpperCase(),
      role: this.role,
      status: this.status
    };
    this.saved.emit(draft);
  }
}
