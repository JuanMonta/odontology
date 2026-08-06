import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosRoutingModule } from './usuarios-routing.module';
import { UsuariosPageComponent } from './pages/usuarios-page/usuarios-page.component';
import { UsuarioDirectoryComponent } from './components/usuario-directory/usuario-directory.component';
import { UsuarioPanelComponent } from './components/usuario-panel/usuario-panel.component';
import { UsuarioFormComponent } from './components/usuario-form/usuario-form.component';

@NgModule({
  declarations: [
    UsuariosPageComponent,
    UsuarioDirectoryComponent,
    UsuarioPanelComponent,
    UsuarioFormComponent
  ],
  imports: [CommonModule, FormsModule, UsuariosRoutingModule],
  exports: [UsuariosPageComponent]
})
export class UsuariosModule { }
