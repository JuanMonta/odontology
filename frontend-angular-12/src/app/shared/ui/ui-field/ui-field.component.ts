import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'ui-field',
  templateUrl: './ui-field.component.html',
  styleUrls: ['./ui-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiFieldComponent {
  @Input() label = '';
  @Input() required = false;
  @Input() full = false;

  @HostBinding('class.field--full')
  get fullClass(): boolean {
    return this.full;
  }
}