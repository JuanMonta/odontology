import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface PaginationState {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-compact]': 'compact'
  }
})
export class PaginationComponent {
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() pageSizes: number[] = [10, 20, 50];
  @Input() label = 'REGISTROS';
  @Input() compact = false;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get pageCount(): number {
    return this.total === 0 ? 1 : Math.ceil(this.total / this.pageSize);
  }

  get pages(): number[] {
    const count = this.pageCount;
    const current = this.clamp(this.page, 1, count);
    const window = 2;
    const start = Math.max(1, current - window);
    const end = Math.min(count, current + window);
    const list: number[] = [];
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  get firstRow(): number {
    return this.total === 0 ? 0 : (this.clamp(this.page, 1, this.pageCount) - 1) * this.pageSize + 1;
  }

  get lastRow(): number {
    return Math.min(this.clamp(this.page, 1, this.pageCount) * this.pageSize, this.total);
  }

  get canPrev(): boolean {
    return this.clamp(this.page, 1, this.pageCount) > 1;
  }

  get canNext(): boolean {
    return this.clamp(this.page, 1, this.pageCount) < this.pageCount;
  }

  onPrev(): void {
    if (this.canPrev) {
      this.pageChange.emit(this.clamp(this.page, 1, this.pageCount) - 1);
    }
  }

  onNext(): void {
    if (this.canNext) {
      this.pageChange.emit(this.clamp(this.page, 1, this.pageCount) + 1);
    }
  }

  goTo(p: number): void {
    this.pageChange.emit(this.clamp(p, 1, this.pageCount));
  }

  onSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
