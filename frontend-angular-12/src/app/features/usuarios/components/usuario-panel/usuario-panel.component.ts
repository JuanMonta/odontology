import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  CatalogoItem,
  Usuario,
  UsuarioDraft,
  UsuarioStatus
} from '../../../../core/models/usuario.model';

export function usuarioStatusLabel(status: UsuarioStatus): string {
  switch (status) {
    case 'activo':
      return 'ACCESO ACTIVO';
    case 'suspendido':
      return 'CUENTA SUSPENDIDA';
    case 'inactivo':
      return 'CUENTA INACTIVA';
    default:
      return status ? status.toUpperCase() : 'SIN ESTADO';
  }
}

@Component({
  selector: 'app-usuario-panel',
  templateUrl: './usuario-panel.component.html',
  styleUrls: ['./usuario-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioPanelComponent implements OnChanges {
  @Input() usuario: Usuario | null = null;
  @Input() creating = false;
  @Input() roles: CatalogoItem[] = [];
  @Input() estados: CatalogoItem[] = [];
  @Input() esAdmin = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<UsuarioDraft>();
  @Output() toggle = new EventEmitter<string>();
  @Output() crearRol = new EventEmitter<string>();
  @Output() crearEstado = new EventEmitter<string>();

  editing = false;

  statusLabel = usuarioStatusLabel;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.usuario || changes.creating) {
      this.editing = false;
    }
  }

  startEdit(): void {
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  closeForm(): void {
    if (this.creating) {
      this.cancel.emit();
    } else {
      this.cancelEdit();
    }
  }

  onSaved(draft: UsuarioDraft): void {
    this.editing = false;
    this.saved.emit(draft);
  }
}
