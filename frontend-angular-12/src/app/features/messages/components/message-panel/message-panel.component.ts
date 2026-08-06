import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ClinicMessage, MessageDraft } from '../../../../core/models/message.model';
import { MessagesMockService } from '../../services/messages-mock.service';

@Component({
  selector: 'app-message-panel',
  templateUrl: './message-panel.component.html',
  styleUrls: ['./message-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessagePanelComponent {
  @Input() message: ClinicMessage | null = null;
  @Input() creating = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<MessageDraft>();

  constructor(private service: MessagesMockService) {}

  toggleRead(): void {
    if (!this.message) {
      return;
    }
    if (this.message.status === 'read') {
      this.service.markUnread(this.message.id);
    } else {
      this.service.markRead(this.message.id);
    }
  }
}
