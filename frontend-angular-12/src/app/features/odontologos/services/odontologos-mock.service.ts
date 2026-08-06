import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Odontologo,
  OdontologoDraft,
  OdontologoStatus
} from '../../../core/models/odontologo.model';

export const SPECIALTIES: string[] = [
  'CIRUGÍA ORAL',
  'ORTODONCIA',
  'PERIODONCIA',
  'ENDODONCIA',
  'ODONTOPEDIATRÍA',
  'REHABILITACIÓN ORAL'
];

@Injectable({ providedIn: 'root' })
export class OdontologosMockService {
  private readonly subjects = new BehaviorSubject<Odontologo[]>(this.build());

  readonly odontologos$: Observable<Odontologo[]> = this.subjects.asObservable();

  snapshot(): Odontologo[] {
    return this.subjects.getValue();
  }

  addOdontologo(draft: OdontologoDraft): Odontologo {
    const list = this.subjects.getValue();
    const item: Odontologo = {
      ...draft,
      id: `odo-${Date.now()}`,
      code: this.nextCode(list),
      experience: 0,
      procedures: 0
    };
    this.subjects.next([item, ...list]);
    return item;
  }

  updateOdontologo(item: Odontologo): void {
    const list = this.subjects.getValue();
    this.subjects.next(list.map(o => (o.id === item.id ? item : o)));
  }

  toggleStatus(id: string): void {
    const list = this.subjects.getValue();
    this.subjects.next(
      list.map(o => {
        if (o.id !== id) {
          return o;
        }
        const next: Record<OdontologoStatus, OdontologoStatus> = {
          activo: 'ausente',
          ausente: 'activo',
          inactivo: 'activo'
        };
        return { ...o, status: next[o.status] };
      })
    );
  }

  private nextCode(list: Odontologo[]): string {
    const base = 'ODO';
    const max = list.reduce((acc, o) => {
      const n = Number(o.code.replace(base, ''));
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return `${base}-${String(max + 1).padStart(3, '0')}`;
  }

  private build(): Odontologo[] {
    return [
      {
        id: 'o1',
        code: 'ODO-001',
        name: 'DR. RIVERA',
        specialty: 'CIRUGÍA ORAL',
        license: 'COP 12453',
        consultorio: 'CON-001',
        turno: 'COMPLETO',
        status: 'activo',
        experience: 14,
        procedures: 126
      },
      {
        id: 'o2',
        code: 'ODO-002',
        name: 'DRA. TORRES',
        specialty: 'ORTODONCIA',
        license: 'COP 10988',
        consultorio: 'CON-002',
        turno: 'MAÑANA',
        status: 'activo',
        experience: 9,
        procedures: 94
      },
      {
        id: 'o3',
        code: 'ODO-003',
        name: 'DR. VEGA',
        specialty: 'ENDODONCIA',
        license: 'COP 13014',
        consultorio: 'CON-003',
        turno: 'TARDE',
        status: 'ausente',
        experience: 11,
        procedures: 58
      },
      {
        id: 'o4',
        code: 'ODO-004',
        name: 'DRA. MENDOZA',
        specialty: 'PERIODONCIA',
        license: 'COP 14221',
        consultorio: 'CON-005',
        turno: 'COMPLETO',
        status: 'activo',
        experience: 6,
        procedures: 71
      },
      {
        id: 'o5',
        code: 'ODO-005',
        name: 'DR. SÁNCHEZ',
        specialty: 'ODONTOPEDIATRÍA',
        license: 'COP 11892',
        consultorio: 'CON-004',
        turno: 'MAÑANA',
        status: 'inactivo',
        experience: 4,
        procedures: 0
      },
      {
        id: 'o6',
        code: 'ODO-006',
        name: 'DRA. CASTRO',
        specialty: 'REHABILITACIÓN ORAL',
        license: 'COP 15670',
        consultorio: 'CON-006',
        turno: 'TARDE',
        status: 'activo',
        experience: 8,
        procedures: 63
      }
    ];
  }
}
