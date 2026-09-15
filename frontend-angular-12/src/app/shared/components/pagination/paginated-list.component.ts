import { AfterViewInit, Directive, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ListState, readListState, saveListState } from './list-state';

/**
 * Lógica de paginación compartida por las tablas del sistema (directorios,
 * agenda y cola de espera). Cada tabla declara {@code totalItems} y un getter
 * que recorta su lista con {@code page}/{@code pageSize}.
 *
 * Si se establece {@code persistKey}, la página, el tamaño de página y el scroll
 * del primer contenedor {@code .dir-list} se conservan en sessionStorage
 * (`saas.<persistKey>.listState`) y se restauran al volver a la ruta.
 */
@Directive()
export abstract class PaginatedListComponent implements OnChanges, OnDestroy, AfterViewInit {
  page = 1;
  pageSize = 10;
  pageSizes = [10, 20, 50];

  @Input() persistKey = '';

  protected abstract get totalItems(): number;

  private scrollEl: HTMLElement | null = null;
  private readonly onScrollBound = () => {
    if (this.persistKey && this.scrollEl) {
      this.saveState(this.scrollEl.scrollTop);
    }
  };

  /** Adjunta el contenedor de scroll de la lista (`.dir-list` o similar). */
  protected bindScroll(el: HTMLElement | null): void {
    if (this.scrollEl) {
      this.scrollEl.removeEventListener('scroll', this.onScrollBound);
    }
    this.scrollEl = el;
    if (el) {
      el.addEventListener('scroll', this.onScrollBound, { passive: true });
      this.restoreScroll(el);
    }
  }

  private restoreScroll(el: HTMLElement): void {
    const saved = readListState(this.persistKey);
    if (!saved || !saved.scrollTop) { return; }
    const target = saved.scrollTop;
    const tryIt = (attempt = 0) => {
      // Espera a que el contenido esté renderizado antes de aplicar el offset,
      // si no el navegador lo resetea a top tras la carga asíncrona.
      if (el.scrollHeight > el.clientHeight || attempt > 10) {
        el.scrollTop = target;
      } else {
        setTimeout(() => tryIt(attempt + 1), 30);
      }
    };
    requestAnimationFrame(() => tryIt());
  }

  ngOnChanges(_changes: SimpleChanges): void {
    const count = this.pageCount;
    if (this.page > count) {
      this.page = count;
    }
    const saved = readListState(this.persistKey);
    if (saved && this.persistKey && saved.page !== this.page) {
      this.page = saved.page;
      this.pageSize = saved.pageSize;
    }
  }

  ngAfterViewInit(): void {
    // Restaura scroll una vez renderizada la lista. Las subclases llaman
    // bindScroll() desde su propio ngAfterViewInit si no usan .dir-list.
  }

  ngOnDestroy(): void {
    if (this.scrollEl) {
      this.scrollEl.removeEventListener('scroll', this.onScrollBound);
    }
  }

  get pageCount(): number {
    return this.totalItems === 0 ? 1 : Math.ceil(this.totalItems / this.pageSize);
  }

  goToPage(page: number): void {
    this.page = Math.min(Math.max(page, 1), this.pageCount);
    this.saveState(this.scrollEl?.scrollTop ?? 0);
  }

  setPageSize(size: number): void {
    if (size !== this.pageSize) {
      this.pageSize = size;
      this.page = 1;
      this.saveState(0);
    }
  }

  protected saveState(scrollTop: number): void {
    if (!this.persistKey) { return; }
    saveListState(this.persistKey, { page: this.page, pageSize: this.pageSize, scrollTop });
  }

  /** Recorta la lista completa para la página actual. */
  protected slice(items: readonly unknown[]): unknown[] {
    const start = (this.page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }
}