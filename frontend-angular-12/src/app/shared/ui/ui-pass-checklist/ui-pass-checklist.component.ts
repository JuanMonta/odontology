import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

export interface PassRule {
  id: 'longitud' | 'mayuscula' | 'numero' | 'simbolo';
  label: string;
  ok: boolean;
}

/**
 * Checklist de clave segura en vivo (patrón "checklist while typing").
 * Evalúa las mismas 4 reglas que exige el backend
 * (RecuperacionClaveService.validarNuevaClave): 8+ caracteres, 1 mayúscula,
 * 1 número y 1 símbolo. Emite la validez agregada para bloquear el submit.
 */
@Component({
  selector: 'ui-pass-checklist',
  templateUrl: './ui-pass-checklist.component.html',
  styleUrls: ['./ui-pass-checklist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiPassChecklistComponent implements OnChanges {
  @Input() password: string | null = null;
  @Output() validityChange = new EventEmitter<boolean>();

  rules: PassRule[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.password) {
      this.evaluate();
    }
  }

  static check(value: string | null): PassRule[] {
    const v = value ?? '';
    return [
      { id: 'mayuscula', label: '1 MAYÚSCULA', ok: /[A-ZÁÉÍÓÚÑÜ]/.test(v) },
      { id: 'longitud', label: '8+ CARACTERES', ok: v.length >= 8 },
      { id: 'numero', label: '1 NÚMERO', ok: /\d/.test(v) },
      { id: 'simbolo', label: '1 SÍMBOLO', ok: /[^A-Za-z0-9]/.test(v) }
    ];
  }

  static isValid(value: string | null): boolean {
    return UiPassChecklistComponent.check(value).every(r => r.ok);
  }

  private evaluate(): void {
    this.rules = UiPassChecklistComponent.check(this.password);
    this.validityChange.emit(this.rules.every(r => r.ok));
  }
}
