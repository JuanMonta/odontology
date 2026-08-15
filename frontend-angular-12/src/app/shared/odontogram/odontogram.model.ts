import { ToothCondition, ToothFaceCondition, ToothFaceName } from '../../core/models/patient.model';

export interface ToothSymbolMeta {
  label: string;
  color: string;
}

export const PERM_TOP = {
  left: [18, 17, 16, 15, 14, 13, 12, 11],
  right: [21, 22, 23, 24, 25, 26, 27, 28]
};

export const PERM_BOTTOM = {
  left: [48, 47, 46, 45, 44, 43, 42, 41],
  right: [31, 32, 33, 34, 35, 36, 37, 38]
};

export const DEC_TOP = {
  left: [55, 54, 53, 52, 51],
  right: [61, 62, 63, 64, 65]
};

export const DEC_BOTTOM = {
  left: [85, 84, 83, 82, 81],
  right: [71, 72, 73, 74, 75]
};

export const SYMBOL_PREFIX = 's-';

export const FACE_CONDITIONS: ToothFaceCondition[] = ['caries', 'obturado'];

export const TOOTH_NUMBERS = [
  ...PERM_TOP.left,
  ...PERM_TOP.right,
  ...PERM_BOTTOM.left,
  ...PERM_BOTTOM.right,
  ...DEC_TOP.left,
  ...DEC_TOP.right,
  ...DEC_BOTTOM.left,
  ...DEC_BOTTOM.right
];

export const SYMBOLS: Record<ToothCondition, ToothSymbolMeta> = {
  caries: { label: 'CARIES', color: 'var(--odo-needed)' },
  obturado: { label: 'OBTURADO', color: 'var(--odo-done)' },
  endodoncia: { label: 'ENDODONCIA', color: 'var(--odo-needed)' },
  'endodoncia-realizada': { label: 'ENDODONCIA REAL.', color: 'var(--odo-done)' },
  corona: { label: 'CORONA', color: 'var(--odo-done)' },
  extraccion: { label: 'EXTRACCIÓN', color: 'var(--odo-needed)' },
  'sellante-necesario': { label: 'SELLANTE NEC.', color: 'var(--odo-needed)' },
  'sellante-realizado': { label: 'SELLANTE REAL.', color: 'var(--odo-done)' },
  'protesis-fija': { label: 'PRÓTESIS FIJA', color: 'var(--odo-done)' },
  'protesis-removible': { label: 'PRÓTESIS REM.', color: 'var(--odo-done)' },
  'protesis-total': { label: 'PRÓTESIS TOTAL', color: 'var(--odo-done)' },
  'perdida-por-caries': { label: 'PÉRD. CARIES', color: 'var(--odo-done)' },
  'perdida-otra-causa': { label: 'PÉRD. OTRA CAUSA', color: 'var(--odo-done)' }
};

export const SYMBOL_ORDER: ToothCondition[] = [
  'caries',
  'obturado',
  'endodoncia',
  'endodoncia-realizada',
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

export const FACE_LABELS: Record<ToothFaceName, string> = {
  oclusal: 'OCLUSAL',
  mesial: 'MESIAL',
  distal: 'DISTAL',
  vestibular: 'VESTIBULAR',
  lingual: 'LINGUAL'
};

export const PERIO_CYCLE = ['', 'X', '1', '2', '3', '4'];

export const LOST: ToothCondition[] = ['perdida-por-caries', 'perdida-otra-causa'];

export const WHOLE_EXCLUDE: ToothCondition[] = [
  'caries',
  'obturado',
  'protesis-fija',
  'protesis-removible',
  'protesis-total'
];
