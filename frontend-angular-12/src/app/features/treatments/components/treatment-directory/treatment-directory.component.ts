import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Treatment } from '../../../../core/models/treatment.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';
import { formatMoney } from '../../../../core/utils/format';

@Component({
  selector: 'app-treatment-directory',
  templateUrl: './treatment-directory.component.html',
  styleUrls: ['./treatment-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentDirectoryComponent extends PaginatedListComponent implements AfterViewInit {
  @Input() treatments: Treatment[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Treatment>();
  @ViewChild('dirList') dirListRef?: ElementRef<HTMLDivElement>;

  protected get totalItems(): number {
    return this.treatments.length;
  }

  get visibleTreatments(): Treatment[] {
    return this.slice(this.treatments) as Treatment[];
  }

  money(price: number): string {
    return formatMoney(price);
  }

  ngAfterViewInit(): void {
    if (this.persistKey) {
      this.bindScroll(this.dirListRef?.nativeElement ?? null);
    }
  }
}
