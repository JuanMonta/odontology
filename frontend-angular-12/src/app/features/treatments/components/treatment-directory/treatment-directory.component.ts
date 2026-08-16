import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Treatment } from '../../../../core/models/treatment.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';

@Component({
  selector: 'app-treatment-directory',
  templateUrl: './treatment-directory.component.html',
  styleUrls: ['./treatment-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentDirectoryComponent extends PaginatedListComponent {
  @Input() treatments: Treatment[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Treatment>();

  protected get totalItems(): number {
    return this.treatments.length;
  }

  get visibleTreatments(): Treatment[] {
    return this.slice(this.treatments) as Treatment[];
  }

  money(price: number): string {
    return `$ ${price.toLocaleString('en-US')}`;
  }
}
