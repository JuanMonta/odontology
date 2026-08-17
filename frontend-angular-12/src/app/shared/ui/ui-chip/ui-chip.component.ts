import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-chip',
  templateUrl: './ui-chip.component.html',
  styleUrls: ['./ui-chip.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiChipComponent {
  @Input() name = '';
  @Input() sub = '';
}