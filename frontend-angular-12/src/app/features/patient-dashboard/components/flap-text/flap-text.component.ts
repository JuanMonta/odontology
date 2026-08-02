import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-flap-text',
  template: `
    <span class="flap-text" [attr.aria-label]="value" role="text">
      <ng-container *ngFor="let ch of chars; let i = index; trackBy: trackByIndex">
        <span *ngIf="ch !== ' '" class="flap-cell-wrap">
          <app-flap-cell [current]="ch" [delay]="i * 42"></app-flap-cell>
        </span>
        <span *ngIf="ch === ' '" class="flap-gap"></span>
      </ng-container>
    </span>
  `,
  styleUrls: ['./flap-text.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlapTextComponent implements OnChanges {
  @Input() value = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  chars: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      this.chars = (this.value ?? '').toUpperCase().split('');
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
