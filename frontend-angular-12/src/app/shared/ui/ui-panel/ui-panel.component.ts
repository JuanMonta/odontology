import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ui-panel',
  templateUrl: './ui-panel.component.html',
  styleUrls: ['./ui-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiPanelComponent {
  @Input() kicker = '';
  @Input() title = '';
  @Input() warn = false;
  @Input() showClose = true;
  @Output() close = new EventEmitter<void>();
}