import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BackendStatus,
  BackendStatusService
} from '../../../../core/services/backend-status.service';

@Component({
  selector: 'app-backend-status',
  templateUrl: './backend-status.component.html',
  styleUrls: ['./backend-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackendStatusComponent implements OnInit {
  status$: Observable<BackendStatus> | null = null;

  constructor(private readonly backendStatus: BackendStatusService) {}

  ngOnInit(): void {
    this.status$ = this.backendStatus.status$;
  }

  get statusLabel(): string {
    switch (this.backendStatus.value) {
      case 'online':
        return 'SERVIDOR EN LÍNEA';
      case 'offline':
        return 'SIN CONEXIÓN';
      default:
        return 'VERIFICANDO';
    }
  }
}
