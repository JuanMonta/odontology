import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatRoutingModule } from './chat-routing.module';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
import { ChatAdjuntoCardComponent } from './components/chat-adjunto-card/chat-adjunto-card.component';

@NgModule({
  declarations: [ChatPageComponent, ChatAdjuntoCardComponent],
  imports: [CommonModule, FormsModule, ChatRoutingModule],
  exports: [ChatPageComponent]
})
export class ChatModule { }
