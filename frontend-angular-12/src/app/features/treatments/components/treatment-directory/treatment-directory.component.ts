import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Treatment } from '../../../../core/models/treatment.model';

@Component({
  selector: 'app-treatment-directory',
  templateUrl: './treatment-directory.component.html',
  styleUrls: ['./treatment-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentDirectoryComponent {
  @Input() treatments: Treatment[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Treatment>();

  money(price: number): string {
    return `S/ ${price.toLocaleString('es-PE')}`;
  }
}
