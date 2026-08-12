import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ClinicMessage } from '../../../../core/models/message.model';
import { MESSAGE_CHANNELS, MESSAGE_DESTINOS, MESSAGE_PRIORITIES } from '../../services/messages-http.service';

@Component({
  selector: 'app-message-directory',
  templateUrl: './message-directory.component.html',
  styleUrls: ['./message-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageDirectoryComponent {
  @Input() messages: ClinicMessage[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<ClinicMessage>();

  channelLabel(id: string): string {
    return MESSAGE_CHANNELS.find(c => c.id === id)?.label ?? id;
  }

  destinoLabel(id: string): string {
    return MESSAGE_DESTINOS.find(d => d.id === id)?.label ?? id;
  }

  prioridadLabel(id: string): string {
    return MESSAGE_PRIORITIES.find(p => p.id === id)?.label ?? id;
  }
}
