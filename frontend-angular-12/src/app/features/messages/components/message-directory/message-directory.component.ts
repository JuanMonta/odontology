import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ClinicMessage } from '../../../../core/models/message.model';
import { MESSAGE_PRIORITIES } from '../../services/messages-http.service';

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

  destinoLabel(id: string): string {
    return id === 'todos' ? 'TODOS' : id.toUpperCase();
  }

  prioridadLabel(id: string): string {
    return MESSAGE_PRIORITIES.find(p => p.id === id)?.label ?? id;
  }
}
