import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-cat-act',
  templateUrl: './ui-cat-act.component.html',
  styleUrls: ['./ui-cat-act.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiCatActComponent {
  @Input() icon: 'plus' | 'pencil' = 'plus';
  @Input() open = false;
}