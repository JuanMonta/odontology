import { Injectable } from '@angular/core';

/**
 * Compresión de imágenes del chat en el navegador, ANTES de subir el multipart.
 *
 * Espejo web (canvas) del compresor AWT/ImageIO de referencia
 * (`ImageCompression.compressImage`): escalado proporcional acotado por
 * {@code maxWidth}/{@code maxHeight}, re-codificación con calidad configurable
 * (0.0–1.0) y conversión de tipo JPEG/PNG. El navegador decodifica, escala y
 * re-codifica en un {@code <canvas>}; el blob resultante es lo que viaja al
 * backend (multipart ya liviano) y lo que se guarda.
 *
 * La imagen se comprime una sola vez, en la única capa donde tiene sentido
 * hacerlo: en el cliente, al seleccionarla. Así el ancho de banda, el
 * almacenamiento (`chat_adjuntos`) y la descarga/preview del mensaje trabajan
 * siempre con la versión comprimida.
 */
@Injectable({ providedIn: 'root' })
export class ImageCompressorService {
  /** Calidad equivalente a la del Java (escala 0.0f–1.0f). */
  private readonly calidad = 0.82;
  /** Ancho/alto máximos de la imagen comprimida (escalado proporcional), como
   *  los {@code maxWidth}/{@code maxHeight} del compresor de referencia. */
  private readonly maxWidth = 1600;
  private readonly maxHeight = 1600;
  /** Imágenes raster que el canvas puede decodificar y re-codificar. El resto
   *  (gif/svg animados, documentos, audio) viaja sin tocar. */
  private static readonly RASTERIZABLES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/bmp']);

  /**
   * Comprime {@code original} si es una imagen raster comprimible. Si no aplica
   * (documento/audio, GIF/SVG, o el encoder de canvas falla) devuelve el
   * archivo original intacto: la compresión NUNCA debe bloquear el envío.
   */
  comprimir(original: File): Promise<File> {
    if (!ImageCompressorService.RASTERIZABLES.has(original.type)) {
      return Promise.resolve(original);
    }
    return this.cargar(original).then(
      imagen => this.procesar(imagen, original),
      () => original
    );
  }

  private cargar(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject();
      };
      img.src = url;
    });
  }

  private procesar(imagen: HTMLImageElement, original: File): Promise<File> {
    const anchoNat = imagen.naturalWidth || 0;
    const altoNat = imagen.naturalHeight || 0;
    if (anchoNat <= 0 || altoNat <= 0) {
      return Promise.resolve(original);
    }

    // Escalado proporcional (igual que la rama activarRatio=true del Java):
    // solo se reduce si sobra dimension a partir del máximo.
    let ancho = anchoNat;
    let alto = altoNat;
    if (ancho > this.maxWidth || alto > this.maxHeight) {
      const factor = Math.min(this.maxWidth / ancho, this.maxHeight / alto);
      ancho = Math.max(1, Math.round(ancho * factor));
      alto = Math.max(1, Math.round(alto * factor));
    }

    // PNG conserva el canal alfa; el resto se re-codifica a JPEG (RGB).
    const esPng = original.type === 'image/png';
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return Promise.resolve(original);
    }
    if (esPng) {
      ctx.drawImage(imagen, 0, 0, ancho, alto);
      return this.exportar(canvas, 'image/png', null, original, 'png');
    }

    // JPEG: fondo blanco para que la transparencia no quede negra.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(imagen, 0, 0, ancho, alto);
    return this.exportar(canvas, 'image/jpeg', this.calidad, original, 'jpg');
  }

  private exportar(
    canvas: HTMLCanvasElement,
    tipo: string,
    calidad: number | null,
    original: File,
    ext: string
  ): Promise<File> {
    return new Promise(resolve => {
      canvas.toBlob(
        blob => {
          if (!blob || blob.size <= 0) {
            resolve(original);
            return;
          }
          const nombre = original.name.replace(/\.[^.]+$/, '') + '.' + ext;
          resolve(new File([blob], nombre, { type: tipo }));
        },
        tipo,
        calidad ?? undefined
      );
    });
  }
}