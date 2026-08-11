import {
  Tooth,
  ToothCondition,
  ToothFace,
  ToothFaceCondition,
  ToothFaceName
} from '../../core/models/patient.model';
import {
  DEC_BOTTOM,
  DEC_TOP,
  FACE_CONDITIONS,
  FACE_LABELS,
  LOST,
  PERM_BOTTOM,
  PERM_TOP,
  SYMBOLS,
  SYMBOL_ORDER,
  WHOLE_EXCLUDE
} from './odontogram.model';

export interface ToothViewBase {
  tooth: Tooth;
  number: number;
  kind: 'perm' | 'dec';
  arch: 'top' | 'bottom';
  side: 'left' | 'right';
  x: number;  // perm: borde izquierdo; dec: centro X
  y: number;  // perm: borde superior; dec: centro Y
}

export interface ToothView extends ToothViewBase {
  labelX: number;
  missing: boolean;
  overlays: FaceOverlay[];
  marks: WholeMark[];
  corona: { x: number; y: number; w: number; h: number } | null;
  ariaLabel: string;
}

export interface FaceOverlay {
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

export interface WholeMark {
  id: ToothCondition;
  x: number;
  y: number;
  size: number;
}

export interface Span {
  c: 'protesis-fija' | 'protesis-removible' | 'protesis-total';
  d: string;
  ends: string;
  color: string;
}

export interface PerioRow {
  label: string;
  aria: string;
  kind: 'movilidad' | 'recesion';
  views: ToothView[];
  values: string[];
  labelY: number;
  boxY: number;
}

export interface OdontogramViewModel {
  topPerm: ToothView[];
  botPerm: ToothView[];
  topDec: ToothView[];
  botDec: ToothView[];
  spanRows: Span[][];
  perioRowsTop: PerioRow[];
  perioRowsBottom: PerioRow[];
  counts: Record<ToothCondition, number>;
}

const CELL = 35;
const DEC_R = 22;

const PERM_X0 = 120;
const PERM_STEP = 55;
const PERM_TOP_Y = 95;
const PERM_BOT_Y = 330;

const DEC_X0 = 190;
const DEC_STEP = 80;
const DEC_TOP_Y = 200;
const DEC_BOT_Y = 260;

export function buildView(teeth: Tooth[]): OdontogramViewModel {
  const map = new Map<number, Tooth>(teeth.map(t => [t.number, t]));
  const topPerm = permRow(map, true);
  const botPerm = permRow(map, false);
  const topDec = decRow(map, true);
  const botDec = decRow(map, false);
  return {
    topPerm,
    botPerm,
    topDec,
    botDec,
    spanRows: [buildSpans(topPerm), buildSpans(botPerm)],
    perioRowsTop: perioRowsFor(topPerm, 'top'),
    perioRowsBottom: perioRowsFor(botPerm, 'bottom'),
    counts: computeCounts(teeth)
  };
}

function permRow(map: Map<number, Tooth>, archTop: boolean): ToothView[] {
  const quad = archTop ? PERM_TOP : PERM_BOTTOM;
  const nums = [...quad.left, ...quad.right];
  return nums.map((n, i) =>
    enrich({
      tooth: map.get(n) ?? emptyTooth(n),
      number: n,
      kind: 'perm',
      arch: archTop ? 'top' : 'bottom',
      side: i < quad.left.length ? 'left' : 'right',
      x: PERM_X0 + i * PERM_STEP,
      y: archTop ? PERM_TOP_Y : PERM_BOT_Y
    })
  );
}

function decRow(map: Map<number, Tooth>, archTop: boolean): ToothView[] {
  const quad = archTop ? DEC_TOP : DEC_BOTTOM;
  const nums = [...quad.left, ...quad.right];
  return nums.map((n, i) =>
    enrich({
      tooth: map.get(n) ?? emptyTooth(n),
      number: n,
      kind: 'dec',
      arch: archTop ? 'top' : 'bottom',
      side: i < quad.left.length ? 'left' : 'right',
      x: DEC_X0 + i * DEC_STEP,
      y: archTop ? DEC_TOP_Y : DEC_BOT_Y
    })
  );
}

function enrich(view: ToothViewBase): ToothView {
  return {
    ...view,
    labelX: view.kind === 'perm' ? view.x + CELL / 2 : view.x,
    missing: view.tooth.conditions.some(c => LOST.includes(c)),
    overlays: (view.tooth.faces ?? []).map(f => faceOverlayFor(view, f)),
    marks: wholeMarksFor(view),
    corona: coronaRectFor(view),
    ariaLabel: buildAriaLabel(view)
  };
}

function faceOverlayFor(tv: ToothViewBase, f: ToothFace): FaceOverlay {
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
        r = mesialRight(tv) ? right : left;
        break;
      default:
        r = mesialRight(tv) ? left : right;
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
        d: mesialRight(tv)
          ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`
          : `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`,
        color,
        face: f.face
      };
    default:
      return {
        kind: 'path',
        d: mesialRight(tv)
          ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`
          : `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`,
        color,
        face: f.face
      };
  }
}

