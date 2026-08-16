import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WaitingPatient } from '../../../../core/models/appointment.model';
import { TreatmentsHttpService } from '../../../treatments/services/treatments-http.service';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';

@Component({
  selector: 'app-waiting-panel',
  templateUrl: './waiting-panel.component.html',
  styleUrls: ['./waiting-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaitingPanelComponent extends PaginatedListComponent {
  @Input() waiting: WaitingPatient[] = [];
  @Input() errorMessage = '';
  @Output() callNext = new EventEmitter<void>();
  @Output() addWalkIn = new EventEmitter<{ nombre: string; motivo: string }>();

  @ViewChild('walkInPanel', { static: false }) walkInPanel?: ElementRef<HTMLElement>;

  treatmentOptions$: Observable<string[]>;

  walkInOpen = false;
  walkInNombre = '';
  walkInMotivo = '';
  walkInTratamiento = '';

  constructor(treatments: TreatmentsHttpService) {
    super();
    this.treatmentOptions$ = treatments.treatments$.pipe(map(list => list.map(t => t.name)));
  }

  protected get totalItems(): number {
    return this.waiting.length;
  }

  get visibleWaiting(): WaitingPatient[] {
    return this.slice(this.waiting) as WaitingPatient[];
  }

  trackById(_: number, p: WaitingPatient): string {
    return p.id;
  }

  openWalkIn(): void {
    this.walkInOpen = true;
    this.walkInNombre = '';
    this.walkInMotivo = '';
    this.walkInTratamiento = '';
    setTimeout(() => this.walkInPanel?.nativeElement.focus(), 0);
  }

  closeWalkIn(): void {
    if (!this.walkInOpen) return;
    this.walkInOpen = false;
  }

  onWalkInBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeWalkIn();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.walkInOpen) {
      this.closeWalkIn();
    }
  }

  onWalkInSubmit(): void {
    if (!this.walkInNombre.trim()) return;
    const motivo = this.walkInTratamiento.trim() || this.walkInMotivo.trim();
    if (!motivo) return;
    this.addWalkIn.emit({
      nombre: this.walkInNombre.trim(),
      motivo
    });
    this.closeWalkIn();
  }
}
