import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimePickerComponent {
  @Input() label = 'HORA';
  @Input() required = false;
  @Input() value = '';
  /** Horas permitidas "HH" (p.ej. turno de mañana → ["08".."14"]). Vacío = todas. */
  @Input() availableHours: string[] = [];
  @Output() valueChange = new EventEmitter<string>();

  @ViewChildren('itemEl') items!: QueryList<ElementRef<HTMLButtonElement>>;

  private readonly allHours: string[] = Array.from({ length: 24 }, (_, i) => pad(i));
  minutes: string[] = Array.from({ length: 12 }, (_, i) => pad(i * 5));

  get hours(): string[] {
    return this.availableHours.length ? this.availableHours : this.allHours;
  }

  open = false;
  activeCol: 'h' | 'm' = 'h';
  cursorH = 0;
  cursorM = 0;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  get display(): string {
    return this.value || '--:--';
  }

  get hoursActive(): boolean {
    return this.open && this.activeCol === 'h';
  }

  get minutesActive(): boolean {
    return this.open && this.activeCol === 'm';
  }

  get selectedH(): number {
    return this.value ? Number(this.value.slice(0, 2)) : -1;
  }

  get selectedM(): number {
    return this.value ? Number(this.value.slice(3, 5)) : -1;
  }

  onOpen(): void {
    if (this.open) {
      return;
    }
    const h = this.selectedH >= 0 ? this.selectedH : 8;
    const m = this.selectedM >= 0 ? this.selectedM : 0;
    this.cursorH = this.hours.indexOf(pad(h));
    this.cursorM = this.minutes.indexOf(pad(m));
    if (this.cursorH < 0) { this.cursorH = 0; }
    if (this.cursorM < 0) { this.cursorM = 0; }
    this.activeCol = 'h';
    this.open = true;
    this.cdr.markForCheck();
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.open) {
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.move(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.move(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      this.activeCol = 'h';
      this.cdr.markForCheck();
    } else if (event.key === 'ArrowRight' || event.key === 'Tab') {
      event.preventDefault();
      this.activeCol = 'm';
      this.cdr.markForCheck();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.commit();
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  chooseH(index: number): void {
    this.cursorH = index;
    this.cdr.markForCheck();
  }

  chooseM(index: number): void {
    this.cursorM = index;
    this.cdr.markForCheck();
  }

  commitH(index: number): void {
    this.cursorH = index;
    this.commit();
  }

  commitM(index: number): void {
    this.cursorM = index;
    this.commit();
  }

  trackByIndex(index: number): number {
    return index;
  }

  onBlur(): void {
    setTimeout(() => this.close(), 120);
  }

  private move(delta: number): void {
    const list = this.activeCol === 'h' ? this.hours : this.minutes;
    const cursor = this.activeCol === 'h' ? this.cursorH : this.cursorM;
    const next = (cursor + delta + list.length) % list.length;
    if (this.activeCol === 'h') {
      this.cursorH = next;
    } else {
      this.cursorM = next;
    }
    this.cdr.markForCheck();
    this.scrollCursorIntoView(next);
  }

  private scrollCursorIntoView(index: number): void {
    if (this.activeCol === 'h') {
      const el = this.items.toArray()[index];
      el?.nativeElement.scrollIntoView({ block: 'nearest' });
    } else {
      const el = this.items.toArray()[this.hours.length + index];
      el?.nativeElement.scrollIntoView({ block: 'nearest' });
    }
  }

  private commit(): void {
    const time = `${this.hours[this.cursorH]}:${this.minutes[this.cursorM]}`;
    this.valueChange.emit(time);
    this.close();
  }

  private close(): void {
    this.open = false;
    this.cdr.markForCheck();
  }
}
