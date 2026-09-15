import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface PatientsPageState {
  page: number;
  pageSize: number;
  scrollTop: number;
  selectedId: string | null;
}

const STORAGE_KEY = 'saas.patients.pageState';

function readState(): PatientsPageState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        page: parsed.page ?? 1,
        pageSize: parsed.pageSize ?? 15,
        scrollTop: parsed.scrollTop ?? 0,
        selectedId: parsed.selectedId ?? null
      };
    }
  } catch {}
  return { page: 1, pageSize: 15, scrollTop: 0, selectedId: null };
}

function writeState(state: PatientsPageState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Conserva en sesión el estado completo de la página de pacientes:
 * - paciente seleccionado (para restaurar panel al volver)
 * - página actual de la tabla
 * - scroll vertical de la tabla
 */
@Injectable({ providedIn: 'root' })
export class PatientsSelectionService {
  private readonly stateSubject = new BehaviorSubject<PatientsPageState>(readState());

  readonly state$: Observable<PatientsPageState> = this.stateSubject.asObservable();

  get value(): PatientsPageState {
    return this.stateSubject.getValue();
  }

  get selectedId(): string | null {
    return this.stateSubject.getValue().selectedId;
  }

  select(id: string | null): void {
    const s = this.stateSubject.getValue();
    const next = { ...s, selectedId: id };
    this.stateSubject.next(next);
    writeState(next);
  }

  setPage(page: number): void {
    const s = this.stateSubject.getValue();
    const next = { ...s, page };
    this.stateSubject.next(next);
    writeState(next);
  }

  setScrollTop(scrollTop: number): void {
    const s = this.stateSubject.getValue();
    const next = { ...s, scrollTop };
    this.stateSubject.next(next);
    writeState(next);
  }

  setState(patch: Partial<PatientsPageState>): void {
    const s = this.stateSubject.getValue();
    const next = { ...s, ...patch };
    this.stateSubject.next(next);
    writeState(next);
  }

  /** Limpia solo la selección (al crear paciente nuevo, p.ej.) */
  clearSelection(): void {
    const s = this.stateSubject.getValue();
    const next = { ...s, selectedId: null };
    this.stateSubject.next(next);
    writeState(next);
  }
}