import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ClinicaSettings, ConfigSection } from '../../../../core/models/clinica-settings.model';
import { ConfiguracionHttpService, CONFIG_SECTIONS } from '../../services/configuracion-http.service';

@Component({
  selector: 'app-configuracion-page',
  templateUrl: './configuracion-page.component.html',
  styleUrls: ['./configuracion-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionPageComponent implements OnDestroy {
  sections = CONFIG_SECTIONS;

  settings$: Observable<ClinicaSettings | null>;
  activeSection$: Observable<ConfigSection>;
  saved$: Observable<boolean>;

  private readonly activeSection = new BehaviorSubject<ConfigSection>('clinica');
  private readonly savedFlag = new BehaviorSubject<boolean>(false);
  private savedReset: ReturnType<typeof setTimeout> | null = null;

  constructor(private service: ConfiguracionHttpService) {
    this.settings$ = this.service.settings$;
    this.activeSection$ = this.activeSection.asObservable();
    this.saved$ = this.savedFlag.asObservable();
  }

  ngOnDestroy(): void {
    if (this.savedReset) {
      clearTimeout(this.savedReset);
    }
  }

  onSection(id: ConfigSection): void {
    this.activeSection.next(id);
  }

  onSave(settings: ClinicaSettings): void {
    this.service.save(settings);
    this.savedFlag.next(true);
    if (this.savedReset) {
      clearTimeout(this.savedReset);
    }
    this.savedReset = setTimeout(() => this.savedFlag.next(false), 2200);
  }
}
