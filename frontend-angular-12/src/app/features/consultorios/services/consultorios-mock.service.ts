import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Consultorio,
  ConsultorioDraft,
  ConsultorioStatus
} from '../../../core/models/consultorio.model';

@Injectable({ providedIn: 'root' })
export class ConsultoriosMockService {
  private readonly subjects = new BehaviorSubject<Consultorio[]>(this.build());

  readonly consultorios$: Observable<Consultorio[]> = this.subjects.asObservable();

  snapshot(): Consultorio[] {
    return this.subjects.getValue();
  }

  addConsultorio(draft: ConsultorioDraft): Consultorio {
    const list = this.subjects.getValue();
    const item: Consultorio = {
      ...draft,
      id: `CON-${Date.now()}`,
      code: this.nextCode(list),
      lastUse: '—',
      procedures: 0
    };
    this.subjects.next([item, ...list]);
    return item;
  }

  updateConsultorio(item: Consultorio): void {
    const list = this.subjects.getValue();
    this.subjects.next(list.map(c => (c.id === item.id ? item : c)));
  }

  toggleStatus(id: string): void {
    const list = this.subjects.getValue();
    this.subjects.next(
      list.map(c => {
        if (c.id !== id) {
          return c;
        }
        const next: Record<ConsultorioStatus, ConsultorioStatus> = {
          operativo: 'mantenimiento',
          mantenimiento: 'operativo',
          inactivo: 'operativo'
        };
        return { ...c, status: next[c.status] };
      })
    );
  }

  private nextCode(list: Consultorio[]): string {
    const base = 'CON';
    const max = list.reduce((acc, c) => {
      const n = Number(c.code.replace(base, ''));
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return `${base}-${String(max + 1).padStart(3, '0')}`;
  }

  private build(): Consultorio[] {
    return [
      {
        id: 'c1',
        code: 'CON-001',
        name: 'CONSULTORIO 01',
        unit: 'SILLÓN A',
        location: 'PISO 1 · ALA ESTE',
        equipment: ['SILLÓN DIGITAL', 'RAYOS X PANORÁMICO', 'LÁMPARA LED', 'CARIOGRAFO'],
        status: 'operativo',
        lastUse: '06 AGO 2026',
        procedures: 482
      },
      {
        id: 'c2',
        code: 'CON-002',
        name: 'CONSULTORIO 02',
        unit: 'SILLÓN B',
        location: 'PISO 1 · ALA ESTE',
        equipment: ['SILLÓN DIGITAL', 'MICROSCOPIO', 'ULTRASONIDO', 'LÁMPARA LED'],
        status: 'operativo',
        lastUse: '05 AGO 2026',
        procedures: 391
      },
      {
        id: 'c3',
        code: 'CON-003',
        name: 'CONSULTORIO 03',
        unit: 'SILLÓN C',
        location: 'PISO 1 · ALA OESTE',
        equipment: ['SILLÓN DIGITAL', 'RAYOS X PERIAPICAL', 'LÁMPARA LED'],
        status: 'mantenimiento',
        lastUse: '01 AGO 2026',
        procedures: 214
      },
      {
        id: 'c4',
        code: 'CON-004',
        name: 'SALA DE PROCEDIMIENTOS',
        unit: 'SILLÓN D',
        location: 'PISO 2 · ALA NORTE',
        equipment: ['SILLÓN DE CIRUGÍA', 'RAYOS X CEFALOMÉTRICO', 'MONITOR DE SEDACIÓN', 'ASPIRADOR QUIRÚRGICO'],
        status: 'operativo',
        lastUse: '04 AGO 2026',
        procedures: 158
      },
      {
        id: 'c5',
        code: 'CON-005',
        name: 'CONSULTORIO 05',
        unit: 'SILLÓN E',
        location: 'PISO 2 · ALA NORTE',
        equipment: ['SILLÓN DIGITAL', 'LÁMPARA LED'],
        status: 'inactivo',
        lastUse: '12 JUL 2026',
        procedures: 96
      },
      {
        id: 'c6',
        code: 'CON-006',
        name: 'LABORATORIO CLÍNICO',
        unit: 'MÓDULO DE LABORATORIO',
        location: 'PISO 2 · ALA SUR',
        equipment: ['ESCÁNER INTRAORAL', 'FRESADORA', 'HORNO DE CERÁMICA', 'BANCO DE TRABAJO'],
        status: 'operativo',
        lastUse: '05 AGO 2026',
        procedures: 127
      }
    ];
  }
}
