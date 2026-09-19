import { Injectable } from '@angular/core';

/**
 * Compresión de imágenes del chat en el navegador, ANTES de subirlas.
 *
 * Espejo web del compresor AWT/ImageIO de referencia
 * (`ImageCompression.compressedImage`): mantiene el escalado proporcional
 * (activarRatio) con un ancho/alto máximos, respeta el tipo de salida
 * (JPEG para fotos, PNG conservando el canal alfa) y aplica una calidad
 * configurable (0.0f–1.0f) como la del método Java.
 *
 * Beneficios: el multipart que llega al backend ya viene liviano (ahorro de
 * ancho de banda y de almacenamiento) y tanto el archivo guardado como la
 * vista previa del mensaje usan la versión comprimida.
 */
@Injectable({ providedIn: 'root' })
export class ImageCompressorService {
  /** Calidad equivalente al argumento compressQuality del Java (0.0–1.0). */
  private readonly calidad = 0.82;
  /** maxWidth/maxHeight del compresor de referencia (escalado proporcional). */
  private readonly maxAncho = 1600;
  private readonly maxAlto = 1600;
  /** Bajo este tamaño y dentro de los límites, la imagen ya vale tal cual. */
  private readonly umbralBytesSinTocar = 300 * 1024;

  /** Comprime la imagen si conviene; si no es raster comprimible o falla, devuelve el archivo original. */
  comprimir(file: File): Promise<File> {
    if (!esRasterComprimible(file.type)) {
      return Promise.resolve(file);
    }
    return this.cargarImagen(file).then(
      img => this.procesar(img, file),
      () => file
    );
  }

  private cargarImagen(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('imagen no decodificable'));
      };
      img.src = url;
    });
  }

  private async procesar(img: HTMLImageElement, file: File): Promise<File> {
    const anchoNat = img.naturalWidth || img.width;
    const altoNat = img.naturalHeight || img.height;

    // Dentro de límites y ya liviana: no tiene sentido re-codificar (mantiene
    // la calidad original intacta).
    const dentroDeLimites = anchoNat <= this.maxAncho && altoNat <= this.maxAlto;
    if (dentroDeLimites && file.size <= this.umbralBytesSinTocar) {
      return file;
    }

    // Escalado proporcional (igual que la rama activarRatio=on del Java).
    let ancho = anchoNat;
    let alto = altoNat;
    if (ancho > this.maxAncho || alto > this.maxAlto) {
      const ratio = Math.min(this.maxAncho / ancho, this.maxAlto / alto);
      ancho = Math.max(1, Math.round(ancho * ratio));
      alto = Math.max(1, Math.round(alto * ratio));
    }

    // PNG conserva el canal alfa; el resto se convierte a JPEG (RGB) como el
    // Java cuando compressType es jpg/jpeg.
    const esPng = file.type === 'image/png';
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }
    if (!esPng) {
      // Fondo = imagen (JPEG no soporta transparencia; evita negro).
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ancho, alto);
    }
    ctx.drawImage(img, 0, 0, ancho, alto);

    const tipoSalida = esPng ? 'image/png' : 'image/jpeg';
    const blob = await this.lienzoABlob(canvas, tipoSalida, this.calidad);
    return this.entregar(blob, file, esPng ? 'png' : 'jpg', tipoSalida);
  }

  private lienzoABlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
    return new Promise(resolve => {
      canvas.toBlob(resolve, tipo, calidad);
    });
  }

  private entregar(blob: Blob | null, file: File, ext: string, tipoSalida: string): File {
    if (!blob || blob.size <= 0) {
      return file;
    }
    // El nombre debe terminar en la extensión de salida: el backend valida el
    // par extensión/Content-Type/magic bytes contra la whitelist.
    const nombre = renombrarConExtension(file.name, ext);
    return new File([blob], nombre, { type: tipoSalida });
  }
}

/** Solo imágenes raster sin animación que el canvas puede decodificar. */
function esRasterComprimible(mime: string): boolean {
  if (!mime.startsWith('image/')) {
    return false;
  }
  return mime !== 'image/gif'
    && mime !== 'image/svg+xml'
    && mime !== 'image/x-icon';
}

function renombrarConExtension(nombreOriginal: string, ext: string): string {
  const base = nombreOriginal.replace(/\.[a-z0-9]+$/i, '');
  return `${base}.${ext}`;
}