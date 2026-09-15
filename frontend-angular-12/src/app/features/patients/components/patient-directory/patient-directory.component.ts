import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Patient } from '../../../../core/models/patient.model';
import { PaginatedListComponent } from '../../../../shared/components/pagination/paginated-list.component';
import { formatMoney } from '../../../../core/utils/format';
import { PatientsSelectionService } from '../../services/patients-selection.service';

@Component({
  selector: 'app-patient-directory',
  templateUrl: './patient-directory.component.html',
  styleUrls: ['./patient-directory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientDirectoryComponent extends PaginatedListComponent implements OnInit, AfterViewInit {
  @Input() patients: Patient[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Patient>();
  @Output() open = new EventEmitter<Patient>();

  @ViewChild('dirList') dirListRef?: ElementRef<HTMLDivElement>;

  constructor(private selection: PatientsSelectionService) { super(); }

  ngOnInit(): void {
    const saved = this.selection.value;
    if (saved.page) { this.page = Math.max(1, Math.min(saved.page, this.pageCount || saved.page)); }
    if (saved.pageSize) { this.pageSize = saved.pageSize; }
  }

  ngAfterViewInit(): void {
    const saved = this.selection.value;
    if (saved.scrollTop && this.dirListRef?.nativeElement) {
      this.dirListRef.nativeElement.scrollTop = saved.scrollTop;
    }
  }

  override goToPage(page: number): void {
    super.goToPage(page);
    this.selection.setPage(this.page);
  }

  override setPageSize(size: number): void {
    super.setPageSize(size);
    this.selection.setState({ page: this.page, pageSize: this.pageSize });
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLDivElement;
    this.selection.setScrollTop(target.scrollTop);
  }

  protected get totalItems(): number {
    return this.patients.length;
  }

  get visiblePatients(): Patient[] {
    return this.slice(this.patients) as Patient[];
  }

  fmtMoney(n: number): string {
    return n > 0 ? formatMoney(n) : 'AL DÍA';
  }

  trackById(_: number, p: Patient): string {
    return p.id;
  }
}

