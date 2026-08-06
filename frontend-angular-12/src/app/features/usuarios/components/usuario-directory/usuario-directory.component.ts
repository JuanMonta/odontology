import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-usuario-directory',
  templateUrl: './usuario-directory.component.html',
  styleUrls: ['./usuario-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioDirectoryComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Usuario>();
}
