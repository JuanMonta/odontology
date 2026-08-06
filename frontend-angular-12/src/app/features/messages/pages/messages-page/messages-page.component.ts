import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClinicMessage, MessageDraft } from '../../../../core/models/message.model';
import { MessagesMockService } from '../../services/messages-mock.service';

type StatusFilter = 'all' | 'unread' | 'urgent';

@Component({
  selector: 'app-messages-page',
  templateUrl: './messages-page.component.html',
  styleUrls: ['./messages-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessagesPageComponent implements OnInit {
  messages$: Observable<ClinicMessage[]>;
  selected$: Observable<ClinicMessage | null>;

  selectedId: string | null = null;
  creating = false;

  private readonly search$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<StatusFilter>('all');
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);

  constructor(
    private service: MessagesMockService,
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
            (filter === 'urgent' && m.urgent);
          const matchesQuery =
            !query ||
            m.subject.toUpperCase().includes(query) ||
            m.from.toUpperCase().includes(query);
          return matchesStatus && matchesQuery;
        });
      })
    );
    this.selected$ = combineLatest([this.service.messages$, this.selectedId$]).pipe(
      map(([list, id]) => (id ? list.find(m => m.id === id) ?? null : null))
    );
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('nuevo')) {
        this.startCreate();
      }
    });
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
    const created = this.service.sendMessage(draft);
    this.creating = false;
    this.onSelect(created);
    this.router.navigate([], { queryParams: {} });
  }

  cancelCreate(): void {
    this.creating = false;
  }

  onClosePanel(): void {
    this.selectedId = null;
    this.selectedId$.next(null);
  }
}
