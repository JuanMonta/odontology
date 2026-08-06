import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfigSection, ConfigSectionMeta } from '../../../../core/models/clinica-settings.model';

@Component({
  selector: 'app-configuracion-sections',
  templateUrl: './configuracion-sections.component.html',
  styleUrls: ['./configuracion-sections.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionSectionsComponent {
  @Input() sections: ConfigSectionMeta[] = [];
  @Input() active: ConfigSection = 'clinica';
  @Output() select = new EventEmitter<ConfigSection>();
}
