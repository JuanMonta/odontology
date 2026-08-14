import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MessageDraft, MessagePriority } from '../../../../core/models/message.model';
import { MESSAGE_PRIORITIES } from '../../services/messages-http.service';
import { UsuariosHttpService } from '../../../usuarios/services/usuarios-http.service';

export const MESSAGE_SENDER = 'DR. RIVERA';

interface DestinoOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-message-form',
  templateUrl: './message-form.component.html',
  styleUrls: ['./message-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageFormComponent {
  @Output() saved = new EventEmitter<MessageDraft>();
  @Output() cancel = new EventEmitter<void>();

  priorities = MESSAGE_PRIORITIES;
  sender = MESSAGE_SENDER;

  destinos$: Observable<DestinoOption[]>;

  destino: string = 'todos';
  subject = '';
  body = '';
  prioridad: string = 'informacion';
  error = false;

  constructor(usuarios: UsuariosHttpService) {
    this.destinos$ = usuarios.roles$.pipe(
      map(roles => [
        { id: 'todos', label: 'TODOS' },
        ...roles.map(r => ({ id: r.nombre, label: r.nombre.toUpperCase() }))
      ])
    );
  }

  onSubmit(): void {
    if (!this.subject.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: MessageDraft = {
      remitente: this.sender,
      destino: this.destino,
      subject: this.subject.trim().toUpperCase(),
      body: this.body.trim(),
      prioridad: this.prioridad as MessagePriority
    };
    this.saved.emit(draft);
  }
}
