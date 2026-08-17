import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  Odontologo,
  OdontologoDraft,
  OdontologoStatus
} from '../../../../core/models/odontologo.model';
import { ConsultoriosHttpService } from '../../../consultorios/services/consultorios-http.service';

export function odontologoStatusLabel(status: OdontologoStatus): string {
  switch (status) {
    case 'activo':
      return 'EN SERVICIO';
    case 'ausente':
      return 'AUSENTE';
    case 'inactivo':
      return 'INACTIVO';
  }
}

@Component({
  selector: 'app-odontologo-panel',
  templateUrl: './odontologo-panel.component.html',
  styleUrls: ['./odontologo-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdontologoPanelComponent implements OnInit, OnChanges {
  @Input() odontologo: Odontologo | null = null;
  @Input() creating = false;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<OdontologoDraft>();
  @Output() toggle = new EventEmitter<string>();

  editing = false;

  statusLabel = odontologoStatusLabel;

  constructor(private readonly consultorios: ConsultoriosHttpService) {}

  ngOnInit(): void {
    this.consultorios.refresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.odontologo || changes.creating) {
      this.editing = false;
    }
  }

  consultorioName(code: string): string {
    if (!code) {
      return '—';
    }
    const consultorio = this.consultorios.snapshot().find(c => c.code === code);
    return consultorio ? consultorio.name : code;
  }

  startEdit(): void {
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  closeForm(): void {
    if (this.creating) {
      this.cancel.emit();
    } else {
      this.cancelEdit();
    }
  }

  onSaved(draft: OdontologoDraft): void {
    this.editing = false;
    this.saved.emit(draft);
  }
}
