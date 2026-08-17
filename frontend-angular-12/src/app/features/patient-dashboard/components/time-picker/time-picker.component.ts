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
  /** Si true, no permite elegir horas/minutos anteriores a la hora actual. */
  @Input() disablePast = false;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChildren('itemEl') items!: QueryList<ElementRef<HTMLButtonElement>>;

  private readonly allHours: string[] = Array.from({ length: 24 }, (_, i) => pad(i));
  private readonly allMinutes: string[] = Array.from({ length: 12 }, (_, i) => pad(i * 5));
  /** Instante de referencia capturado al abrir el desplegable. */
  private now = new Date();

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

  /** Horas disponibles: restringidas por turno y, si aplica, sin horas pasadas. */
  get hours(): string[] {
    let list = this.availableHours.length ? this.availableHours : this.allHours;
    if (this.disablePast) {
      list = list.filter(h => Number(h) >= this.now.getHours());
    }
    return list;
  }

  /** Minutos disponibles para la hora bajo el cursor (filtra los ya pasados). */
  get minutesForCursor(): string[] {
    const h = this.hours[this.cursorH] ?? this.hours[0];
    if (h === undefined) {
      return [];
    }
    let list = this.allMinutes;
    if (this.disablePast && Number(h) === this.now.getHours()) {
      const firstValid = Math.ceil(this.now.getMinutes() / 5) * 5;
      list = list.filter(m => Number(m) >= firstValid);
    }
    return list;
  }

  onOpen(): void {
    if (this.open) {
      return;
    }
    this.now = new Date();
    const h = this.selectedH >= 0 ? this.selectedH : this.now.getHours();
    const m = this.selectedM >= 0 ? this.selectedM : 0;
    this.cursorH = this.hours.indexOf(pad(h));
    if (this.cursorH < 0) { this.cursorH = 0; }
    const mins = this.minutesForCursor;
    this.cursorM = mins.indexOf(pad(m));
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
    this.cursorM = 0;
    this.cdr.markForCheck();
  }

  chooseM(index: number): void {
    this.cursorM = index;
    this.cdr.markForCheck();
  }

  commitH(index: number): void {
    this.cursorH = index;
    this.cursorM = 0;
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
    if (this.activeCol === 'h') {
      const list = this.hours;
      if (list.length === 0) {
        return;
      }
      this.cursorH = (this.cursorH + delta + list.length) % list.length;
      this.cursorM = 0;
      this.cdr.markForCheck();
      this.scrollCursorIntoView(this.cursorH);
    } else {
      const list = this.minutesForCursor;
      if (list.length === 0) {
        return;
      }
      this.cursorM = (this.cursorM + delta + list.length) % list.length;
      this.cdr.markForCheck();
      this.scrollCursorIntoView(this.cursorM, true);
    }
  }

  private scrollCursorIntoView(index: number, isMinutes = false): void {
    const el = this.items.toArray()[isMinutes ? this.hours.length + index : index];
    el?.nativeElement.scrollIntoView({ block: 'nearest' });
  }

  private commit(): void {
    const h = this.hours[this.cursorH];
    const mins = this.minutesForCursor;
    if (h === undefined || mins.length === 0) {
      return;
    }
    const m = mins[Math.min(this.cursorM, mins.length - 1)];
    this.valueChange.emit(`${h}:${m}`);
    this.close();
  }

  private close(): void {
    this.open = false;
    this.cdr.markForCheck();
  }
}