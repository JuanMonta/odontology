import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatRoutingModule } from './chat-routing.module';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';

@NgModule({
  declarations: [ChatPageComponent],
  imports: [CommonModule, FormsModule, ChatRoutingModule],
  exports: [ChatPageComponent]
})
export class ChatModule { }
