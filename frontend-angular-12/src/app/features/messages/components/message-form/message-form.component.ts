import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { MessageDestino, MessageDraft, MessagePriority } from '../../../../core/models/message.model';
import { MESSAGE_CHANNELS, MESSAGE_DESTINOS, MESSAGE_PRIORITIES } from '../../services/messages-http.service';

export const MESSAGE_SENDER = 'DR. RIVERA';

@Component({
  selector: 'app-message-form',
  templateUrl: './message-form.component.html',
  styleUrls: ['./message-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageFormComponent {
  @Output() saved = new EventEmitter<MessageDraft>();
  @Output() cancel = new EventEmitter<void>();

  channels = MESSAGE_CHANNELS;
  destinos = MESSAGE_DESTINOS;
  priorities = MESSAGE_PRIORITIES;
  sender = MESSAGE_SENDER;

  destino: string = 'todos';
  subject = '';
  body = '';
  channel: string = 'equipo';
  prioridad: string = 'informacion';
  error = false;

  onSubmit(): void {
    if (!this.subject.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: MessageDraft = {
      remitente: this.sender,
      destino: this.destino as MessageDestino,
      subject: this.subject.trim().toUpperCase(),
      body: this.body.trim(),
      channel: this.channel as MessageDraft['channel'],
      prioridad: this.prioridad as MessagePriority
    };
    this.saved.emit(draft);
  }
}
