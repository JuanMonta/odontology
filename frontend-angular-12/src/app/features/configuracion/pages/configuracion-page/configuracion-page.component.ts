import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ClinicaSettings, ConfigSection } from '../../../../core/models/clinica-settings.model';
import { ConfiguracionMockService, CONFIG_SECTIONS } from '../../services/configuracion-mock.service';

@Component({
  selector: 'app-configuracion-page',
  templateUrl: './configuracion-page.component.html',
  styleUrls: ['./configuracion-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionPageComponent {
  sections = CONFIG_SECTIONS;

  settings$: Observable<ClinicaSettings>;
  activeSection$: Observable<ConfigSection>;
  saved$: Observable<boolean>;

  private readonly activeSection = new BehaviorSubject<ConfigSection>('clinica');
  private readonly savedFlag = new BehaviorSubject<boolean>(false);

  constructor(private service: ConfiguracionMockService) {
    this.settings$ = this.service.settings$;
    this.activeSection$ = this.activeSection.asObservable();
    this.saved$ = this.savedFlag.asObservable();
  }

  onSection(id: ConfigSection): void {
    this.activeSection.next(id);
  }

  onSave(settings: ClinicaSettings): void {
    this.service.save(settings);
    this.savedFlag.next(true);
    setTimeout(() => this.savedFlag.next(false), 2200);
  }
}
