import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatAdjunto } from '../../../../core/models/chat.model';
import { ChatHttpService } from '../../services/chat-http.service';

/**
 * Tarjeta de adjunto dentro de la burbuja del chat. Las imágenes se previsualizan
 * descargando el blob con el JWT (el endpoint exige auth, así que un <img> pelado
 * no bastaría); abrir/descargar reusa el mismo blob en una pestaña nueva.
 */
@Component({
  selector: 'app-chat-adjunto-card',
  templateUrl: './chat-adjunto-card.component.html',
  styleUrls: ['./chat-adjunto-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatAdjuntoCardComponent implements OnChanges, OnDestroy {
  @Input() adjunto: ChatAdjunto | null = null;

  previewUrl: string | null = null;
  estado: 'cargando' | 'listo' | 'error' = 'cargando';

  private sub?: Subscription;
  private readonly urls: string[] = [];

  constructor(
    private readonly chat: ChatHttpService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  ngOnChanges(): void {
    this.limpiar();
    if (this.adjunto && this.adjunto.categoria === 'imagen') {
      this.cargarVistaPrevia();
    } else {
      this.estado = 'listo';
    }
  }

  get categoriaEtiqueta(): string {
    if (!this.adjunto) {
      return '';
    }
    if (this.adjunto.categoria === 'imagen') {
      return 'IMAGEN';
    }
    if (this.adjunto.categoria === 'solicitud') {
      return 'SOLICITUD';
    }
    if (this.adjunto.categoria === 'audio') {
      return 'AUDIO';
    }
    return 'DOCUMENTO';
  }

  get tamanoFormateado(): string {
    if (!this.adjunto) {
      return '';
    }
    const b = this.adjunto.tamano;
    if (b < 1024) {
      return `${b} B`;
    }
    if (b < 1024 * 1024) {
      return `${(b / 1024).toFixed(1)} KB`;
    }
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  }

  abrir(): void {
    if (!this.adjunto) {
      return;
    }
    this.estado = 'cargando';
    const ventana = window.open('', '_blank');
    this.sub?.unsubscribe();
    this.sub = this.chat.descargarAdjunto(this.adjunto.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.urls.push(url);
        if (ventana) {
          ventana.location.replace(url);
        } else {
          this.descargarDirecto(url);
        }
        this.estado = 'listo';
        this.cdr.markForCheck();
      },
      error: () => {
        this.estado = 'error';
        this.cdr.markForCheck();
      }
    });
  }

  private cargarVistaPrevia(): void {
    if (!this.adjunto) {
      return;
    }
    this.estado = 'cargando';
    this.sub?.unsubscribe();
    this.sub = this.chat.descargarAdjunto(this.adjunto.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.urls.push(url);
        this.previewUrl = url;
        this.estado = 'listo';
        this.cdr.markForCheck();
      },
      error: () => {
        this.estado = 'error';
        this.cdr.markForCheck();
      }
    });
  }

  private descargarDirecto(url: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = this.adjunto?.nombre ?? 'adjunto';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  private limpiar(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
    for (const u of this.urls) {
      URL.revokeObjectURL(u);
    }
    this.urls.length = 0;
    this.previewUrl = null;
  }

  ngOnDestroy(): void {
    this.limpiar();
  }
}