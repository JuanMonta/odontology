import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ClinicMessage, MessageDraft } from '../../../../core/models/message.model';
import { MessagesHttpService } from '../../services/messages-http.service';

type StatusFilter = 'all' | 'unread' | 'urgente' | 'importante';

@Component({
  selector: 'app-messages-page',
  templateUrl: './messages-page.component.html',
  styleUrls: ['./messages-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessagesPageComponent implements OnInit, OnDestroy {
  messages$: Observable<ClinicMessage[]>;
  selected$: Observable<ClinicMessage | null>;

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<StatusFilter>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private service: MessagesHttpService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.messages$ = combineLatest([this.service.messages$, this.search$, this.status$]).pipe(
      map(([list, q, filter]) => {
        const query = q.trim().toUpperCase();
        return list.filter(m => {
          const matchesStatus =
            filter === 'all' ||
            (filter === 'unread' && m.status === 'unread') ||
            (filter === 'urgente' && m.prioridad === 'urgente') ||
            (filter === 'importante' && m.prioridad === 'importante');
          const matchesQuery =
            !query ||
            m.subject.toUpperCase().includes(query) ||
            m.from.toUpperCase().includes(query) ||
            m.destino.toUpperCase().includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([this.service.messages$, this.selectedId$]).pipe(
      map(([list, id]) => (id ? list.find(m => m.id === id) ?? null : null))
    );
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params.get('nuevo')) {
        this.startCreate();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(q: string): void {
    this.search$.next(q);
  }

  onFilter(f: StatusFilter): void {
    this.status$.next(f);
  }

  onSelect(message: ClinicMessage): void {
    this.selectedId = message.id;
    this.selectedId$.next(message.id);
    this.creating = false;
    if (message.status === 'unread') {
      this.service.markRead(message.id);
    }
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  onSaved(draft: MessageDraft): void {
    this.service.sendMessage(draft).subscribe(created => {
      this.creating = false;
      this.onSelect(created);
      this.router.navigate([], { queryParams: {} });
    });
  }

  cancelCreate(): void {
    this.creating = false;
  }

  onClosePanel(): void {
    this.selectedId = null;
    this.selectedId$.next(null);
  }
}
