import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  Usuario,
  UsuarioDraft,
  UsuarioRol,
  UsuarioStatus
} from '../../../../core/models/usuario.model';
import { ROLES } from '../../services/usuarios-http.service';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioFormComponent implements OnChanges {
  @Input() usuario: Usuario | null = null;
  @Output() saved = new EventEmitter<UsuarioDraft>();
  @Output() cancel = new EventEmitter<void>();

  roles = ROLES;
  statuses: UsuarioStatus[] = ['activo', 'suspendido', 'inactivo'];

  username = '';
  name = '';
  role: UsuarioRol = 'odontólogo';
  status: UsuarioStatus = 'activo';
  error = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.usuario && this.usuario) {
      this.username = this.usuario.username;
      this.name = this.usuario.name;
      this.role = this.usuario.role;
      this.status = this.usuario.status;
      this.error = false;
    }
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