function mesialRight(tv: ToothViewBase): boolean {
  return tv.side === 'left';
}

function buildSpans(row: ToothView[]): Span[] {
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

function wholeMarksFor(view: ToothViewBase): WholeMark[] {
  const conds = view.tooth.conditions.filter(c => !WHOLE_EXCLUDE.includes(c));
  const cx = view.kind === 'perm' ? view.x + CELL / 2 : view.x;
  const cy = view.kind === 'perm' ? view.y + CELL / 2 : view.y;
  return conds.map(c => {
    const big = c === 'perdida-por-caries' || c === 'perdida-otra-causa';
    const size = big ? (view.kind === 'perm' ? 30 : 26) : view.kind === 'perm' ? 27 : 24;
    return { id: c, x: cx - size / 2, y: cy - size / 2, size };
  });
}

function coronaRectFor(view: ToothViewBase): { x: number; y: number; w: number; h: number } | null {
  if (!view.tooth.conditions.includes('corona')) {
    return null;
  }
  if (view.kind === 'perm') {
    return { x: view.x - 2, y: view.y - 2, w: CELL + 4, h: CELL + 4 };
  }
  return { x: view.x - DEC_R - 2, y: view.y - DEC_R - 2, w: DEC_R * 2 + 4, h: DEC_R * 2 + 4 };
}

function buildAriaLabel(view: ToothViewBase): string {
  const conds = view.tooth.conditions.map(c => SYMBOLS[c].label);
  const faceConds = (view.tooth.faces ?? []).map(f => `${FACE_LABELS[f.face]} ${SYMBOLS[f.condition].label}`);
  const list = [...conds, ...faceConds].join(', ') || 'sana';
  const perio = [
    view.tooth.movilidad ? `movilidad ${view.tooth.movilidad}` : '',
    view.tooth.recesion ? `recesión ${view.tooth.recesion}` : ''
  ]
    .filter(Boolean)
    .join(', ');
  return `Pieza ${view.number}, ${list}${perio ? '. ' + perio : ''}. Enter para marcar con el símbolo seleccionado`;
}

function computeCounts(teeth: Tooth[]): Record<ToothCondition, number> {
  const counts = {} as Record<ToothCondition, number>;
  for (const c of SYMBOL_ORDER) {
    counts[c] = FACE_CONDITIONS.includes(c as ToothFaceCondition)
      ? teeth.filter(t => (t.faces ?? []).some(f => f.condition === c)).length
      : teeth.filter(t => t.conditions.includes(c)).length;
  }
  return counts;
}

function perioRowsFor(views: ToothView[], arch: 'top' | 'bottom'): PerioRow[] {
  const row = (
    label: string,
    aria: string,
    kind: 'movilidad' | 'recesion',
    labelY: number,
    boxY: number
  ): PerioRow => ({
    label,
    aria,
    kind,
    views,
    values: views.map(v => v.tooth[kind] ?? ''),
    labelY,
    boxY
  });
  return arch === 'top'
    ? [row('RECESIÓN', 'Recesión', 'recesion', 18, 3), row('MOVILIDAD', 'Movilidad', 'movilidad', 52, 37)]
    : [row('MOVILIDAD', 'Movilidad', 'movilidad', 418, 403), row('RECESIÓN', 'Recesión', 'recesion', 452, 437)];
}

function emptyTooth(n: number): Tooth {
  return { number: n, conditions: [] as ToothCondition[] };
}
