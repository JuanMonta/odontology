import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ui-cat-card',
  templateUrl: './ui-cat-card.component.html',
  styleUrls: ['./ui-cat-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiCatCardComponent {
  @Input() title = '';
  @Input() code = '';
  @Input() error = '';
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}