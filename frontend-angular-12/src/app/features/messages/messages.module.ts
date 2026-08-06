import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesRoutingModule } from './messages-routing.module';
import { MessagesPageComponent } from './pages/messages-page/messages-page.component';
import { MessageDirectoryComponent } from './components/message-directory/message-directory.component';
import { MessagePanelComponent } from './components/message-panel/message-panel.component';
import { MessageFormComponent } from './components/message-form/message-form.component';

@NgModule({
  declarations: [
    MessagesPageComponent,
    MessageDirectoryComponent,
    MessagePanelComponent,
    MessageFormComponent
  ],
  imports: [CommonModule, FormsModule, MessagesRoutingModule],
  exports: [MessagesPageComponent]
})
export class MessagesModule { }
