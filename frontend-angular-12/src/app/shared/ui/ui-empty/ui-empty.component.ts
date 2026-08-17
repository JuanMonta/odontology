import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'ui-empty',
  templateUrl: './ui-empty.component.html',
  styleUrls: ['./ui-empty.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiEmptyComponent {
  @Input() variant: 'bare' | 'panel' | 'bordered' = 'bordered';
  @Input() text = '';
  @Input() hint = '';

  @HostBinding('class.empty-grow')
  get grow(): boolean {
    return this.variant === 'bare' || this.variant === 'panel';
  }
}