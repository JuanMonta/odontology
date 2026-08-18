export type TreatmentCategory = string;

export interface Treatment {
  id: string;
  code: string;
  name: string;
  categoryCode: string;
  category: TreatmentCategory;
  durationMin: number;
  price: number;
  active: boolean;
  description: string;
  usage: number;
  consultorios: string[]; // códigos de consultorios donde está disponible
}

export type TreatmentDraft = Omit<Treatment, 'id' | 'code' | 'usage' | 'category'>;
