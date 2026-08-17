import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-lamp',
  templateUrl: './ui-lamp.component.html',
  styleUrls: ['./ui-lamp.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiLampComponent {
  @Input() tone: 'off' | 'on' | 'warn' | 'break' = 'off';
  @Input() size: 'md' | 'sm' = 'md';
  @Input() animate = false;
}