import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToothCondition } from '../../core/models/patient.model';
import { SYMBOL_ORDER, SYMBOL_PREFIX } from './odontogram.model';

const FILE_OVERRIDES: Partial<Record<ToothCondition, string>> = {
  extraccion: 'extraccion-indicada.svg'
};

const ICON_FILES: Record<string, string> = {};
for (const c of SYMBOL_ORDER) {
  ICON_FILES[SYMBOL_PREFIX + c] = FILE_OVERRIDES[c] ?? `${c}.svg`;
}

@Injectable()
export class OdontogramIconsService {
  private sprite: Promise<SafeHtml> | null = null;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  getSprite(): Promise<SafeHtml> {
    if (!this.sprite) {
      this.sprite = this.buildSprite().catch((err: unknown) => {
        this.sprite = null;
        throw err;
      });
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
        } catch (err) {
          console.warn(`Odontograma: no se pudo cargar el símbolo ${file}`, err);
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
