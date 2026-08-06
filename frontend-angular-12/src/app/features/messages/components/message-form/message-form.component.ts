import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { MessageDraft } from '../../../../core/models/message.model';
import { MESSAGE_CHANNELS } from '../../services/messages-http.service';

@Component({
  selector: 'app-message-form',
  templateUrl: './message-form.component.html',
  styleUrls: ['./message-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageFormComponent {
  @Output() submit = new EventEmitter<MessageDraft>();
  @Output() cancel = new EventEmitter<void>();

  channels = MESSAGE_CHANNELS;

  to = '';
  subject = '';
  body = '';
  channel: string = 'equipo';
  error = false;

  onSubmit(): void {
    if (!this.to.trim() || !this.subject.trim()) {
      this.error = true;
      return;
    }
    this.error = false;
    const draft: MessageDraft = {
      to: this.to.trim().toUpperCase(),
      subject: this.subject.trim().toUpperCase(),
      body: this.body.trim(),
      channel: this.channel as MessageDraft['channel']
    };
    this.submit.emit(draft);
  }
}
