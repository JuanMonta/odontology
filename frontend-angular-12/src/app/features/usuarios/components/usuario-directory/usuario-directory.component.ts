import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '../../../../core/models/usuario.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';

@Component({
  selector: 'app-usuario-directory',
  templateUrl: './usuario-directory.component.html',
  styleUrls: ['./usuario-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioDirectoryComponent extends PaginatedListComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Usuario>();

  protected get totalItems(): number {
    return this.usuarios.length;
  }

  get visibleUsuarios(): Usuario[] {
    return this.slice(this.usuarios) as Usuario[];
  }
}
