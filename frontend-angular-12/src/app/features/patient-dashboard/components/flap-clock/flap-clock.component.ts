import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

@Component({
  selector: 'app-flap-clock',
  template: `
    <span class="clock" role="timer" [attr.aria-label]="timeLabel">
      <app-flap-text [value]="hh" size="lg"></app-flap-text>
      <span class="colon" aria-hidden="true">:</span>
      <app-flap-text [value]="mm" size="lg"></app-flap-text>
      <span class="colon" aria-hidden="true">:</span>
      <app-flap-text [value]="ss" size="lg" class="seconds"></app-flap-text>
    </span>
  `,
  styleUrls: ['./flap-clock.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlapClockComponent implements OnInit, OnDestroy {
  hh = '00';
  mm = '00';
  ss = '00';
  timeLabel = '';
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) { clearInterval(this.timer); }
  }

  private tick(): void {
    const now = new Date();
    this.hh = this.pad(now.getHours());
    this.mm = this.pad(now.getMinutes());
    this.ss = this.pad(now.getSeconds());
    this.timeLabel = `${this.hh}:${this.mm}:${this.ss}`;
  }

  private pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }
}
