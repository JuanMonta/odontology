import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Odontologo } from '../../../../core/models/odontologo.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';

@Component({
  selector: 'app-odontologo-directory',
  templateUrl: './odontologo-directory.component.html',
  styleUrls: ['./odontologo-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdontologoDirectoryComponent extends PaginatedListComponent implements AfterViewInit {
  @Input() odontologos: Odontologo[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Odontologo>();
  @ViewChild('dirList') dirListRef?: ElementRef<HTMLDivElement>;

  protected get totalItems(): number {
    return this.odontologos.length;
  }

  get visibleOdontologos(): Odontologo[] {
    return this.slice(this.odontologos) as Odontologo[];
  }

  ngAfterViewInit(): void {
    if (this.persistKey) {
      this.bindScroll(this.dirListRef?.nativeElement ?? null);
    }
  }
}
