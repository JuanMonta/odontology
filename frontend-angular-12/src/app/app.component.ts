import { Component } from '@angular/core';
import { AjusteVisualService } from './core/services/ajuste-visual.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sas-odontology';

  constructor(ajusteVisual: AjusteVisualService) {
    void ajusteVisual;
  }
}
