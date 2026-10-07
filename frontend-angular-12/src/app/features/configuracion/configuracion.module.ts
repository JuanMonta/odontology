import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';
import { SharedModule } from '../../shared/ui/shared.module';
import { ConfiguracionPageComponent } from './pages/configuracion-page/configuracion-page.component';
import { ConfiguracionSectionsComponent } from './components/configuracion-sections/configuracion-sections.component';
import { ConfiguracionPanelComponent } from './components/configuracion-panel/configuracion-panel.component';
import { ConfiguracionRolesComponent } from './components/configuracion-roles/configuracion-roles.component';
import { ConfiguracionRespaldoComponent } from './components/configuracion-respaldo/configuracion-respaldo.component';
import { ConexionManualComponent } from '../../shared/components/conexion-manual/conexion-manual.component';

@NgModule({
  declarations: [
    ConfiguracionPageComponent,
    ConfiguracionSectionsComponent,
    ConfiguracionPanelComponent,
    ConfiguracionRolesComponent,
    ConfiguracionRespaldoComponent,
    ConexionManualComponent
  ],
  // ConexionManualComponent is declared in AppModule (global), not here
  imports: [CommonModule, FormsModule, ConfiguracionRoutingModule, SharedModule],
  exports: [ConfiguracionPageComponent]
})
export class ConfiguracionModule { }
