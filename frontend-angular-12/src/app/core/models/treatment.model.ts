export type TreatmentCategory =
  | 'DIAGNÓSTICO'
  | 'PREVENCIÓN'
  | 'RESTAURADORA'
  | 'ENDODONCIA'
  | 'PERIODONCIA'
  | 'ORTODONCIA'
  | 'CIRUGÍA'
  | 'PRÓTESIS'
  | 'ESTÉTICA'
  | 'EMERGENCIA';

export interface Treatment {
  id: string;
  code: string;
  name: string;
  category: TreatmentCategory;
  durationMin: number;
  price: number;
  active: boolean;
  description: string;
  usage: number;
  consultorios: string[]; // códigos de consultorios donde está disponible
}

export type TreatmentDraft = Omit<Treatment, 'id' | 'code' | 'usage'>;
