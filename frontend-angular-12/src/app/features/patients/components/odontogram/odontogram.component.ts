import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Tooth, ToothStatus } from '../../../../core/models/patient.model';

interface ToothView {
  tooth: Tooth;
  x: number;
  y: number;
  cx: number;
  cy: number;
}

const TOP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const BOTTOM = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const CELL = 26;
const STEP = 27;
const MID = 16;
const PAD = 10;
const ORDER: ToothStatus[] = ['healthy', 'caries', 'treatment', 'missing'];

const LABELS: Record<ToothStatus, string> = {
  healthy: 'SANA',
  caries: 'CARIES',
  treatment: 'EN TRATAMIENTO',
  missing: 'AUSENTE'
};

@Component({
  selector: 'app-odontogram',
  templateUrl: './odontogram.component.html',
  styleUrls: ['./odontogram.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdontogramComponent implements OnChanges {
  @Input() teeth: Tooth[] = [];
  @Output() change = new EventEmitter<Tooth>();

  top: ToothView[] = [];
  bottom: ToothView[] = [];

  ngOnChanges(): void {
    this.build();
  }

  cycle(tv: ToothView): void {
    const next = ORDER[(ORDER.indexOf(tv.tooth.status) + 1) % ORDER.length];
    this.change.emit({ number: tv.tooth.number, status: next });
  }

  stateClass(s: ToothStatus): string {
    return `tooth--${s}`;
  }

  statusLabel(s: ToothStatus): string {
    return LABELS[s];
  }

  crownD(tv: ToothView): string {
    return `M ${tv.x + 3} ${tv.y + 5} Q ${tv.cx} ${tv.y - 2} ${tv.x + CELL - 3} ${tv.y + 5}`;
  }

  ariaLabel(tv: ToothView): string {
    return `Pieza ${tv.tooth.number}, ${LABELS[tv.tooth.status]}. Enter para cambiar estado`;
  }

  counts(): { status: ToothStatus; count: number }[] {
    return ORDER.map(status => ({
      status,
      count: this.teeth.filter(t => t.status === status).length
    }));
  }

  private build(): void {
    const map = new Map<number, Tooth>(this.teeth.map(t => [t.number, t]));
    this.top = TOP.map((n, i) => this.pos(n, i, true, map));
    this.bottom = BOTTOM.map((n, i) => this.pos(n, i, false, map));
  }

  private pos(n: number, i: number, isTop: boolean, map: Map<number, Tooth>): ToothView {
    const x = PAD + i * STEP + (i >= 8 ? MID : 0);
    const arc = Math.sin(Math.PI * i / 15);
    const y = isTop ? 16 + arc * 12 : 128 - arc * 12;
    const tooth = map.get(n) ?? { number: n, status: 'healthy' as const };
    return { tooth, x, y, cx: x + CELL / 2, cy: y + CELL - 8 };
  }
}
