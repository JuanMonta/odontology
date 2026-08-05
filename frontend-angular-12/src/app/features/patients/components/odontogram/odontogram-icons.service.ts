import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const ICON_FILES: Record<string, string> = {
  's-caries': 'caries.svg',
  's-obturado': 'obturado.svg',
  's-endodoncia': 'endodoncia.svg',
  's-corona': 'corona.svg',
  's-extraccion': 'extraccion-indicada.svg',
  's-sellante-necesario': 'sellante-necesario.svg',
  's-sellante-realizado': 'sellante-realizado.svg',
  's-protesis-fija': 'protesis-fija.svg',
  's-protesis-removible': 'protesis-removible.svg',
  's-protesis-total': 'protesis-total.svg',
  's-perdida-por-caries': 'perdida-por-caries.svg',
  's-perdida-otra-causa': 'perdida-otra-causa.svg'
};

@Injectable()
export class OdontogramIconsService {
  private sprite: Promise<SafeHtml> | null = null;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  getSprite(): Promise<SafeHtml> {
    if (!this.sprite) {
      this.sprite = this.buildSprite();
    }
    return this.sprite;
  }

  private async buildSprite(): Promise<SafeHtml> {
    const symbols = await Promise.all(
      Object.entries(ICON_FILES).map(async ([id, file]) => {
        try {
          const text = await this.http
            .get(`assets/odontograma-symbols/${file}`, { responseType: 'text' })
            .toPromise();
          return this.toSymbol(id, text);
        } catch {
          return '';
        }
      })
    );
    const html = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${symbols.join('')}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private toSymbol(id: string, svgText: string): string {
    const match = svgText.match(/<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/);
    if (!match) {
      return '';
    }
    return `<symbol id="${id}" viewBox="${match[1]}">${match[2]}</symbol>`;
  }
}
