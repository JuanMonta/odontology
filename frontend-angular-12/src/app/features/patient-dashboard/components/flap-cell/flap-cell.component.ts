import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-flap-cell',
  template: `
    <div
      class="flap-cell"
      [class.flipping]="flipping"
      [style.--flip-delay]="delay + 'ms'"
    >
      <div class="half half-top"><span class="plate">{{ current }}</span></div>
      <div class="half half-bottom"><span class="plate">{{ current }}</span></div>

      <div class="overlay overlay-top"><span class="plate">{{ previous }}</span></div>
      <div class="overlay overlay-bottom"><span class="plate">{{ current }}</span></div>

      <span class="seam" aria-hidden="true"></span>
    </div>
  `,
  styleUrls: ['./flap-cell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlapCellComponent implements OnChanges {
  @Input() current = ' ';
  @Input() delay = 0;

  previous = ' ';
  flipping = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.current && changes.current.previousValue !== changes.current.currentValue) {
      this.previous = String(changes.current.previousValue ?? ' ');
      this.flipping = true;
      this.schedule();
    }
  }

  private schedule(): void {
    if (this.timer) { clearTimeout(this.timer); }
    this.timer = setTimeout(() => {
      this.flipping = false;
      this.timer = null;
    }, 360 + this.delay);
  }
}
