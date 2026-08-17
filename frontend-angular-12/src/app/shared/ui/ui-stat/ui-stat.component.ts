import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-stat',
  templateUrl: './ui-stat.component.html',
  styleUrls: ['./ui-stat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiStatComponent {
  @Input() value: string | number = '';
  @Input() label = '';
}