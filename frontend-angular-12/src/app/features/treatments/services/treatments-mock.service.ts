import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Treatment,
  TreatmentCategory,
  TreatmentDraft
} from '../../../core/models/treatment.model';

export const TREATMENT_CATEGORIES: TreatmentCategory[] = [
  'DIAGNÓSTICO',
  'PREVENCIÓN',
  'RESTAURADORA',
  'ENDODONCIA',
  'PERIODONCIA',
  'ORTODONCIA',
  'CIRUGÍA',
  'PRÓTESIS',
  'ESTÉTICA',
  'EMERGENCIA'
];

@Injectable({ providedIn: 'root' })
export class TreatmentsMockService {
  private readonly subjects = new BehaviorSubject<Treatment[]>(this.build());

  readonly treatments$: Observable<Treatment[]> = this.subjects.asObservable();

  addTreatment(draft: TreatmentDraft): Treatment {
    const list = this.subjects.getValue();
    const item: Treatment = {
      ...draft,
      id: `TRT-${Date.now()}`,
      code: this.nextCode(list),
      usage: 0
    };
    this.subjects.next([item, ...list]);
    return item;
  }

  updateTreatment(item: Treatment): void {
    const list = this.subjects.getValue();
    this.subjects.next(list.map(t => (t.id === item.id ? item : t)));
  }

  toggleActive(id: string): void {
    const list = this.subjects.getValue();
    this.subjects.next(list.map(t => (t.id === id ? { ...t, active: !t.active } : t)));
  }

  money(price: number): string {
    return `$ ${price.toLocaleString('en-US')}`;
  }

  private nextCode(list: Treatment[]): string {
    const base = 'TRT';
    const max = list.reduce((acc, t) => {
      const n = Number(t.code.replace(base, ''));
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return `${base}-${String(max + 1).padStart(3, '0')}`;
  }

  private build(): Treatment[] {
    return [
      {
        id: 't1',
        code: 'TRT-001',
        name: 'LIMPIEZA Y PROFILAXIS',
        category: 'PREVENCIÓN',
        durationMin: 30,
        price: 90,
        active: true,
        description: 'REMOCIÓN DE PLACA Y SARRO CON ULTRASONIDO Y PULIDO FINAL.',
        usage: 12
      },
      {
        id: 't2',
        code: 'TRT-002',
        name: 'OBTURACIÓN COMPUESTA',
        category: 'RESTAURADORA',
        durationMin: 45,
        price: 180,
        active: true,
        description: 'RELLENO ESTÉTICO DE CARIES EN RESINA COMPUESTA.',
        usage: 24
      },
      {
        id: 't3',
        code: 'TRT-003',
        name: 'CONSULTA DE CONTROL',
        category: 'DIAGNÓSTICO',
        durationMin: 15,
        price: 60,
        active: true,
        description: 'EVALUACIÓN Y SEGUIMIENTO DE TRATAMIENTO EN CURSO.',
        usage: 31
      },
      {
        id: 't4',
        code: 'TRT-004',
        name: 'RADIOGRAFÍA PANORÁMICA',
        category: 'DIAGNÓSTICO',
        durationMin: 10,
        price: 120,
        active: true,
        description: 'IMAGEN RADIOLÓGICA DE ARCO COMPLETO PARA DIAGNÓSTICO.',
        usage: 18
      },
      {
        id: 't5',
        code: 'TRT-005',
        name: 'TRATAMIENTO DE CONDUCTO · MOLAR',
        category: 'ENDODONCIA',
        durationMin: 90,
        price: 650,
        active: true,
        description: 'ENDODONCIA EN PIEZA MOLAR CON RECONSTRUCCIÓN CORONAL.',
        usage: 6
      },
      {
        id: 't6',
        code: 'TRT-006',
        name: 'BLANQUEAMIENTO DENTAL',
        category: 'ESTÉTICA',
        durationMin: 60,
        price: 450,
        active: true,
        description: 'BLANQUEAMIENTO CON GEL DE PERÓXIDO EN SESIÓN ÚNICA.',
        usage: 9
      },
      {
        id: 't7',
        code: 'TRT-007',
        name: 'EXODONCIA SIMPLE',
        category: 'CIRUGÍA',
        durationMin: 30,
        price: 250,
        active: true,
        description: 'EXTRACCIÓN DE PIEZA DENTAL NO COMPLEJA.',
        usage: 5
      },
      {
        id: 't8',
        code: 'TRT-008',
        name: 'IMPLANTE UNITARIO',
        category: 'CIRUGÍA',
        durationMin: 120,
        price: 2200,
        active: true,
        description: 'IMPLANTE DE TITANIO CON CORONA DEFINITIVA SOBRE ÉL.',
        usage: 3
      },
      {
        id: 't9',
        code: 'TRT-009',
        name: 'CARILLA DE PORCELANA',
        category: 'ESTÉTICA',
        durationMin: 90,
        price: 800,
        active: true,
        description: 'CARILLA LAMINADA DE PORCELANA POR PIEZA.',
        usage: 4
      },
      {
        id: 't10',
        code: 'TRT-010',
        name: 'CORONA METAL-PORCELANA',
        category: 'PRÓTESIS',
        durationMin: 60,
        price: 900,
        active: false,
        description: 'CORONA SOBRE MUÑÓN PREPARADO CON NÚCLEO METÁLICO.',
        usage: 2
      },
      {
        id: 't11',
        code: 'TRT-011',
        name: 'RASPADO Y ALISADO RADICULAR',
        category: 'PERIODONCIA',
        durationMin: 60,
        price: 320,
        active: true,
        description: 'TERAPIA PERIODONTAL POR CUADRANTE.',
        usage: 7
      },
      {
        id: 't12',
        code: 'TRT-012',
        name: 'ORTODONCIA · ALINEADORES',
        category: 'ORTODONCIA',
        durationMin: 60,
        price: 3500,
        active: true,
        description: 'PLAN COMPLETO DE ALINEADORES POR TRATAMIENTO.',
        usage: 1
      },
      {
        id: 't13',
        code: 'TRT-013',
        name: 'SELLANTES DE FOSAS Y FISURAS',
        category: 'PREVENCIÓN',
        durationMin: 20,
        price: 70,
        active: false,
        description: 'SELLADO PREVENTIVO EN PIEZAS POSTERIORES.',
        usage: 11
      },
      {
        id: 't14',
        code: 'TRT-014',
        name: 'URGENCIA ODONTOLÓGICA',
        category: 'EMERGENCIA',
        durationMin: 20,
        price: 120,
        active: true,
        description: 'ATENCIÓN DE URGENCIA CON ALIVIO INMEDIATO DEL DOLOR.',
        usage: 8
      }
    ];
  }
}
