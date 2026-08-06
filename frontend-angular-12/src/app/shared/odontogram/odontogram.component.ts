import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import {
  Tooth,
  ToothCondition,
  ToothFace,
  ToothFaceCondition,
  ToothFaceName
} from '../../core/models/patient.model';
import {
  FACE_CONDITIONS,
  FACE_LABELS,
  FACE_ORDER,
  PERIO_CYCLE,
  SYMBOLS,
  SYMBOL_ORDER,
  SYMBOL_PREFIX
} from './odontogram.model';
import {
  buildView,
  OdontogramViewModel,
  PerioRow,
  Span,
  ToothView
} from './odontogram-view.builder';
import { OdontogramIconsService } from './odontogram-icons.service';

@Component({
  selector: 'app-odontogram',
  templateUrl: './odontogram.component.html',
  styleUrls: ['./odontogram.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdontogramComponent implements OnInit, OnChanges, OnDestroy {
  constructor(private icons: OdontogramIconsService, private cdr: ChangeDetectorRef) {}

  @Input() teeth: Tooth[] = [];
  @Output() change = new EventEmitter<Tooth[]>();

  @ViewChild('expandedPanel', { static: false }) expandedPanel: ElementRef<HTMLElement> | null = null;

  readonly order = SYMBOL_ORDER;
  readonly faces = FACE_ORDER;
  readonly symbols = SYMBOLS;
  readonly faceLabels = FACE_LABELS;
  readonly symbolPrefix = SYMBOL_PREFIX;
  private readonly zoomMin = 0.5;
  private readonly zoomMax = 3;
  private readonly zoomStep = 0.25;

  topPerm: ToothView[] = [];
  botPerm: ToothView[] = [];
  topDec: ToothView[] = [];
  botDec: ToothView[] = [];
  spanRows: Span[][] = [];
  perioRowsTop: PerioRow[] = [];
  perioRowsBottom: PerioRow[] = [];
  counts: Record<ToothCondition, number> = {} as Record<ToothCondition, number>;
  activeTool: ToothCondition | 'clear' | null = null;
  faceTarget: ToothView | null = null;
  expanded = false;
  zoom = 1;
  spriteHtml: SafeHtml | null = null;

  @HostListener('document:keydown', ['$event'])
  onDocKeydown(event: KeyboardEvent): void {
    if (this.expanded && event.key === 'Escape') {
      this.closeExpanded();
    }
  }

  ngOnInit(): void {
    this.icons.getSprite().then(
      html => {
        this.spriteHtml = html;
        this.cdr.markForCheck();
      },
      () => {
        this.spriteHtml = null;
        this.cdr.markForCheck();
      }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.teeth) {
      this.applyView(buildView(this.teeth));
    }
  }

  ngOnDestroy(): void {
    if (this.expanded) {
      document.body.style.overflow = '';
    }
  }

  private applyView(vm: OdontogramViewModel): void {
    this.topPerm = vm.topPerm;
    this.botPerm = vm.botPerm;
    this.topDec = vm.topDec;
    this.botDec = vm.botDec;
    this.spanRows = vm.spanRows;
    this.perioRowsTop = vm.perioRowsTop;
    this.perioRowsBottom = vm.perioRowsBottom;
    this.counts = vm.counts;
    const target = this.faceTarget;
    if (target) {
      const all = [...vm.topPerm, ...vm.botPerm, ...vm.topDec, ...vm.botDec];
      this.faceTarget = all.find(v => v.number === target.number) ?? null;
    }
  }

  selectTool(tool: ToothCondition | 'clear' | null): void {
    this.activeTool = this.activeTool === tool ? null : tool;
    this.faceTarget = null;
  }

  openExpanded(): void {
    this.expanded = true;
    this.zoom = 1;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
    this.expandedPanel?.nativeElement.focus();
  }

  closeExpanded(): void {
    this.expanded = false;
    document.body.style.overflow = '';
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeExpanded();
    }
  }

  zoomIn(): void {
    this.zoom = Math.min(this.zoomMax, this.zoom + this.zoomStep);
  }

  zoomOut(): void {
    this.zoom = Math.max(this.zoomMin, this.zoom - this.zoomStep);
  }

  resetZoom(): void {
    this.zoom = 1;
  }

  get zoomLabel(): string {
    return `${Math.round(this.zoom * 100)}%`;
  }

  isActive(tool: ToothCondition | 'clear' | null): boolean {
    return this.activeTool === tool;
  }

  isFaceTool(): boolean {
    const tool = this.activeTool;
    return tool !== null && tool !== 'clear' && FACE_CONDITIONS.includes(tool as ToothFaceCondition);
  }

  clickTooth(tv: ToothView): void {
    if (!this.activeTool) {
      return;
    }
    if (this.activeTool === 'clear') {
      this.change.emit([{ ...tv.tooth, conditions: [], faces: [] }]);
      return;
    }
    if (this.isFaceTool()) {
      this.faceTarget = this.faceTarget === tv ? null : tv;
      return;
    }
    this.faceTarget = null;
    if (this.activeTool === 'protesis-total') {
      this.toggleProtesisTotal(tv);
      return;
    }
    const conditions = [...tv.tooth.conditions];
    const i = conditions.indexOf(this.activeTool);
    if (i >= 0) {
      conditions.splice(i, 1);
    } else {
      conditions.push(this.activeTool);
    }
    this.change.emit([{ ...tv.tooth, conditions }]);
  }

  private toggleProtesisTotal(tv: ToothView): void {
    if (tv.kind !== 'perm') {
      return;
    }
    const arch = tv.arch === 'top' ? this.topPerm : this.botPerm;
    const on = arch.some(t => t.tooth.conditions.includes('protesis-total'));
    const updated = arch.map(t => {
      const conditions = [...t.tooth.conditions];
      const i = conditions.indexOf('protesis-total');
      if (on && i >= 0) {
        conditions.splice(i, 1);
      } else if (!on && i < 0) {
        conditions.push('protesis-total');
      }
      return { ...t.tooth, conditions };
    });
    this.change.emit(updated);
  }

  pickFace(face: ToothFaceName): void {
    const tv = this.faceTarget;
    if (!tv) {
      return;
    }
    const condition = this.activeTool as ToothFaceCondition;
    const faces: ToothFace[] = [...(tv.tooth.faces ?? [])];
    const i = faces.findIndex(f => f.face === face);
    if (i >= 0) {
      faces.splice(i, 1);
    } else {
      faces.push({ face, condition });
    }
    this.change.emit([{ ...tv.tooth, faces }]);
  }

  faceMarked(face: ToothFaceName): boolean {
    return !!this.faceTarget?.tooth.faces?.some(f => f.face === face);
  }

  faceMarkColor(face: ToothFaceName): string {
    const mark = this.faceTarget?.tooth.faces?.find(f => f.face === face);
    return mark ? SYMBOLS[mark.condition].color : '';
  }

  clickPerio(tv: ToothView, kind: 'movilidad' | 'recesion'): void {
    if (tv.missing) {
      return;
    }
    const cur = tv.tooth[kind] ?? '';
    const next = PERIO_CYCLE[(PERIO_CYCLE.indexOf(cur) + 1) % PERIO_CYCLE.length];
    this.change.emit([{ ...tv.tooth, [kind]: next }]);
  }

  colorOf(c: ToothCondition | 'clear' | null): string {
    return c && c !== 'clear' ? SYMBOLS[c].color : 'var(--odo-neutral)';
  }
}
