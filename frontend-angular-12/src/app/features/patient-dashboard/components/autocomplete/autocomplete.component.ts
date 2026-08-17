import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) {
    return n;
  }
  if (n === 0) {
    return m;
  }
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteComponent implements OnInit, OnChanges, OnDestroy {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() options: string[] = [];
  @Input() value = '';
  /** Cuántas sugerencias se muestran por lote (inicial y al hacer scroll). */
  @Input() pageSize = 8;
  @Output() valueChange = new EventEmitter<string>();
  @Output() select = new EventEmitter<string>();

  @ViewChild('listEl') listEl?: ElementRef<HTMLElement>;

  open = false;
  activeIndex = -1;

  /** Todas las opciones candidatas (filtradas y ordenadas). */
  private filtered: string[] = [];
  /** Cuántas de `filtered` están renderizadas en este momento. */
  visibleCount = 0;
  private focused = false;

  private readonly query$ = new BehaviorSubject<string>('');
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  get suggestions(): string[] {
    return this.filtered.slice(0, this.visibleCount);
  }

  get hasMore(): boolean {
    return this.visibleCount < this.filtered.length;
  }

  ngOnInit(): void {
    this.query$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => this.filter(query));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this.filter(this.query$.getValue());
    }
    if (changes.value && !((changes.value.currentValue as string) || '').trim() && this.query$.getValue().trim()) {
      this.query$.next('');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(value: string): void {
    this.valueChange.emit(value);
    this.query$.next(value);
  }

  onFocus(): void {
    this.focused = true;
    if (!this.query$.getValue().trim()) {
      this.filtered = [...this.options];
      this.visibleCount = Math.min(this.pageSize, this.filtered.length);
    }
    this.open = this.filtered.length > 0;
    this.activeIndex = -1;
    this.cdr.markForCheck();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.move(-1);
    } else if (event.key === 'Enter') {
      if (this.open && this.activeIndex >= 0) {
        event.preventDefault();
        this.choose(this.suggestions[this.activeIndex]);
      }
    } else if (event.key === 'Escape') {
      this.open = false;
      this.cdr.markForCheck();
    }
  }

  onBlur(): void {
    this.focused = false;
    setTimeout(() => {
      this.open = false;
      this.cdr.markForCheck();
    }, 120);
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      this.loadMore();
    }
  }

  choose(option: string): void {
    this.valueChange.emit(option);
    this.select.emit(option);
    this.open = false;
    this.activeIndex = -1;
    this.cdr.markForCheck();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private move(delta: number): void {
    if (this.suggestions.length === 0) {
      return;
    }
    this.activeIndex = (this.activeIndex + delta + this.suggestions.length) % this.suggestions.length;
    this.open = true;
    this.cdr.markForCheck();
    const items = this.listEl?.nativeElement.querySelectorAll('.ac-item');
    (items?.[this.activeIndex] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
  }

  private loadMore(): void {
    if (!this.hasMore) {
      return;
    }
    this.visibleCount = Math.min(this.visibleCount + this.pageSize, this.filtered.length);
    this.cdr.markForCheck();
  }

  private filter(query: string): void {
    const q = normalize(query.trim());
    if (!q) {
      this.filtered = [...this.options];
      this.visibleCount = Math.min(this.pageSize, this.filtered.length);
      this.open = this.focused && this.filtered.length > 0;
      this.activeIndex = -1;
      this.cdr.markForCheck();
      return;
    }
    const maxDist = Math.max(1, Math.floor(q.length / 3));
    const scored = this.options
      .map(option => this.score(option, q, maxDist))
      .filter((entry): entry is { option: string; score: number } => entry !== null);
    scored.sort((a, b) => a.score - b.score);
    this.filtered = scored.map(entry => entry.option);
    this.visibleCount = Math.min(this.pageSize, this.filtered.length);
    this.open = this.filtered.length > 0;
    this.activeIndex = -1;
    this.cdr.markForCheck();
  }

  private score(
    option: string,
    q: string,
    maxDist: number
  ): { option: string; score: number } | null {
    const o = normalize(option);
    if (o === q) {
      return { option, score: 0 };
    }
    if (o.startsWith(q)) {
      return { option, score: 1 };
    }
    if (o.includes(q)) {
      return { option, score: 2 };
    }
    const dist = levenshtein(o, q);
    return dist <= maxDist ? { option, score: 3 + dist } : null;
  }
}