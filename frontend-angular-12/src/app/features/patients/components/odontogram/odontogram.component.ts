import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Tooth, ToothCondition, ToothFace, ToothFaceName } from '../../../../core/models/patient.model';

interface ToothView {
  tooth: Tooth;
  number: number;
  kind: 'perm' | 'dec';
  arch: 'top' | 'bottom';
  side: 'left' | 'right';
  x: number;  // perm: borde izquierdo; dec: centro X
  y: number;  // perm: borde superior; dec: centro Y
}

interface FaceOverlay {
  kind: 'rect' | 'path' | 'circle';
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  color: string;
  face: ToothFaceName;
}

interface WholeMark {
  id: ToothCondition;
  color: string;
  x: number;
  y: number;
  scale: number;
}

interface Span {
  c: 'protesis-fija' | 'protesis-removible' | 'protesis-total';
  d: string;
  ends: string;
  color: string;
}

interface SymbolMeta {
  label: string;
  color: string;
}

const CELL = 35;
const DEC_R = 22;

const PERM_X0 = 70;
const PERM_STEP = 55;
const PERM_TOP_Y = 95;
const PERM_BOT_Y = 330;

const DEC_X0 = 140;
const DEC_STEP = 80;
const DEC_TOP_Y = 200;
const DEC_BOT_Y = 260;

const PERIO_CYCLE = ['', 'X', '1', '2', '3'];

const LOST: ToothCondition[] = ['perdida-por-caries', 'perdida-otra-causa'];

const WHOLE_EXCLUDE: ToothCondition[] = [
  'caries',
  'obturado',
  'protesis-fija',
  'protesis-removible',
  'protesis-total'
];

export const SYMBOLS: Record<ToothCondition, SymbolMeta> = {
  caries: { label: 'CARIES', color: 'var(--odo-needed)' },
  obturado: { label: 'OBTURADO', color: 'var(--odo-done)' },
  endodoncia: { label: 'ENDODONCIA', color: 'var(--odo-needed)' },
  corona: { label: 'CORONA', color: 'var(--odo-needed)' },
  extraccion: { label: 'EXTRACCIÓN', color: 'var(--odo-needed)' },
  'sellante-necesario': { label: 'SELLANTE NEC.', color: 'var(--odo-needed)' },
  'sellante-realizado': { label: 'SELLANTE REAL.', color: 'var(--odo-done)' },
  'protesis-fija': { label: 'PRÓTESIS FIJA', color: 'var(--odo-needed)' },
  'protesis-removible': { label: 'PRÓTESIS REM.', color: 'var(--odo-needed)' },
  'protesis-total': { label: 'PRÓTESIS TOTAL', color: 'var(--odo-needed)' },
  'perdida-por-caries': { label: 'PÉRD. CARIES', color: 'var(--odo-done)' },
  'perdida-otra-causa': { label: 'PÉRD. OTRA CAUSA', color: 'var(--odo-needed)' }
};

export const SYMBOL_ORDER: ToothCondition[] = [
  'caries',
  'obturado',
  'endodoncia',
  'corona',
  'sellante-necesario',
  'sellante-realizado',
  'protesis-fija',
  'protesis-removible',
  'protesis-total',
  'extraccion',
  'perdida-por-caries',
  'perdida-otra-causa'
];

export const FACE_ORDER: ToothFaceName[] = ['oclusal', 'mesial', 'distal', 'vestibular', 'lingual'];

