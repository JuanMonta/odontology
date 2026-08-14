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
import { WaitingPatient } from '../../../../core/models/appointment.model';

@Component({
  selector: 'app-waiting-panel',
  templateUrl: './waiting-panel.component.html',
  styleUrls: ['./waiting-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaitingPanelComponent {
  @Input() waiting: WaitingPatient[] = [];
  @Output() callNext = new EventEmitter<void>();
  @Output() addWalkIn = new EventEmitter<{ nombre: string; motivo: string }>();

  @ViewChild('walkInPanel', { static: false }) walkInPanel?: ElementRef<HTMLElement>;

  walkInOpen = false;
  walkInNombre = '';
  walkInMotivo = '';

  trackById(_: number, p: WaitingPatient): string {
    return p.id;
  }

  openWalkIn(): void {
    this.walkInOpen = true;
    this.walkInNombre = '';
    this.walkInMotivo = '';
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
    if (!this.walkInNombre.trim() || !this.walkInMotivo.trim()) return;
    this.addWalkIn.emit({
      nombre: this.walkInNombre.trim(),
      motivo: this.walkInMotivo.trim()
    });
    this.closeWalkIn();
  }
}
