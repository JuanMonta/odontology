import { Injectable } from '@angular/core';
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';
import { Hcl, DIENTES_POR_SEXTANTE } from '../../../core/models/hcl.model';
import { Patient } from '../../../core/models/patient.model';

export interface CoordField {
  page: number; x: number; y: number; w: number; h: number;
  label: string; type: string; sampleValue: string;
  textAlign?: 'left' | 'center' | 'right';
  dbField?: string | null;
}

@Injectable({ providedIn: 'root' })
export class Form033PdfService {
  private coords: Record<string, CoordField> = {};
  private font: any;
  private hcl!: Hcl;
  private patient!: Patient;

  async loadCoords(): Promise<void> {
    const resp = await fetch('assets/hc033-document/form033-coords.json?v=' + Date.now());
    const data = await resp.json();
    this.coords = {};
    if (data.sections) {
      data.sections.forEach((sec: any) => {
        Object.entries(sec.fields || {}).forEach(([id, field]: [string, any]) => {
          this.coords[id] = field;
        });
      });
    } else {
      this.coords = data;
    }
  }

  private c(id: string): CoordField | null { return this.coords[id] || null; }

  // ────────────── PATH RESOLVER ──────────────

  private resolvePath(path: string): any {
    if (!path) return undefined;
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let obj: any = parts[0] === 'patient' ? this.patient : this.hcl;
    for (let i = 1; i < parts.length; i++) {
      if (obj == null) return undefined;
      obj = obj[parts[i]];
    }
    return obj;
  }

  private val(fieldId: string): any {
    const f = this.c(fieldId);
    if (!f || !f.dbField) return undefined;
    return this.resolvePath(f.dbField);
  }

  private str(fieldId: string): string {
    const v = this.val(fieldId);
    if (v == null || v === '') return '';
    return String(v);
  }

  private numStr(fieldId: string): string {
    const v = this.val(fieldId);
    return v != null ? String(v) : '';
  }

  // ────────────── DRAW HELPERS ──────────────

  private pxToPdfX(px: number): number { return px * 0.3601; }
  private pxToPdfY(px: number, fontSize: number): number { return 841.89 - px * 0.3599 - fontSize; }

  private drawText(page: PDFPage, text: string, fieldId: string, size: number = 9): void {
    const f = this.c(fieldId); if (!f || !text) return;
    const str = String(text).substring(0, 100);
    let x = this.pxToPdfX(f.x + 2);
    const y = this.pxToPdfY(f.y + 2, size);
    if (f.textAlign === 'center') {
      const textW = this.font.widthOfTextAtSize(str, size);
      x = this.pxToPdfX(f.x) + (f.w * 0.3601 - textW) / 2;
    } else if (f.textAlign === 'right') {
      const textW = this.font.widthOfTextAtSize(str, size);
      x = this.pxToPdfX(f.x + f.w) - textW - 2;
    }
    page.drawText(str, { x, y, size, font: this.font, color: rgb(0, 0, 0) });
  }

  private drawCheckbox(page: PDFPage, checked: boolean, fieldId: string, size: number = 10): void {
    const f = this.c(fieldId); if (!f || !checked) return;
    const boxCenterPdfY = 841.89 - (f.y + f.h / 2) * 0.3599;
    const y = boxCenterPdfY - size * 0.36;
    const textW = this.font.widthOfTextAtSize('X', size);
    const x = this.pxToPdfX(f.x) + (f.w * 0.3601 - textW) / 2;
    page.drawText('X', { x, y, size, font: this.font, color: rgb(0, 0, 0) });
  }