const FACE_LABELS: Record<ToothFaceName, string> = {
  oclusal: 'OCLUSAL',
  mesial: 'MESIAL',
  distal: 'DISTAL',
  vestibular: 'VESTIBULAR',
  lingual: 'LINGUAL'
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

  topPerm: ToothView[] = [];
  botPerm: ToothView[] = [];
  topDec: ToothView[] = [];
  botDec: ToothView[] = [];
  topSpans: Span[] = [];
  botSpans: Span[] = [];

  activeTool: ToothCondition | 'clear' | null = null;
  faceTarget: ToothView | null = null;

  readonly order = SYMBOL_ORDER;
  readonly faces = FACE_ORDER;

  ngOnChanges(): void {
    this.build();
  }

  selectTool(tool: ToothCondition | 'clear' | null): void {
    this.activeTool = this.activeTool === tool ? null : tool;
    this.faceTarget = null;
  }

  isActive(tool: ToothCondition | 'clear' | null): boolean {
    return this.activeTool === tool;
  }

  isFaceTool(): boolean {
    return this.activeTool === 'caries' || this.activeTool === 'obturado';
  }

  clickTooth(tv: ToothView): void {
    if (!this.activeTool) {
      return;
    }
    if (this.activeTool === 'clear') {
      this.change.emit({ number: tv.tooth.number, conditions: [], faces: [] });
      return;
    }
    if (this.isFaceTool()) {
      this.faceTarget = this.faceTarget === tv ? null : tv;
      return;
    }
    this.faceTarget = null;
    const conditions = [...tv.tooth.conditions];
    const i = conditions.indexOf(this.activeTool);
    if (i >= 0) {
      conditions.splice(i, 1);
    } else {
      conditions.push(this.activeTool);
    }
    this.change.emit({ ...tv.tooth, conditions });
  }

  facePick(face: ToothFaceName): void {
    const tv = this.faceTarget;
    if (!tv || !this.isFaceTool()) {
      return;
    }
    const condition = this.activeTool as 'caries' | 'obturado';
    const faces: ToothFace[] = [...(tv.tooth.faces ?? [])];
    const i = faces.findIndex(f => f.face === face);
    if (i >= 0) {
      faces.splice(i, 1);
    } else {
      faces.push({ face, condition });
    }
    this.change.emit({ ...tv.tooth, faces });
  }

  faceMarked(face: ToothFaceName): boolean {
    return !!this.faceTarget?.tooth.faces?.some(f => f.face === face);
  }

  faceMarkColor(face: ToothFaceName): string {
    const mark = this.faceTarget?.tooth.faces?.find(f => f.face === face);
    return mark ? SYMBOLS[mark.condition].color : '';
  }

  clickPerio(tv: ToothView, kind: 'movilidad' | 'recesion'): void {
    if (this.isMissing(tv)) {
      return;
    }
    const cur = tv.tooth[kind] ?? '';
    const next = PERIO_CYCLE[(PERIO_CYCLE.indexOf(cur) + 1) % PERIO_CYCLE.length];
    this.change.emit({ ...tv.tooth, [kind]: next });
  }

  isMissing(tv: ToothView): boolean {
    return tv.tooth.conditions.some(c => LOST.includes(c));
  }

  symbolLabel(c: ToothCondition): string {
    return SYMBOLS[c].label;
  }

  colorOf(c: ToothCondition | 'clear' | null): string {
    return c && c !== 'clear' ? SYMBOLS[c].color : 'var(--odo-neutral)';
  }

  faceLabel(face: ToothFaceName): string {
    return FACE_LABELS[face];
  }

  countFor(c: ToothCondition): number {
    if (c === 'caries' || c === 'obturado') {
      return this.teeth.filter(t => (t.faces ?? []).some(f => f.condition === c)).length;
    }
    return this.teeth.filter(t => t.conditions.includes(c)).length;
  }

  ariaLabel(tv: ToothView): string {
    const conds = tv.tooth.conditions.map(c => SYMBOLS[c].label);
    const faceConds = (tv.tooth.faces ?? []).map(f => `${FACE_LABELS[f.face]} ${SYMBOLS[f.condition].label}`);
    const list = [...conds, ...faceConds].join(', ') || 'sana';
    const perio = [
      tv.tooth.movilidad ? `movilidad ${tv.tooth.movilidad}` : '',
      tv.tooth.recesion ? `recesión ${tv.tooth.recesion}` : ''
    ]
      .filter(Boolean)
      .join(', ');
    return `Pieza ${tv.number}, ${list}${perio ? '. ' + perio : ''}. Enter para marcar con el símbolo seleccionado`;
  }

  faceOverlays(tv: ToothView): FaceOverlay[] {
    return (tv.tooth.faces ?? []).map(f => this.faceOverlayFor(tv, f));
  }

  wholeMarks(tv: ToothView): WholeMark[] {
    const conds = tv.tooth.conditions.filter(c => !WHOLE_EXCLUDE.includes(c));
    const cx = tv.kind === 'perm' ? tv.x + CELL / 2 : tv.x;
    const cy = tv.kind === 'perm' ? tv.y + CELL / 2 : tv.y;
    return conds.map(c => {
      const big = c === 'perdida-por-caries' || c === 'perdida-otra-causa';
      const s = big ? (tv.kind === 'perm' ? 30 : 26) : tv.kind === 'perm' ? 27 : 24;
      return { id: c, color: SYMBOLS[c].color, x: cx - s / 2, y: cy - s / 2, scale: s / 24 };
    });
  }

  coronaRect(tv: ToothView): { x: number; y: number; w: number; h: number } | null {
    if (!tv.tooth.conditions.includes('corona')) {
      return null;
    }
    if (tv.kind === 'perm') {
      return { x: tv.x - 2, y: tv.y - 2, w: CELL + 4, h: CELL + 4 };
    }
    return { x: tv.x - DEC_R - 2, y: tv.y - DEC_R - 2, w: DEC_R * 2 + 4, h: DEC_R * 2 + 4 };
  }

  numX(tv: ToothView): number {
    return tv.kind === 'perm' ? tv.x + CELL / 2 : tv.x;
  }

  numY(tv: ToothView): number {
    if (tv.kind === 'perm') {
      return tv.arch === 'top' ? tv.y - 5 : tv.y + CELL + 20;
    }
    return tv.arch === 'top' ? tv.y - DEC_R - 3 : tv.y + DEC_R + 13;
  }

  perioBoxY(kind: 'movilidad' | 'recesion', arch: 'top' | 'bottom'): number {
    if (arch === 'top') {
      return kind === 'recesion' ? 3 : 37;
    }
    return kind === 'movilidad' ? 403 : 437;
  }

  perioValue(tv: ToothView, kind: 'movilidad' | 'recesion'): string {
    return tv.tooth[kind] ?? '';
  }

  private faceOverlayFor(tv: ToothView, f: ToothFace): FaceOverlay {
    const color = SYMBOLS[f.condition].color;
    if (tv.kind === 'perm') {
      const x = tv.x;
      const y = tv.y;
      const strip = 9;
      const ocl = { x: x + 9, y: y + 9, w: CELL - 18, h: CELL - 18 };
      const top = { x: x + 0.5, y: y + 0.5, w: CELL - 1, h: strip };
      const bot = { x: x + 0.5, y: y + CELL - strip - 0.5, w: CELL - 1, h: strip };
      const left = { x: x + 0.5, y: y + 0.5, w: strip, h: CELL - 1 };
      const right = { x: x + CELL - strip - 0.5, y: y + 0.5, w: strip, h: CELL - 1 };
      const vesTop = tv.arch === 'top';
      let r: { x: number; y: number; w: number; h: number };
      switch (f.face) {
        case 'oclusal':
          r = ocl;
          break;
        case 'vestibular':
          r = vesTop ? top : bot;
          break;
        case 'lingual':
          r = vesTop ? bot : top;
          break;
        case 'mesial':
          r = this.mesialRight(tv) ? right : left;
          break;
        default:
          r = this.mesialRight(tv) ? left : right;
      }
      return { kind: 'rect', ...r, color, face: f.face };
    }
    const cx = tv.x;
    const cy = tv.y;
    const r = DEC_R - 2;
    const vesTop = tv.arch === 'top';
    switch (f.face) {
      case 'oclusal':
        return { kind: 'circle', cx, cy, r: 8, color, face: f.face };
      case 'vestibular':
        return {
          kind: 'path',
          d: vesTop
            ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`
            : `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy} Z`,
          color,
          face: f.face
        };
      case 'lingual':
        return {
          kind: 'path',
          d: vesTop
            ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy} Z`
            : `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`,
          color,
          face: f.face
        };
      case 'mesial':
        return {
          kind: 'path',
          d: this.mesialRight(tv)
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`
            : `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`,
          color,
          face: f.face
        };
      default:
        return {
          kind: 'path',
          d: this.mesialRight(tv)
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`
            : `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`,
          color,
          face: f.face
        };
    }
  }

  private mesialRight(tv: ToothView): boolean {
    return tv.side === 'left';
  }

  private buildSpans(row: ToothView[]): Span[] {
    const spans: Span[] = [];
    if (!row.length) {
      return spans;
    }
    const firstX = row[0].x;
    const lastX = row[row.length - 1].x + CELL;
    const rowY = row[0].y;

    if (row.some(t => t.tooth.conditions.includes('protesis-total'))) {
      spans.push({
        c: 'protesis-total',
        d: `M ${firstX + 1} ${rowY + 4} L ${lastX - 1} ${rowY + 4} M ${firstX + 1} ${rowY + CELL - 4} L ${lastX - 1} ${rowY + CELL - 4}`,
        ends: '',
        color: SYMBOLS['protesis-total'].color
      });
    }

    for (const c of ['protesis-fija', 'protesis-removible'] as const) {
      let i = 0;
      while (i < row.length) {
        if (!row[i].tooth.conditions.includes(c)) {
          i++;
          continue;
        }
        let j = i;
        while (j + 1 < row.length && row[j + 1].tooth.conditions.includes(c)) {
          j++;
        }
        const x1 = row[i].x + 2;
        const x2 = row[j].x + CELL - 2;
        const y = rowY + CELL / 2;
        const d = `M ${x1} ${y} L ${x2} ${y}`;
        const ends =
          c === 'protesis-fija'
            ? `M ${x1} ${y - 7} L ${x1} ${y + 7} M ${x2} ${y - 7} L ${x2} ${y + 7}`
            : `M ${x1} ${y - 8} C ${x1 - 5} ${y - 5} ${x1 - 5} ${y + 5} ${x1} ${y + 8} M ${x2} ${y - 8} C ${x2 + 5} ${y - 5} ${x2 + 5} ${y + 5} ${x2} ${y + 8}`;
        spans.push({ c, d, ends, color: SYMBOLS[c].color });
        i = j + 1;
      }
    }
    return spans;
  }

  private build(): void {
    const map = new Map<number, Tooth>(this.teeth.map(t => [t.number, t]));
    this.topPerm = this.permRow(map, true);
    this.botPerm = this.permRow(map, false);
    this.topDec = this.decRow(map, true);
    this.botDec = this.decRow(map, false);
    this.topSpans = this.buildSpans(this.topPerm);
    this.botSpans = this.buildSpans(this.botPerm);
    this.faceTarget = this.faceTarget ? this.findView(this.faceTarget.number) : null;
  }

  private permRow(map: Map<number, Tooth>, archTop: boolean): ToothView[] {
    const left = archTop ? [18, 17, 16, 15, 14, 13, 12, 11] : [48, 47, 46, 45, 44, 43, 42, 41];
    const right = archTop ? [21, 22, 23, 24, 25, 26, 27, 28] : [31, 32, 33, 34, 35, 36, 37, 38];
    const nums = [...left, ...right];
    return nums.map((n, i) => {
      const idx = i;
      return {
        tooth: map.get(n) ?? this.emptyTooth(n),
        number: n,
        kind: 'perm' as const,
        arch: archTop ? ('top' as const) : ('bottom' as const),
        side: i < 8 ? ('left' as const) : ('right' as const),
        x: PERM_X0 + idx * PERM_STEP,
        y: archTop ? PERM_TOP_Y : PERM_BOT_Y
      };
    });
  }

  private decRow(map: Map<number, Tooth>, archTop: boolean): ToothView[] {
    const left = archTop ? [55, 54, 53, 52, 51] : [85, 84, 83, 82, 81];
    const right = archTop ? [61, 62, 63, 64, 65] : [71, 72, 73, 74, 75];
    const nums = [...left, ...right];
    return nums.map((n, i) => {
      const idx = i;
      return {
        tooth: map.get(n) ?? this.emptyTooth(n),
        number: n,
        kind: 'dec' as const,
        arch: archTop ? ('top' as const) : ('bottom' as const),
        side: i < 5 ? ('left' as const) : ('right' as const),
        x: DEC_X0 + idx * DEC_STEP,
        y: archTop ? DEC_TOP_Y : DEC_BOT_Y
      };
    });
  }

  private emptyTooth(n: number): Tooth {
    return { number: n, conditions: [] as ToothCondition[] };
  }

  private findView(n: number): ToothView | null {
    const all = [...this.topPerm, ...this.botPerm, ...this.topDec, ...this.botDec];
    return all.find(v => v.number === n) ?? null;
  }
}
