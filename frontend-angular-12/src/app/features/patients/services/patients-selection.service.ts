import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Conserva en sesión el paciente seleccionado en el directorio. Al navegar al
 * detalle (/pacientes/:id) la página se destruye y su estado local se pierde;
 * este servicio mantiene la selección viva para restaurarla al regresar.
 */
@Injectable({ providedIn: 'root' })
export class PatientsSelectionService {
  private readonly selectedId = new BehaviorSubject<string | null>(null);

  readonly selectedId$: Observable<string | null> = this.selectedId.asObservable();

  get value(): string | null {
    return this.selectedId.getValue();
  }

  select(id: string | null): void {
    this.selectedId.next(id);
  }
}