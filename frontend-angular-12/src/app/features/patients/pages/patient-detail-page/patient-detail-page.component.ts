import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Patient, PatientDetail, Tooth } from '../../../../core/models/patient.model';
import { PatientsHttpService } from '../../services/patients-http.service';

type WsTab = 'odonto' | 'hcl033';

const DETAIL_STATE_KEY = 'saas.patients.detailState';

interface DetailState {
  tab: WsTab;
  hclSection: number;
  hclScrollTop: number;
  odontoScrollTop: number;
  hclSectionScrolls?: Record<number, number>;
}

function readDetailState(): DetailState {
  try {
    const raw = sessionStorage.getItem(DETAIL_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tab: parsed.tab ?? 'odonto',
        hclSection: parsed.hclSection ?? 1,
        hclScrollTop: parsed.hclScrollTop ?? 0,
        odontoScrollTop: parsed.odontoScrollTop ?? 0,
        hclSectionScrolls: parsed.hclSectionScrolls ?? {}
      };
    }
  } catch {}
  return { tab: 'odonto', hclSection: 1, hclScrollTop: 0, odontoScrollTop: 0, hclSectionScrolls: {} };
}

function writeDetailState(state: DetailState): void {
  try {
    sessionStorage.setItem(DETAIL_STATE_KEY, JSON.stringify(state));
  } catch {}
}

@Component({
  selector: 'app-patient-detail-page',
  templateUrl: './patient-detail-page.component.html',
  styleUrls: ['./patient-detail-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientDetailPageComponent implements OnInit, AfterViewInit, OnDestroy {
  patient: Patient | null = null;
  detail$: Observable<PatientDetail> | null = null;
  tab: WsTab = 'odonto';
  hclSection = 1;

  @ViewChild('wsScroll') wsScrollRef?: ElementRef<HTMLDivElement>;
  @ViewChild('hclComp') hclComp?: any;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: PatientsHttpService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1) Restaura estado de sesión (tab + sección HCL + scrolls)
    const saved = readDetailState();
    this.tab = saved.tab;
    this.hclSection = saved.hclSection;

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.open(params.get('id'));
    });
  }

  ngAfterViewInit(): void {
    // Restaura scroll una vez el contenedor existe
    Promise.resolve().then(() => this.restoreScrollForTab(this.tab));
  }

  ngOnDestroy(): void {
    this.saveDetailState();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private saveDetailState(): void {
    const prev = readDetailState();
    let hclScrollTop = prev.hclScrollTop, odontoScrollTop = prev.odontoScrollTop;
    const sectionScrolls = { ...(prev.hclSectionScrolls ?? {}) };
    if (this.wsScrollRef?.nativeElement) {
      const el = this.wsScrollRef.nativeElement;
      if (this.tab === 'hcl033') {
        hclScrollTop = el.scrollTop;
        sectionScrolls[this.hclSection] = el.scrollTop;
      } else odontoScrollTop = el.scrollTop;
    }
    writeDetailState({ tab: this.tab, hclSection: this.hclSection, hclScrollTop, odontoScrollTop, hclSectionScrolls: sectionScrolls });
  }

  private open(id: string | null): void {
    if (!id) {
      this.goBack();
      return;
    }
    const patient = this.service.findPatient(id);
    if (!patient) {
      this.goBack();
      return;
    }
    this.patient = patient;
    this.detail$ = this.service.patientDetail$(patient.id);
    this.cd.markForCheck();
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onTabChange(tab: WsTab): void {
    // Guarda scroll actual antes de cambiar de pestaña
    this.saveDetailState();
    this.tab = tab;
    // Defer scroll restore until view is rendered
    Promise.resolve().then(() => this.restoreScrollForTab(tab));
    // Guarda nueva pestaña (sin pisar scroll del otro tab)
    const prev = readDetailState();
    writeDetailState({ ...prev, tab });
  }

  onHclSectionChange(section: number): void {
    // Guarda el offset de la sección que se abandona (global + por-sección)
    if (this.wsScrollRef?.nativeElement) {
      const el = this.wsScrollRef.nativeElement;
      const prev = readDetailState();
      const map = { ...(prev.hclSectionScrolls ?? {}) };
      map[this.hclSection] = el.scrollTop;
      writeDetailState({ ...prev, hclSectionScrolls: map, hclScrollTop: el.scrollTop });
    }
    this.hclSection = section;
    const prev = readDetailState();
    writeDetailState({ ...prev, hclSection: section });
    // Restaura el offset específico si esa sección ya fue visitada y scrolleada;
    // si es primera visita, mantiene el offset global actual para coherencia con el sticky
    // (todo lo que hay por encima cuenta). Cálculo matemático: conserva la cantidad
    // de scroll ya hecha, clampea si la nueva sección es más corta.
    const saved = readDetailState();
    const target = saved.hclSectionScrolls?.[section];
    if (target != null && this.wsScrollRef?.nativeElement) {
      requestAnimationFrame(() => {
        const el = this.wsScrollRef?.nativeElement;
        if (!el) return;
        const max = Math.max(0, el.scrollHeight - el.clientHeight);
        // Si la sección destino es corta, el navegador clampea automáticamente;
        // si es larga, restaura exactamente donde se dejó.
        el.scrollTop = Math.min(target, max);
      });
    }
  }

  private restoreScrollForTab(tab: WsTab): void {
    const saved = readDetailState();
    if (!this.wsScrollRef?.nativeElement) return;
    const el = this.wsScrollRef.nativeElement;
    const target = tab === 'hcl033' ? saved.hclScrollTop : saved.odontoScrollTop;
    // Espera a que el contenido del tab (HCL sección 11, odontograma) esté renderizado
    const tryRestore = (attempts = 0) => {
      if (el.scrollHeight > el.clientHeight || attempts > 10) {
        el.scrollTop = target;
      } else {
        setTimeout(() => tryRestore(attempts + 1), 30);
      }
    };
    requestAnimationFrame(() => tryRestore());
  }

  onWsScroll(event: Event): void {
    this.saveDetailState();
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('');
  }

  onToothChange(teeth: Tooth[]): void {
    if (this.patient) {
      this.service.updateTeeth(this.patient.id, teeth);
    }
  }
}