  private drawMultiline(page: PDFPage, text: string, fieldId: string, size: number = 9): void {
    const f = this.c(fieldId); if (!f || !text) return;
    const lines = text.split('\n').filter(l => l.trim());
    const lineHeight = size + 3;
    const startY = this.pxToPdfY(f.y + 4, size);
    const startX = this.pxToPdfX(f.x + 2);
    const maxW = f.w * 0.3601 - 4;

    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      if (line.length * (size * 0.5) <= maxW) {
        page.drawText(line, { x: startX, y: startY - i * lineHeight, size, font: this.font, color: rgb(0, 0, 0) });
      } else {
        const words = line.split(' ');
        let currentLine = '';
        for (const word of words) {
          const test = currentLine ? currentLine + ' ' + word : word;
          if (test.length * (size * 0.5) > maxW && currentLine) {
            page.drawText(currentLine, { x: startX, y: startY - i * lineHeight, size, font: this.font, color: rgb(0, 0, 0) });
            i++;
            currentLine = word;
          } else {
            currentLine = test;
          }
        }
        if (currentLine && i < 15) {
          page.drawText(currentLine, { x: startX, y: startY - i * lineHeight, size, font: this.font, color: rgb(0, 0, 0) });
        }
      }
    }
  }

  /** Dibuja texto ajustando automáticamente tamaño y líneas para que quepa en la caja.
   *  Lógica:
   *  1. Word-wrap completo a tamaño base (9pt). Si todas las líneas quepan en la altura, dibuja.
   *  2. Si no, reduce tamaño progresivamente para que quepen más líneas.
   *  3. Si aún así no caben todas, dibuja solo las que quepan (recorte visual).
   *  4. Si ni siquiera1 línea cabe al tamaño mínimo, reduce hasta que quepa en UNA sola línea. */
  private drawAutoFitText(page: PDFPage, text: string, fieldId: string, baseSize: number = 9, minSize: number = 6): void {
    const f = this.c(fieldId); if (!f || !text) return;
    const str = String(text).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const boxW = f.w * 0.3601 - 4;
    const boxH = f.h * 0.3599 - 2;
    const startX = this.pxToPdfX(f.x + 2);

    const wrapText = (text: string, size: number): string[] => {
      const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
      const lines: string[] = [];
      for (const para of paragraphs) {
        const words = para.split(' ');
        let current = '';
        for (const w of words) {
          const test = current ? current + ' ' + w : w;
          if (this.font.widthOfTextAtSize(test, size) > boxW && current) {
            lines.push(current);
            current = w;
          } else {
            current = test;
          }
        }
        if (current) lines.push(current);
        if (para !== paragraphs[paragraphs.length - 1]) lines.push('');
      }
      return lines;
    };

    const drawLines = (lines: string[], size: number): void => {
      const lineHeight = size + 1;
      const maxLines = Math.max(1, Math.floor(boxH / lineHeight));
      const boxTopPdf = 841.89 - f.y * 0.3599;
      const ascent = size * 0.8;
      const startY = boxTopPdf - ascent - 1;
      const visibleLines = lines.slice(0, maxLines);

      for (let i = 0; i < visibleLines.length; i++) {
        let x = startX;
        if (f.textAlign === 'center') {
          const textW = this.font.widthOfTextAtSize(visibleLines[i], size);
          x = this.pxToPdfX(f.x) + (f.w * 0.3601 - textW) / 2;
        } else if (f.textAlign === 'right') {
          const textW = this.font.widthOfTextAtSize(visibleLines[i], size);
          x = this.pxToPdfX(f.x + f.w) - textW - 2;
        }
        page.drawText(visibleLines[i], { x, y: startY - i * lineHeight, size, font: this.font, color: rgb(0, 0, 0) });
      }
    };

    let lines = wrapText(str, baseSize);
    const lineHeightBase = baseSize + 1;
    const maxLinesBase = Math.max(1, Math.floor(boxH / lineHeightBase));
    if (lines.length <= maxLinesBase) {
      drawLines(lines, baseSize);
      return;
    }

    for (let sz = baseSize - 0.5; sz >= minSize; sz -= 0.5) {
      lines = wrapText(str, sz);
      const lh = sz + 1;
      const maxL = Math.max(1, Math.floor(boxH / lh));
      if (lines.length <= maxL) {
        drawLines(lines, sz);
        return;
      }
    }

    const minLines = wrapText(str, minSize);
    const lhMin = minSize + 1;
    const maxLinesMin = Math.max(1, Math.floor(boxH / lhMin));

    if (maxLinesMin >= 2 && minLines.length <= maxLinesMin) {
      drawLines(minLines, minSize);
      return;
    }

    if (maxLinesMin >= 2) {
      drawLines(minLines.slice(0, maxLinesMin), minSize);
      return;
    }

    const firstPara = str.split('\n')[0];
    for (let sz = minSize; sz >= 3; sz -= 0.5) {
      const w = this.font.widthOfTextAtSize(firstPara, sz);
      if (w <= boxW) {
        const boxTopPdf = 841.89 - f.y * 0.3599;
        const startY = boxTopPdf - sz * 0.8 - 1;
        let x = startX;
        if (f.textAlign === 'center') {
          const textW = this.font.widthOfTextAtSize(firstPara, sz);
          x = this.pxToPdfX(f.x) + (f.w * 0.3601 - textW) / 2;
        } else if (f.textAlign === 'right') {
          const textW = this.font.widthOfTextAtSize(firstPara, sz);
          x = this.pxToPdfX(f.x + f.w) - textW - 2;
        }
        page.drawText(firstPara, { x, y: startY, size: sz, font: this.font, color: rgb(0, 0, 0) });
        return;
      }
    }
    drawLines([firstPara], minSize);
  }

  private async drawPageBg(doc: PDFDocument, imgBytes: ArrayBuffer, pageNum: number): Promise<void> {
    const img = await doc.embedPng(imgBytes);
    const page = doc.getPage(pageNum - 1);
    const { width, height } = page.getSize();
    page.drawImage(img, { x: 0, y: 0, width, height });
  }

  // ────────────── PAGE 1 ──────────────

  private drawPage1(page: PDFPage): void {
    const hcl = this.hcl;
    const patient = this.patient;

    // ── Fila verde: datos del paciente ──
    this.drawAutoFitText(page, this.str('establecimiento'), 'establecimiento', 9, 7);
    this.drawAutoFitText(page, this.str('nombre'), 'nombre', 9, 7);
    this.drawAutoFitText(page, this.str('sexo'), 'sexo', 9, 7);
    this.drawAutoFitText(page, this.str('edad'), 'edad', 9, 7);
    this.drawAutoFitText(page, this.str('nhc'), 'nhc', 9, 7);

    // ── Grupo etario ──
    const age = patient.age ?? 0;
    this.drawCheckbox(page, age < 1, 'age_menor1');
    this.drawCheckbox(page, age >= 1 && age <= 4, 'age_1a4');
    this.drawCheckbox(page, age >= 5 && age <= 9, 'age_5a9');
    this.drawCheckbox(page, age >= 10 && age <= 14, 'age_10a14');
    this.drawCheckbox(page, age >= 15 && age <= 19, 'age_15a19');
    this.drawCheckbox(page, age >= 20, 'age_mayor20');
    this.drawCheckbox(page, false, 'embarazada');

    // ── Sección 1: Motivo de consulta ──
    this.drawAutoFitText(page, this.str('motivo'), 'motivo', 9, 7);

    // ── Sección 2: Problema actual ──
    this.drawAutoFitText(page, this.str('problema'), 'problema', 9, 6);

    // ── Sección 3: Antecedentes personales ──
    this.drawCheckbox(page, !!this.val('ant_alergia_antibiotico'), 'ant_alergia_antibiotico');
    this.drawCheckbox(page, !!this.val('ant_alergia_anestesia'), 'ant_alergia_anestesia');
    this.drawCheckbox(page, !!this.val('ant_hemorragias'), 'ant_hemorragias');
    this.drawCheckbox(page, !!this.val('ant_vih_sida'), 'ant_vih_sida');
    this.drawCheckbox(page, !!this.val('ant_tuberculosis'), 'ant_tuberculosis');
    this.drawCheckbox(page, !!this.val('ant_asma'), 'ant_asma');
    this.drawCheckbox(page, !!this.val('ant_diabetes'), 'ant_diabetes');
    this.drawCheckbox(page, !!this.val('ant_hipertension'), 'ant_hipertension');
    this.drawCheckbox(page, !!this.val('ant_enf_cardiaca'), 'ant_enf_cardiaca');
    this.drawCheckbox(page, !!this.val('ant_otro'), 'ant_otro');
    this.drawAutoFitText(page, this.str('ant_otro_texto'), 'ant_otro_texto', 8, 6);

    // ── Sección 4: Signos vitales ──
    this.drawAutoFitText(page, this.str('sv_pa'), 'sv_pa', 9, 7);
    this.drawAutoFitText(page, this.numStr('sv_fc'), 'sv_fc', 9, 7);
    this.drawAutoFitText(page, this.str('sv_temp'), 'sv_temp', 9, 7);
    this.drawAutoFitText(page, this.numStr('sv_fr'), 'sv_fr', 9, 7);

    // ── Sección 5: Examen del sistema estomatognático ──
    const regiones = hcl.examenRegiones || [];
    // Checkboxes del grid (reg_chk_1..reg_chk_12)
    const chkIds = ['reg_chk_1','reg_chk_2','reg_chk_3','reg_chk_4','reg_chk_5','reg_chk_6','reg_chk_7','reg_chk_8','reg_chk_9','reg_chk_10','reg_chk_11','reg_chk_12'];
    for (let i = 0; i < Math.min(regiones.length, 12); i++) {
      this.drawCheckbox(page, !!regiones[i].marcado, chkIds[i]);
    }
    // Descripciones: concatenar todas en un solo párrafo en reg_1
    const descTexts: string[] = [];
    for (let i = 0; i < Math.min(regiones.length, 12); i++) {
      if (!regiones[i].marcado) continue;
      const desc = regiones[i].descripcion || '';
      if (desc) {
        descTexts.push(`${regiones[i].region}. ${desc}`);
      }
    }
    if (descTexts.length > 0) {
      this.drawAutoFitText(page, descTexts.join(' '), 'reg_1', 8, 6);
    }

    // ── Sección 7: IHOS ──
    const sextantes = hcl.higieneSextantes || [];
    const gingOk = (v: number | null | undefined): boolean => v === 0 || v === 1;
    for (let i = 0; i < Math.min(sextantes.length, 6); i++) {
      const s = sextantes[i];
      this.drawAutoFitText(page, s.placa != null && s.placa >= 0 && s.placa <= 3 ? String(s.placa) : '', `ihos_r${i + 1}_placa`, 9, 7);
      this.drawAutoFitText(page, s.calculo != null && s.calculo >= 0 && s.calculo <= 3 ? String(s.calculo) : '', `ihos_r${i + 1}_calculo`, 9, 7);
      this.drawAutoFitText(page, gingOk(s.gingivitis) ? String(s.gingivitis) : '', `ihos_r${i + 1}_gingivitis`, 9, 7);

      const teeth = DIENTES_POR_SEXTANTE[i] as readonly [number, number, number];
      if (teeth) {
        this.drawCheckbox(page, s.d1_evaluado, `ihos_d_${teeth[0]}`);
        this.drawCheckbox(page, s.d2_evaluado, `ihos_d_${teeth[1]}`);
        this.drawCheckbox(page, s.d3_evaluado, `ihos_d_${teeth[2]}`);
      }
    }

    // Totales IHOS (gingivitis solo 0-1)
    let totalPlaca = 0, totalCalculo = 0, totalGingivitis = 0, hasAny = false;
    for (const s of sextantes) {
      if (s.placa != null || s.calculo != null || s.gingivitis != null) { hasAny = true; }
      if (s.placa != null && s.placa >= 0 && s.placa <= 3) totalPlaca += s.placa;
      if (s.calculo != null && s.calculo >= 0 && s.calculo <= 3) totalCalculo += s.calculo;
      if (gingOk(s.gingivitis)) totalGingivitis += s.gingivitis as number;
    }
    if (hasAny) {
      this.drawAutoFitText(page, String(totalPlaca), 'ihos_total_placa', 9, 7);
      this.drawAutoFitText(page, String(totalCalculo), 'ihos_total_calculo', 9, 7);
      this.drawAutoFitText(page, String(totalGingivitis), 'ihos_total_gingivitis', 9, 7);
    }

    // Enfermedades — valores UI: LEVE/MODERADA/AVANZADA, ANGLE_I/II/III, LEVE/MODERADA/SEVERA
    const ep = String(this.val('ep_leve') || '').toUpperCase().trim();
    this.drawCheckbox(page, ep === 'LEVE' || ep === '1', 'ep_leve');
    this.drawCheckbox(page, ep === 'MODERADA' || ep === '2', 'ep_moderada');
    this.drawCheckbox(page, ep === 'AVANZADA' || ep === '3', 'ep_avanzada');
    const mo = String(this.val('maloclusion_leve') || '').toUpperCase().trim();
    this.drawCheckbox(page, mo === 'ANGLE_I' || mo === 'LEVE' || mo === '1', 'maloclusion_leve');
    this.drawCheckbox(page, mo === 'ANGLE_II' || mo === 'MODERADA' || mo === '2', 'maloclusion_moderada');
    this.drawCheckbox(page, mo === 'ANGLE_III' || mo === 'SEVERA' || mo === '3', 'maloclusion_severa');
    const fl = String(this.val('fluorosis_leve') || '').toUpperCase().trim();
    this.drawCheckbox(page, fl === 'LEVE' || fl === '1', 'fluorosis_leve');
    this.drawCheckbox(page, fl === 'MODERADA' || fl === '2', 'fluorosis_moderada');
    this.drawCheckbox(page, fl === 'SEVERA' || fl === '3', 'fluorosis_severa');

    // ── Sección 8: CPO-ceo ──
    this.drawAutoFitText(page, this.numStr('cpo_D_c'), 'cpo_D_c', 9, 7);
    this.drawAutoFitText(page, this.numStr('cpo_D_p'), 'cpo_D_p', 9, 7);
    this.drawAutoFitText(page, this.numStr('cpo_D_o'), 'cpo_D_o', 9, 7);
    const cpo = hcl.indicesCpo || {};
    const totalPerma = (cpo.c_perma ?? 0) + (cpo.p_perma ?? 0) + (cpo.o_perma ?? 0);
    this.drawAutoFitText(page, cpo.total_perma != null ? String(cpo.total_perma) : String(totalPerma), 'cpo_D_total', 9, 7);
    this.drawAutoFitText(page, this.numStr('cpo_d_c'), 'cpo_d_c', 9, 7);
    this.drawAutoFitText(page, this.numStr('cpo_d_e'), 'cpo_d_e', 9, 7);
    this.drawAutoFitText(page, this.numStr('cpo_d_o'), 'cpo_d_o', 9, 7);
    const totalDeci = (cpo.c_deci ?? 0) + (cpo.e_deci ?? 0) + (cpo.o_deci ?? 0);
    this.drawAutoFitText(page, cpo.total_deci != null ? String(cpo.total_deci) : String(totalDeci), 'cpo_d_total', 9, 7);
  }

  // ────────────── PAGE 2 ──────────────

  private drawPage2(page: PDFPage): void {
    const hcl = this.hcl;

    // ── Sección 10: Planes ──
    this.drawCheckbox(page, !!this.val('plan_biometria'), 'plan_biometria');
    this.drawCheckbox(page, !!this.val('plan_quimica'), 'plan_quimica');
    this.drawCheckbox(page, !!this.val('plan_rayosx'), 'plan_rayosx');
    this.drawCheckbox(page, !!this.val('plan_otros'), 'plan_otros');
    const planText = [hcl.planTerapeutico, hcl.planEducacional, hcl.planOtrosTexto]
      .filter(Boolean).join('\n');
    this.drawAutoFitText(page, planText, 'plan_texto', 8, 6);

    // ── Sección 11: Diagnóstico CIE ──
    const cies = hcl.diagnosticosCie || [];
    for (let i = 0; i < Math.min(cies.length, 4); i++) {
      const n = i + 1;
      const texto = cies[i].presuntivo || cies[i].definitivo || '';
      this.drawAutoFitText(page, texto, `cie_${n}_texto`, 9, 7);
      this.drawAutoFitText(page, cies[i].codigo || '', `cie_${n}_codigo`, 9, 7);
      this.drawCheckbox(page, !!cies[i].presuntivo, `cie_${n}_pre`);
      this.drawCheckbox(page, !!cies[i].definitivo, `cie_${n}_def`);
    }

    // ── Metadatos ──
    this.drawAutoFitText(page, this.str('meta_apertura'), 'meta_apertura', 9, 7);
    this.drawAutoFitText(page, this.str('meta_control'), 'meta_control', 9, 7);
    this.drawAutoFitText(page, this.str('meta_profesional'), 'meta_profesional', 9, 7);
    this.drawAutoFitText(page, this.str('meta_codigo'), 'meta_codigo', 9, 5);
    this.drawAutoFitText(page, this.str('meta_firma'), 'meta_firma', 9, 7);
    this.drawAutoFitText(page, this.str('meta_hoja'), 'meta_hoja', 9, 7);

    // ── Sección 12: Tratamiento / Sesiones ──
    const sesiones = hcl.sesiones || [];
    for (let i = 0; i < Math.min(sesiones.length, 9); i++) {
      const n = i + 1;
      this.drawAutoFitText(page, sesiones[i].fecha || '', `ses_${n}_fecha`, 8, 6);
      this.drawAutoFitText(page, sesiones[i].diagnosticos || '', `ses_${n}_diag`, 8, 6);
      this.drawAutoFitText(page, sesiones[i].procedimientos || '', `ses_${n}_proc`, 8, 6);
      this.drawAutoFitText(page, sesiones[i].prescripciones || '', `ses_${n}_presc`, 8, 6);
      this.drawAutoFitText(page, sesiones[i].codigo || '', `ses_${n}_codigo`, 8, 6);
    }
  }

  // ────────────── MAIN ──────────────

  async generate(hcl: Hcl, patient: Patient, settings?: any, teeth?: any): Promise<Uint8Array> {
    await this.loadCoords();
    this.hcl = hcl;
    this.patient = patient;

    const doc = await PDFDocument.create();
    this.font = await doc.embedFont(StandardFonts.Helvetica);

    const resp1 = await fetch('assets/hc033-document/hc033-p1.png');
    const resp2 = await fetch('assets/hc033-document/hc033-p2.png');
    if (!resp1.ok || !resp2.ok) { throw new Error('Background images not found'); }

    const img1Bytes = await resp1.arrayBuffer();
    const img2Bytes = await resp2.arrayBuffer();

    doc.addPage([595.28, 841.89]);
    doc.addPage([595.28, 841.89]);

    await this.drawPageBg(doc, img1Bytes, 1);
    await this.drawPageBg(doc, img2Bytes, 2);

    const page1 = doc.getPage(0);
    const page2 = doc.getPage(1);

    this.drawPage1(page1);
    this.drawPage2(page2);

    return doc.save();
  }
}
