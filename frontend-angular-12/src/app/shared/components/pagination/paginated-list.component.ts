import { Directive, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Lógica de paginación compartida por las tablas del sistema (directorios,
 * agenda y cola de espera). Cada tabla declara {@code totalItems} y un getter
 * que recorta su lista con {@code page}/{@code pageSize}.
 */
@Directive()
export abstract class PaginatedListComponent implements OnChanges {
  page = 1;
  pageSize = 10;
  pageSizes = [10, 20, 50];

  protected abstract get totalItems(): number;

  get pageCount(): number {
    return this.totalItems === 0 ? 1 : Math.ceil(this.totalItems / this.pageSize);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    const count = this.pageCount;
    if (this.page > count) {
      this.page = count;
    }
  }

  goToPage(page: number): void {
    this.page = Math.min(Math.max(page, 1), this.pageCount);
  }

  setPageSize(size: number): void {
    if (size !== this.pageSize) {
      this.pageSize = size;
      this.page = 1;
    }
  }

  /** Recorta la lista completa para la página actual. */
  protected slice(items: readonly unknown[]): unknown[] {
    const start = (this.page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }
}
